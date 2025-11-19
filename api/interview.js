import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { 
	scheduleInterview, 
	getCandidateInterviews, 
	getPracticeInterviews,
	getMyInterviews,
	requestReschedule,
	approveReschedule,
	declineInterview
} from '../controllers/interview.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Practice: Schedule an interview
router.post('/', scheduleInterview);

// Unified: Get interviews (auto-detects role - candidate or practice)
router.get('/', getMyInterviews);

// Candidate: Get their interviews (kept for backward compatibility)
router.get('/candidate', getCandidateInterviews);

// Practice: Get their scheduled interviews (kept for backward compatibility)
router.get('/practice', getPracticeInterviews);

// Candidate: Request reschedule for an interview
router.post('/:id/reschedule-request', requestReschedule);

// Practice: Approve reschedule and update interview date/time
router.put('/:id/reschedule', approveReschedule);

// Candidate: Decline an interview
router.post('/:id/decline', declineInterview);

export default router;

