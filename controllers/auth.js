import bcrypt from 'bcrypt';
import User from '../models/auth/users.js';
import {
  CandidateProfile,
  PracticeProfile,
  UserFCMToken,
} from '../models/index.js';
import { sendVerificationEmail } from '../utils/email.js';
import { signUserToken } from '../utils/jwt.js';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { Op } from 'sequelize';
import { logger as loggerRoot } from '../utils/logger.js';

const loggerBase = loggerRoot.child('controllers/auth.js');

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
  const logger = loggerBase.child('updateFCMTokenForUser');

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
        logger.info(
          `Token belongs to different user, reassigning to ${userId}`
        );
        await existingToken.destroy();
        token = await UserFCMToken.create({
          userId,
          fcmToken,
          deviceId: deviceId || null,
          deviceType: deviceType || null,
          lastUsedAt: new Date(),
        });
        action = 'Created (reassigned)';
      } else {
        // Token belongs to same user - update device info and lastUsedAt
        await existingToken.update({
          deviceId: deviceId || existingToken.deviceId,
          deviceType: deviceType || existingToken.deviceType,
          lastUsedAt: new Date(),
        });
        token = existingToken;
        action = 'Updated';
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
      action = 'Created';
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
        logger.info(
          `Removed ${deletedCount} old token(s) for user ${userId} on device ${deviceId}`
        );
      }
    }

    const deviceInfo = deviceId ? ` (device: ${deviceId})` : '';
    logger.info(`${action} FCM token for user ${userId}${deviceInfo}`);
  } catch (error) {
    // Log error but don't fail login if FCM token update fails
    logger.error(`Error updating FCM token for userId=${userId}`, error);
  }
}

export async function signupRequest(event) {
  const logger = loggerBase.child('signupRequest');
  const { email, fullName, mobileNumber, password, role } = getBody(event);
  if (!email || !fullName || !password) {
    logger.warn('Signup failed - missing required fields');
    return { status: 400, body: { message: 'Missing required fields' } };
  }
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      logger.warn('Signup failed - email already registered', { email });
      return { status: 409, body: { message: 'Email already registered' } };
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const user = await User.create({
      email,
      fullName,
      mobileNumber,
      passwordHash,
      verificationCode,
      role: role === 'practice' ? 'practice' : 'candidate',
    });
    let emailSendFailed = false;
    let emailError = null;
    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (err) {
      emailSendFailed = true;
      emailError =
        err?.message || err?.originalError || 'Email service unavailable';
      // Do not block signup on email failure
      logger.warn('Email verification failed to send', {
        userId: user.id,
        error: emailError,
      });
    }
    logger.info('User signup successful', { userId: user.id, role: user.role });
    return {
      status: 201,
      body: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailSendFailed,
        ...(emailSendFailed && emailError ? { emailError } : {}),
      },
    };
  } catch (error) {
    logger.error(
      'Signup failed',
      { email, error: error?.message || String(error) },
      error
    );
    return {
      status: 500,
      body: {
        message: 'Unable to complete signup',
        error: error?.message || String(error),
      },
    };
  }
}

export async function verifyEmail(event) {
  const logger = loggerBase.child('verifyEmail');
  const { email, code } = getBody(event);
  const user = await User.findOne({ where: { email } });
  if (!user || user.verificationCode !== code) {
    logger.warn('Email verification failed - invalid code');
    return { status: 400, body: { message: 'Invalid code' } };
  }
  user.isEmailVerified = true;
  user.verificationCode = null;
  await user.save();
  logger.debug('Email verification successful', { userId: user.id });
  return { status: 200, body: { message: 'Email verified' } };
}

