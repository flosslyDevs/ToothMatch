import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { scheduleInterview, getCandidateInterviews, getPracticeInterviews } from '../controllers/interview.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Practice: Schedule an interview
router.post('/', scheduleInterview);

// Candidate: Get their interviews
router.get('/candidate', getCandidateInterviews);

// Practice: Get their scheduled interviews
router.get('/practice', getPracticeInterviews);

export default router;

