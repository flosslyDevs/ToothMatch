import express from 'express';
import { getPractitionerJobs, getAllActiveJobs } from '../controllers/jobs.js';

const router = express.Router();

// Public route - Get all jobs for a specific practitioner
router.get('/practitioner/:practitionerId', getPractitionerJobs);

// Public route - Get all active jobs (both locum and permanent)
router.get('/public/all', getAllActiveJobs);

export default router;
