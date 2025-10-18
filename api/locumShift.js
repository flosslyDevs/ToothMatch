import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import {
	createLocumShift,
	getLocumShifts,
	getLocumShiftById,
	updateLocumShift,
	deleteLocumShift,
	getPublicLocumShifts
} from '../controllers/locumShift.js';

const router = express.Router();

// Practice routes (authenticated)
router.use(authMiddleware);

// Create a new locum shift
router.post('/', createLocumShift);

// Get all locum shifts for the authenticated practice
router.get('/', getLocumShifts);

// Get a specific locum shift by ID
router.get('/:id', getLocumShiftById);

// Update a locum shift
router.put('/:id', updateLocumShift);

// Delete a locum shift
router.delete('/:id', deleteLocumShift);

// Public route (no auth required) - for candidates to browse
router.get('/public/browse', getPublicLocumShifts);

export default router;
