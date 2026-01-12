import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import {
  createPracticeProfile,
  upsertPracticeProfile,
  getPracticeProfile,
  getAllUserProfiles,
  getSpecificPractice,
  ratePractice,
} from '../controllers/practice.js';

const router = express.Router();

// Public route - Get practice by ID (for candidates to view practices)
router.get('/:practiceId', getSpecificPractice);

// Apply auth middleware to all routes below
router.use(authMiddleware);

router.post('/profile', createPracticeProfile);
router.put('/profile', upsertPracticeProfile);
router.get('/profile', getPracticeProfile);
router.get('/user/:userId/profiles', getAllUserProfiles);
router.post('/rate/:practiceId', ratePractice);

export default router;
