import bcrypt from 'bcrypt';
import User from '../models/auth/users.js';
import { CandidateProfile, PracticeProfile, UserFCMToken } from '../models/index.js';
import { sendVerificationEmail } from '../utils/email.js';
import { signUserToken } from '../utils/jwt.js';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { Op } from 'sequelize';

function getBody(event) {
	return event?.body || event?.req?.body || {};
}

const deviceTypes = ['ios', 'android', 'web', 'other'];

/**
 * Helper function to update FCM token for a user
 * @param {string} userId - User ID
 * @param {string} fcmToken - FCM token (required)
 * @param {string} deviceId - Device ID (optional)
 * @param {string} deviceType - Device type (optional)
 */
async function updateFCMTokenForUser(userId, fcmToken, deviceId, deviceType) {
	if (!fcmToken) {
		throw new Error('FCM token is required');
	}

	if (!userId) {
		throw new Error('User ID is required');
	}

	if (deviceType && !deviceTypes.includes(deviceType)) {
		throw new Error('Device type must be one of: ' + deviceTypes.join(', '));
	}

	try {
		// Find existing token by fcmToken
		const existingToken = await UserFCMToken.findOne({
			where: { fcmToken },
		});

		let token;
		let action;

		if (existingToken) {
			// Token exists - check ownership
			if (existingToken.userId !== userId) {
				// Token belongs to different user - delete old token and create new one
				// This prevents token hijacking and ensures proper ownership
				console.log(
					`[updateFCMToken] Token belongs to different user, reassigning to ${userId}`
				);
				await existingToken.destroy();
				token = await UserFCMToken.create({
					userId,
					fcmToken,
					deviceId: deviceId || null,
					deviceType: deviceType || null,
					lastUsedAt: new Date(),
				});
				action = "Created (reassigned)";
			} else {
				// Token belongs to same user - update device info and lastUsedAt
				await existingToken.update({
					deviceId: deviceId || existingToken.deviceId,
					deviceType: deviceType || existingToken.deviceType,
					lastUsedAt: new Date(),
				});
				token = existingToken;
				action = "Updated";
			}
		} else {
			// Token doesn't exist - create new one
			token = await UserFCMToken.create({
				userId,
				fcmToken,
				deviceId: deviceId || null,
				deviceType: deviceType || null,
				lastUsedAt: new Date(),
			});
			action = "Created";
		}

		// If deviceId is provided, remove old tokens for this user+device combination
		if (deviceId) {
			const deletedCount = await UserFCMToken.destroy({
				where: {
					userId,
					deviceId,
					id: { [Op.ne]: token.id },
				},
			});
			if (deletedCount > 0) {
				console.log(
					`[updateFCMToken] Removed ${deletedCount} old token(s) for user ${userId} on device ${deviceId}`
				);
			}
		}

		const deviceInfo = deviceId ? ` (device: ${deviceId})` : "";
		console.log(
			`[updateFCMToken] ${action} FCM token for user ${userId}${deviceInfo}`
		);
	} catch (error) {
		// Log error but don't fail login if FCM token update fails
		console.error(
			`[updateFCMToken] Error updating FCM token for userId=${userId}. Error:`,
			error
		);
	}
}

export async function signupRequest(event) {
	const { email, fullName, mobileNumber, password, role } = getBody(event);
	if (!email || !fullName || !password) {
		return { status: 400, body: { message: 'Missing required fields' } };
	}
	try {
		const existing = await User.findOne({ where: { email } });
	if (existing) {
		return { status: 409, body: { message: 'Email already registered' } };
	}
		const passwordHash = await bcrypt.hash(password, 10);
		const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
		const user = await User.create({ 
			email, 
			fullName, 
			mobileNumber, 
			passwordHash, 
			verificationCode,
			role: role === 'practice' ? 'practice' : 'candidate'
		});
		let emailSendFailed = false;
		let emailError = null;
		try {
			await sendVerificationEmail(email, verificationCode);
		} catch (err) {
			emailSendFailed = true;
			emailError = err?.message || err?.originalError || 'Email service unavailable';
			// Do not block signup on email failure
			// eslint-disable-next-line no-console
			console.error('Signup email send failed:', emailError);
		}
		return { 
			status: 201, 
			body: { 
				id: user.id, 
				email: user.email, 
				role: user.role, 
				emailSendFailed,
				...(emailSendFailed && emailError ? { emailError } : {})
			} 
		};
	} catch (error) {
		return { status: 500, body: { message: 'Unable to complete signup', error: error?.message || String(error) } };
	}
}

export async function verifyEmail(event) {
	const { email, code } = getBody(event);
	const user = await User.findOne({ where: { email } });
	if (!user || user.verificationCode !== code) {
		return { status: 400, body: { message: 'Invalid code' } };
	}
	user.isEmailVerified = true;
	user.verificationCode = null;
	await user.save();
	return { status: 200, body: { message: 'Email verified' } };
}