export async function login(event) {
  const logger = loggerBase.child('login');
  const { email, password, fcmToken, deviceId, deviceType } = getBody(event);
  const user = await User.findOne({ where: { email } });
  if (!user) {
    logger.warn('Login failed - user not found');
    return { status: 401, body: { message: 'Invalid credentials' } };
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    logger.warn('Login failed - invalid password', { userId: user.id });
    return { status: 401, body: { message: 'Invalid credentials' } };
  }

  // Update FCM token if provided
  if (fcmToken) {
    try {
      await updateFCMTokenForUser(user.id, fcmToken, deviceId, deviceType);
    } catch (error) {
      logger.error('FCM token update failed during login', {
        userId: user.id,
        error: error.message,
      });
      return { status: 401, body: { message: error.message } };
    }
  }

  // Check if profile is complete
  let isProfileComplete = false;
  if (user.role === 'candidate') {
    const profile = await CandidateProfile.findOne({
      where: { userId: user.id },
    });
    isProfileComplete = profile?.profileCompletion === true;
  } else if (user.role === 'practice') {
    const profile = await PracticeProfile.findOne({
      where: { userId: user.id },
    });
    isProfileComplete = profile?.profileCompletion === true;
  }

  const token = signUserToken(user);
  logger.info('Login successful', { userId: user.id, role: user.role });
  return {
    status: 200,
    body: {
      token,
      user: { id: user.id, email: user.email, role: user.role },
      isProfileComplete,
    },
  };
}

// Google OAuth signup/login
export async function googleAuth(event) {
  const logger = loggerBase.child('googleAuth');
  const {
    idToken,
    fullName,
    mobileNumber,
    role,
    fcmToken,
    deviceId,
    deviceType,
  } = getBody(event);
  if (!idToken) {
    logger.warn('Google auth failed - missing idToken');
    return { status: 400, body: { message: 'Missing idToken' } };
  }

  // Validate that idToken looks like a JWT (should have 3 segments separated by dots)
  const tokenSegments = idToken.split('.');
  if (tokenSegments.length !== 3) {
    logger.warn('Google auth failed - invalid JWT format');
    return {
      status: 400,
      body: {
        message:
          'Invalid idToken format. Expected a JWT token with 3 segments.',
        hint: 'Make sure you are sending the idToken from GoogleSignIn authentication result, not the Client ID or access token.',
      },
    };
  }

  try {
    const clientIds = process.env.GOOGLE_CLIENT_ID.split(',');
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({ idToken, audience: clientIds });
    const payload = ticket.getPayload();
    const email = payload.email;
    const sub = payload.sub;
    logger.debug('Google token verified successfully', { sub });
    let user = await User.findOne({
      where: { oauthProvider: 'google', oauthSubject: sub },
    });
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
      logger.info('New user created via Google OAuth', {
        userId: user.id,
        role: user.role,
      });
    } else {
      user.oauthProvider = 'google';
      user.oauthSubject = sub;
      if (!user.isEmailVerified) user.isEmailVerified = true;
      await user.save();
      logger.info('Existing user updated with Google OAuth', {
        userId: user.id,
      });
    }

    // Update FCM token if provided
    if (fcmToken) {
      try {
        await updateFCMTokenForUser(user.id, fcmToken, deviceId, deviceType);
      } catch (error) {
        logger.error(
          'FCM token update failed during Google auth',
          { userId: user.id, error: error.message },
          error
        );
        return { status: 401, body: { message: error.message } };
      }
    }

    // Check if profile is complete
    let isProfileComplete = false;
    if (user.role === 'candidate') {
      const profile = await CandidateProfile.findOne({
        where: { userId: user.id },
      });
      isProfileComplete = profile?.profileCompletion === true;
    } else if (user.role === 'practice') {
      const profile = await PracticeProfile.findOne({
        where: { userId: user.id },
      });
      isProfileComplete = profile?.profileCompletion === true;
    }

    const token = signUserToken(user);
    logger.info('Google auth successful', { userId: user.id, role: user.role });
    return {
      status: 200,
      body: {
        token,
        user: { id: user.id, email: user.email, role: user.role },
        isProfileComplete,
      },
    };
  } catch (error) {
    // Handle JWT verification errors
    if (error.message && error.message.includes('Wrong number of segments')) {
      logger.warn('Google auth failed - invalid JWT format');
      return {
        status: 400,
        body: {
          message:
            'Invalid idToken format. The token must be a valid JWT with 3 segments.',
          error: error.message,
          hint: 'Ensure you are sending the idToken from GoogleSignIn.signIn() result, not the Client ID or access token. Example: GoogleSignInAuthentication.idToken',
        },
      };
    }
    logger.error(
      'Google authentication failed',
      { error: error.message },
      error
    );
    return {
      status: 401,
      body: {
        message: 'Google authentication failed',
        error: error.message,
      },
    };
  }
}

