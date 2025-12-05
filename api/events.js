import express from 'express';
import { getEvents } from '../controllers/events.js';
import { authMiddleware } from '../utils/auth.js';
import { bookEvent, getBookings } from '../controllers/events.js';

const router = express.Router();

// Public: get all events (no pagination)
router.get('/', getEvents);

router.use(authMiddleware);

router.put('/book/:eventId', bookEvent);

router.get('/bookings', getBookings);

export default router;
