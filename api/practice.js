import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { upsertPracticeProfile, getPracticeProfile } from '../controllers/practice.js';

const router = express.Router();

router.use(authMiddleware);

router.put('/profile', upsertPracticeProfile);
router.get('/profile', getPracticeProfile);

export default router;



