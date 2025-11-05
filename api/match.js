import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { likeTarget, getMatches } from '../controllers/match.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/like', likeTarget);
router.get('/matches', getMatches);

export default router;