// Apple OAuth signup/login
export async function appleAuth(event) {
  const logger = loggerBase.child('appleAuth');
  logger.debug('Received event for Apple login/signup');
  const {
    idToken,
    fullName,
    mobileNumber,
    role,
    fcmToken,
    deviceId,
    deviceType,
  } = getBody(event);

  if (!idToken) {
    logger.warn('Missing idToken');
    return { status: 400, body: { message: 'Missing idToken' } };
  }

  logger.debug('Verifying idToken with Apple');
  const payload = await appleSignin.verifyIdToken(idToken, {
    audience: process.env.APPLE_CLIENT_ID,
    ignoreExpiration: false,
  });

  const email = payload.email;
  const sub = payload.sub;
  logger.debug(`Apple idToken verified`, { sub });

  let user = await User.findOne({
    where: { oauthProvider: 'apple', oauthSubject: sub },
  });

  if (!user && email) {
    logger.debug('No user found by sub, searching by email');
    user = await User.findOne({ where: { email } });
  }
  if (!user) {
    logger.info(`Creating new user for Apple OAuth`, { role });
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
    logger.info(`Updating existing user with Apple OAuth`, { userId: user.id });
    user.oauthProvider = 'apple';
    user.oauthSubject = sub;
    if (!user.isEmailVerified) user.isEmailVerified = true;
    await user.save();
  }

  // Update FCM token if provided
  if (fcmToken) {
    try {
      logger.debug(`Updating FCM token for user`, { userId: user.id });
      await updateFCMTokenForUser(user.id, fcmToken, deviceId, deviceType);
    } catch (error) {
      logger.error(`FCM token update failed`, {
        userId: user.id,
        error: error.message,
      });
      return { status: 401, body: { message: error.message } };
    }
  }

  // Check if profile is complete
  let isProfileComplete = false;
  if (user.role === 'candidate') {
    logger.debug(`Checking candidate profile`, { userId: user.id });
    const profile = await CandidateProfile.findOne({
      where: { userId: user.id },
    });
    isProfileComplete = profile?.profileCompletion === true;
  } else if (user.role === 'practice') {
    logger.debug(`Checking practice profile`, { userId: user.id });
    const profile = await PracticeProfile.findOne({
      where: { userId: user.id },
    });
    isProfileComplete = profile?.profileCompletion === true;
  }

  const token = signUserToken(user);
  logger.info(`Apple auth process complete`, {
    userId: user.id,
    role: user.role,
  });

  const body = {
    token,
    user: { id: user.id, email: user.email, role: user.role },
    isProfileComplete,
  };

  logger.debug('Apple auth successful', body);
  return { status: 200, body };
}

