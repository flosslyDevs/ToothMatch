import express from 'express';
import { getEvents } from '../controllers/events.js';

const router = express.Router();

// Public: get all events (no pagination)
router.get('/', getEvents);

export default router;
