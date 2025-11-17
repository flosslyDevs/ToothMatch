import bcrypt from 'bcrypt';
import User from '../models/auth/users.js';
import { CandidateProfile, PracticeProfile } from '../models/index.js';
import { sendVerificationEmail } from '../utils/email.js';
import { signUserToken } from '../utils/jwt.js';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

function getBody(event) {
	return event?.body || event?.req?.body || {};
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
	const { email, password } = getBody(event);
	const user = await User.findOne({ where: { email } });
	if (!user) {
		return { status: 401, body: { message: 'Invalid credentials' } };
	}
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) {
		return { status: 401, body: { message: 'Invalid credentials' } };
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
	const { idToken, fullName, mobileNumber, role } = getBody(event);
	if (!idToken) return { status: 400, body: { message: 'Missing idToken' } };
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

// Apple OAuth signup/login
export async function appleAuth(event) {
	const { idToken, fullName, mobileNumber, role } = getBody(event);
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
	// For JWT-based auth, logout is typically handled client-side by discarding the token
	// This endpoint can be used for logging purposes or future token blacklisting
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

export async function profile() { return { status: 501, body: { message: 'Not implemented' } }; }
export async function userLoginHistory() { return { status: 501, body: { message: 'Not implemented' } }; }
export async function updateProfile() { return { status: 501, body: { message: 'Not implemented' } }; }
export async function updatePassword() { return { status: 501, body: { message: 'Not implemented' } }; }



