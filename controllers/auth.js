import bcrypt from 'bcrypt';
import User from '../models/auth/users.js';
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
	await sendVerificationEmail(email, verificationCode);
	return { status: 201, body: { id: user.id, email: user.email, role: user.role } };
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
	const token = signUserToken(user);
	return { status: 200, body: { token, user: { id: user.id, email: user.email, role: user.role } } };
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
	const token = signUserToken(user);
	return { status: 200, body: { token, user: { id: user.id, email: user.email, role: user.role } } };
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
	const token = signUserToken(user);
	return { status: 200, body: { token, user: { id: user.id, email: user.email, role: user.role } } };
}

export async function forgetPasswordRequest(event) {
	const { email } = getBody(event);
	if (!email) {
		return { status: 400, body: { message: 'Email is required' } };
	}
	const user = await User.findOne({ where: { email } });
	if (!user) {
		return { status: 404, body: { message: 'User not found' } };
	}
	const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
	user.verificationCode = resetCode;
	await user.save();
	await sendVerificationEmail(email, resetCode);
	return { status: 200, body: { message: 'Reset code sent to email' } };
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

export async function profile() { return { status: 501, body: { message: 'Not implemented' } }; }
export async function userLoginHistory() { return { status: 501, body: { message: 'Not implemented' } }; }
export async function updateProfile() { return { status: 501, body: { message: 'Not implemented' } }; }
export async function updatePassword() { return { status: 501, body: { message: 'Not implemented' } }; }



