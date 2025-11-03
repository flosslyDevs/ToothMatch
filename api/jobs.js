import express from 'express';
import { getPractitionerJobs, getAllActiveJobs, filterJobsForCandidates, filterCandidatesForPractices } from '../controllers/jobs.js';

const router = express.Router();

// Public route - Get all jobs for a specific practitioner
router.get('/practitioner/:practitionerId', getPractitionerJobs);

// Public route - Get all active jobs (both locum and permanent)
router.get('/public/all', getAllActiveJobs);

// Public route - Filter jobs for candidates with multiple filter options
router.get('/public/filter', filterJobsForCandidates);

// Public route - Filter candidates for practices
router.get('/public/candidates/filter', filterCandidatesForPractices);

export default router;
