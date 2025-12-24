import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { getPractitionerJobs, getAllJobs, filterJobsForCandidates, filterCandidatesForPractices, activateJob, pauseJob } from '../controllers/jobs.js';

const router = express.Router();

// Public route - Get all jobs for a specific practitioner
router.get('/practitioner/:practitionerId', getPractitionerJobs);

// Public route - Get all active jobs (both locum and permanent)
router.get('/public/all', getAllJobs);

// Public route - Filter jobs for candidates with multiple filter options
router.get('/public/filter', filterJobsForCandidates);

// Public route - Filter candidates for practices
router.get('/public/candidates/filter', filterCandidatesForPractices);

// Authenticated job routes below
router.use(authMiddleware);

// Activate a job
router.post('/activate/:jobId', activateJob);

// Pause a job
router.post('/pause/:jobId', pauseJob);

export default router;