export async function forgetPasswordRequest(event) {
  const logger = loggerBase.child('forgetPasswordRequest');
  const { email } = getBody(event);
  if (!email) {
    logger.warn('Password reset request failed - email missing');
    return { status: 400, body: { message: 'Email is required' } };
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn('Password reset request failed - user not found', { email });
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
      emailError =
        err?.message || err?.originalError || 'Email service unavailable';
      logger.warn('Password reset email failed to send', {
        userId: user.id,
        error: emailError,
      });
    }
    logger.info('Password reset code generated', { userId: user.id });
    return {
      status: 200,
      body: {
        message: 'Reset code processed',
        emailSendFailed,
        ...(emailSendFailed && emailError ? { emailError } : {}),
      },
    };
  } catch (error) {
    logger.error(
      'Password reset request failed',
      { email, error: error?.message || String(error) },
      error
    );
    return {
      status: 500,
      body: {
        message: 'Unable to process reset code',
        error: error?.message || String(error),
      },
    };
  }
}

export async function resetPassword(event) {
  const logger = loggerBase.child('resetPassword');
  const { email, code, newPassword } = getBody(event);
  if (!email || !code || !newPassword) {
    logger.warn('Password reset failed - missing required fields');
    return { status: 400, body: { message: 'Missing required fields' } };
  }
  const user = await User.findOne({ where: { email } });
  if (!user || user.verificationCode !== code) {
    logger.warn('Password reset failed - invalid code', { userId: user?.id });
    return { status: 400, body: { message: 'Invalid reset code' } };
  }
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.verificationCode = null;
    await user.save();
    logger.info('Password reset successful', { userId: user.id });
    return { status: 200, body: { message: 'Password reset successfully' } };
  } catch (error) {
    logger.error(
      'Password reset failed',
      { userId: user.id, error: error.message },
      error
    );
    return { status: 500, body: { message: 'Unable to reset password' } };
  }
}
export async function logout(req, res) {
  const logger = loggerBase.child('logout');
  const { fcmToken, deviceId } = req.body;
  const userId = req.user.sub;

  // Verify user ID is present
  if (!userId) {
    logger.error('User ID is required');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Clear FCM Token if provided
  if (fcmToken) {
    try {
      const destroyed = await UserFCMToken.destroy({
        where: { userId, fcmToken },
      });
      logger.info('FCM token destroyed', { count: destroyed });
    } catch (error) {
      logger.error('Error destroying FCM token by token', {
        error: error.message,
      });
    }
  } else if (deviceId) {
    try {
      const destroyed = await UserFCMToken.destroy({
        where: { userId, deviceId },
      });
      logger.info('Device FCM token destroyed', { count: destroyed });
    } catch (error) {
      logger.error('Error destroying device FCM token by deviceId', {
        error: error.message,
      });
    }
  }

  return res.status(200).json({ message: 'Logged out successfully' });
}

export async function resendOtp(event) {
  const logger = loggerBase.child('resendOtp');
  const { email } = getBody(event);
  if (!email) {
    logger.warn('OTP resend failed - email missing');
    return { status: 400, body: { message: 'Email is required' } };
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      logger.warn('OTP resend failed - user not found', { email });
      return { status: 404, body: { message: 'User not found' } };
    }
    if (user.isEmailVerified) {
      logger.warn('OTP resend failed - email already verified', {
        userId: user.id,
      });
      return { status: 400, body: { message: 'Email is already verified' } };
    }
    // Generate new verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    user.verificationCode = verificationCode;
    await user.save();
    let emailSendFailed = false;
    let emailError = null;
    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (err) {
      emailSendFailed = true;
      emailError =
        err?.message || err?.originalError || 'Email service unavailable';
      logger.warn('OTP resend email failed to send', {
        userId: user.id,
        error: emailError,
      });
    }
    logger.info('OTP resend successful', { userId: user.id });
    return {
      status: 200,
      body: {
        message: 'OTP processed',
        emailSendFailed,
        ...(emailSendFailed && emailError ? { emailError } : {}),
      },
    };
  } catch (error) {
    logger.error(
      'OTP resend failed',
      { email, error: error?.message || String(error) },
      error
    );
    return {
      status: 500,
      body: {
        message: 'Unable to resend OTP',
        error: error?.message || String(error),
      },
    };
  }
}
