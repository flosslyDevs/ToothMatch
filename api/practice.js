import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { createPracticeProfile, upsertPracticeProfile, getPracticeProfile, getAllUserProfiles, getSpecificPractice } from '../controllers/practice.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/profile', createPracticeProfile);
router.put('/profile', upsertPracticeProfile);
router.get('/profile', getPracticeProfile);
router.get('/user/:userId/profiles', getAllUserProfiles);
router.get('/:practiceId', getSpecificPractice);

export default router;