export async function login(event) {
	const { email, password, fcmToken, deviceId, deviceType } = getBody(event);
	const user = await User.findOne({ where: { email } });
	if (!user) {
		return { status: 401, body: { message: 'Invalid credentials' } };
	}
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) {
		return { status: 401, body: { message: 'Invalid credentials' } };
	}
	
	// Update FCM token if provided
	if (fcmToken) {
		try {
			await updateFCMTokenForUser(user.id, fcmToken, deviceId, deviceType);
		} catch (error) {
			return { status: 401, body: { message: error.message } };
		}
	}
	
	// Check if profile is complete
	let isProfileComplete = false;
	if (user.role === 'candidate') {
		const profile = await CandidateProfile.findOne({ where: { userId: user.id } });
		isProfileComplete = profile?.profileCompletion === true;
	} else if (user.role === 'practice') {
		const profile = await PracticeProfile.findOne({ where: { userId: user.id } });
		isProfileComplete = profile?.profileCompletion === true;
	}
	
	const token = signUserToken(user);
	return { status: 200, body: { token, user: { id: user.id, email: user.email, role: user.role }, isProfileComplete } };
}

// Google OAuth signup/login
export async function googleAuth(event) {
	const { idToken, fullName, mobileNumber, role, fcmToken, deviceId, deviceType } = getBody(event);
	if (!idToken) return { status: 400, body: { message: 'Missing idToken' } };
	
	// Validate that idToken looks like a JWT (should have 3 segments separated by dots)
	const tokenSegments = idToken.split('.');
	if (tokenSegments.length !== 3) {
		return { 
			status: 400, 
			body: { 
				message: 'Invalid idToken format. Expected a JWT token with 3 segments.',
				hint: 'Make sure you are sending the idToken from GoogleSignIn authentication result, not the Client ID or access token.'
			} 
		};
	}
	
	try {
		const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
		const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
		const payload = ticket.getPayload();
		const email = payload.email;
		const sub = payload.sub;
		let user = await User.findOne({ where: { oauthProvider: 'google', oauthSubject: sub } });
		if (!user) {
			user = await User.findOne({ where: { email } });
		}
		if (!user) {
			user = await User.create({
				email,
				fullName: fullName || payload.name || email,
				mobileNumber: mobileNumber || null,
				isEmailVerified: true,
				oauthProvider: 'google',
				oauthSubject: sub,
				role: role === 'practice' ? 'practice' : 'candidate',
			});
		} else {
			user.oauthProvider = 'google';
			user.oauthSubject = sub;
			if (!user.isEmailVerified) user.isEmailVerified = true;
			await user.save();
		}
		
		// Update FCM token if provided
		if (fcmToken) {
			try {
				await updateFCMTokenForUser(user.id, fcmToken, deviceId, deviceType);
			} catch (error) {
				return { status: 401, body: { message: error.message } };
			}
		}
		
		// Check if profile is complete
		let isProfileComplete = false;
		if (user.role === 'candidate') {
			const profile = await CandidateProfile.findOne({ where: { userId: user.id } });
			isProfileComplete = profile?.profileCompletion === true;
		} else if (user.role === 'practice') {
			const profile = await PracticeProfile.findOne({ where: { userId: user.id } });
			isProfileComplete = profile?.profileCompletion === true;
		}
		
		const token = signUserToken(user);
		return { status: 200, body: { token, user: { id: user.id, email: user.email, role: user.role }, isProfileComplete } };
	} catch (error) {
		// Handle JWT verification errors
		if (error.message && error.message.includes('Wrong number of segments')) {
			return { 
				status: 400, 
				body: { 
					message: 'Invalid idToken format. The token must be a valid JWT with 3 segments.',
					error: error.message,
					hint: 'Ensure you are sending the idToken from GoogleSignIn.signIn() result, not the Client ID or access token. Example: GoogleSignInAuthentication.idToken'
				} 
			};
		}
		return { 
			status: 401, 
			body: { 
				message: 'Google authentication failed', 
				error: error.message 
			} 
		};
	}
}

