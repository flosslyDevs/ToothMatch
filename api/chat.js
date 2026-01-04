import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { getChatHistory, getChats, sendMessage } from '../controllers/chat.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get chat history between authenticated user and a recipient
// GET /history?receiverId=xxx&beforeMessageId=xxx
router.get('/history', getChatHistory);

// Get chats list for the current user
// GET /
router.get('/', getChats);

// Send a message to a recipient
// POST /send
router.post('/send', sendMessage);

export default router;
