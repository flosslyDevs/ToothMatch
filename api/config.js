import express from 'express';
import { getConfig } from '../controllers/config.js';

const router = express.Router();

// Public config endpoint - no authentication required
router.get('/public', async (req, res) => {
  const result = await getConfig();
  return res.status(result?.status || 200).json(result?.body ?? result);
});

export default router;