// Apple OAuth signup/login
export async function appleAuth(event) {
	const { idToken, fullName, mobileNumber, role, fcmToken, deviceId, deviceType } = getBody(event);
	if (!idToken) return { status: 400, body: { message: 'Missing idToken' } };
	const payload = await appleSignin.verifyIdToken(idToken, {
		audience: process.env.APPLE_CLIENT_ID,
		ignoreExpiration: false,
	});
	const email = payload.email;
	const sub = payload.sub;
	let user = await User.findOne({ where: { oauthProvider: 'apple', oauthSubject: sub } });
	if (!user && email) {
		user = await User.findOne({ where: { email } });
	}
	if (!user) {
		user = await User.create({
			email,
			fullName: fullName || email || 'Apple User',
			mobileNumber: mobileNumber || null,
			isEmailVerified: true,
			oauthProvider: 'apple',
			oauthSubject: sub,
			role: role === 'practice' ? 'practice' : 'candidate',
		});
	} else {
		user.oauthProvider = 'apple';
		user.oauthSubject = sub;
		if (!user.isEmailVerified) user.isEmailVerified = true;
		await user.save();
	}
	
	// Update FCM token if provided
	if (fcmToken) {
		try {
			await updateFCMTokenForUser(user.id, fcmToken, deviceId, deviceType);
		} catch (error) {
			return { status: 401, body: { message: error.message } };
		}
	}
	
	// Check if profile is complete
	let isProfileComplete = false;
	if (user.role === 'candidate') {
		const profile = await CandidateProfile.findOne({ where: { userId: user.id } });
		isProfileComplete = profile?.profileCompletion === true;
	} else if (user.role === 'practice') {
		const profile = await PracticeProfile.findOne({ where: { userId: user.id } });
		isProfileComplete = profile?.profileCompletion === true;
	}
	
	const token = signUserToken(user);
	return { status: 200, body: { token, user: { id: user.id, email: user.email, role: user.role }, isProfileComplete } };
}

export async function forgetPasswordRequest(event) {
	const { email } = getBody(event);
	if (!email) {
		return { status: 400, body: { message: 'Email is required' } };
	}
	try {
		const user = await User.findOne({ where: { email } });
		if (!user) {
			return { status: 404, body: { message: 'User not found' } };
		}
		const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
		user.verificationCode = resetCode;
		await user.save();
		let emailSendFailed = false;
		let emailError = null;
		try {
			await sendVerificationEmail(email, resetCode);
		} catch (err) {
			emailSendFailed = true;
			emailError = err?.message || err?.originalError || 'Email service unavailable';
			// eslint-disable-next-line no-console
			console.error('Forgot password email send failed:', emailError);
		}
		return { 
			status: 200, 
			body: { 
				message: 'Reset code processed', 
				emailSendFailed,
				...(emailSendFailed && emailError ? { emailError } : {})
			} 
		};
	} catch (error) {
		return { status: 500, body: { message: 'Unable to process reset code', error: error?.message || String(error) } };
	}
}

export async function resetPassword(event) {
	const { email, code, newPassword } = getBody(event);
	if (!email || !code || !newPassword) {
		return { status: 400, body: { message: 'Missing required fields' } };
	}
	const user = await User.findOne({ where: { email } });
	if (!user || user.verificationCode !== code) {
		return { status: 400, body: { message: 'Invalid reset code' } };
	}
	const passwordHash = await bcrypt.hash(newPassword, 10);
	user.passwordHash = passwordHash;
	user.verificationCode = null;
	await user.save();
	return { status: 200, body: { message: 'Password reset successfully' } };
}
export async function logout(event) {
	const { fcmToken, deviceId } = getBody(event);
	const userId = event.user.sub;
	if (!userId) {
		console.error('[logout] User ID is required');
	}
	if (fcmToken) {
		try {
			const destroyed = await UserFCMToken.destroy({ where: { userId, fcmToken } });
			console.log('[logout] FCM token destroyed:', destroyed);
		} catch (error) {
			console.error('[logout] Error destroying FCM token By FCMToken:', error);
		}
	}
	else if (deviceId) {
		try {
			const destroyed = await UserFCMToken.destroy({ where: { userId, deviceId } });
			console.log('[logout] Device FCM token destroyed:', destroyed);
		} catch (error) {
			console.error('[logout] Error destroying device FCM token By DeviceID:', error);
		}
	}
	return { status: 200, body: { message: 'Logged out successfully' } };
}

export async function resendOtp(event) {
	const { email } = getBody(event);
	if (!email) {
		return { status: 400, body: { message: 'Email is required' } };
	}
	try {
		const user = await User.findOne({ where: { email } });
		if (!user) {
			return { status: 404, body: { message: 'User not found' } };
		}
		if (user.isEmailVerified) {
			return { status: 400, body: { message: 'Email is already verified' } };
		}
		// Generate new verification code
		const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
		user.verificationCode = verificationCode;
		await user.save();
		let emailSendFailed = false;
		let emailError = null;
		try {
			await sendVerificationEmail(email, verificationCode);
		} catch (err) {
			emailSendFailed = true;
			emailError = err?.message || err?.originalError || 'Email service unavailable';
			// eslint-disable-next-line no-console
			console.error('Resend OTP email send failed:', emailError);
		}
		return { 
			status: 200, 
			body: { 
				message: 'OTP processed', 
				emailSendFailed,
				...(emailSendFailed && emailError ? { emailError } : {})
			} 
		};
	} catch (error) {
		return { status: 500, body: { message: 'Unable to resend OTP', error: error?.message || String(error) } };
	}
}
