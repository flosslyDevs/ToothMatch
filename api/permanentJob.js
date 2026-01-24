import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import {
  createPermanentJob,
  getPermanentJobs,
  getPermanentJobById,
  updatePermanentJob,
  deletePermanentJob,
  getPublicPermanentJobs,
} from '../controllers/permanentJob.js';

const router = express.Router();

// Public route (no auth required) - for candidates to browse
router.get('/public/browse', getPublicPermanentJobs);

// Practice routes (authenticated)
router.use(authMiddleware);

// Create a new permanent job
router.post('/', createPermanentJob);

// Get all permanent jobs for the authenticated practice
router.get('/', getPermanentJobs);

// Get a specific permanent job by ID
router.get('/:id', getPermanentJobById);

// Update a permanent job
router.put('/:id', updatePermanentJob);

// Delete a permanent job
router.delete('/:id', deletePermanentJob);

export default router;
