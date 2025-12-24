import express from 'express';
import {
	forgetPasswordRequest,
	login,
	logout,
	resendOtp,
	resetPassword,
	signupRequest,
	verifyEmail,
	googleAuth,
	appleAuth,
	addFCMToken,
} from '../controllers/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
	const result = await login({ req, body: req.body });
	return res.status(result?.status || 200).json(result?.body ?? result);
});

router.post('/signup', async (req, res) => {
	const result = await signupRequest({ req, body: req.body });
	return res.status(result?.status || 201).json(result?.body ?? result);
});

router.post('/verify-email', async (req, res) => {
	const result = await verifyEmail({ req, body: req.body });
	return res.status(result?.status || 200).json(result?.body ?? result);
});

router.post('/resend-otp', async (req, res) => {
	const result = await resendOtp({ req, body: req.body });
	return res.status(result?.status || 200).json(result?.body ?? result);
});

router.post('/forgot-password', async (req, res) => {
	const result = await forgetPasswordRequest({ req, body: req.body });
	return res.status(result?.status || 200).json(result?.body ?? result);
});

router.post('/reset-password', async (req, res) => {
	const result = await resetPassword({ req, body: req.body });
	return res.status(result?.status || 200).json(result?.body ?? result);
});

router.post('/logout', async (req, res) => {
	const result = await logout({ req, body: req.body });
	return res.status(result?.status || 200).json(result?.body ?? result);
});

// OAuth
router.post('/google', async (req, res) => {
	const result = await googleAuth({ req, body: req.body });
	return res.status(result?.status || 200).json(result?.body ?? result);
});

router.post('/apple', async (req, res) => {
	const result = await appleAuth({ req, body: req.body });
	return res.status(result?.status || 200).json(result?.body ?? result);
});

// Add FCM token for push notifications
// POST /fcm-token
router.post("/add-fcm-token", addFCMToken);

export default router;
