import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { getChatHistory } from '../controllers/chat.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get chat history between authenticated user and a recipient
// GET /api/chat/history?receiverId=xxx&beforeMessageId=xxx
router.get('/history', getChatHistory);

export default router;

