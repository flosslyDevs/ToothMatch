import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import {
	createProfile,
	getProfile,
	addEducation,
	getEducations,
	addWorkExperience,
	getWorkExperiences,
	updateWorkPersonality,
	addSkills,
	addSpecializations,
	uploadMedia,
	getMedia,
	uploadIdentityDocument,
	getIdentityDocuments,
	updateJobPreferences,
	addAvailabilitySlot,
	getAvailabilitySlots,
	getAllSkills,
	getAllSpecializations,
	updateCompleteProfile,
	getCompleteProfile
} from '../controllers/profile.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Step 1-2: Basic Profile
router.post('/profile', createProfile);
router.get('/profile', getProfile);

// Step 3: Education
router.post('/education', addEducation);
router.get('/education', getEducations);

// Step 3: Work Experience
router.post('/experience', addWorkExperience);
router.get('/experience', getWorkExperiences);

// Step 4: Work Personality
router.put('/personality', updateWorkPersonality);

// Step 5: Skills and Specializations
router.post('/skills', addSkills);
router.post('/specializations', addSpecializations);
router.get('/skills/all', getAllSkills);
router.get('/specializations/all', getAllSpecializations);

// Step 6: Media
router.post('/media', uploadMedia);
router.get('/media', getMedia);

// Step 7: Identity Documents
router.post('/documents', uploadIdentityDocument);
router.get('/documents', getIdentityDocuments);

// Step 8: Job Preferences
router.put('/job-preferences', updateJobPreferences);

// Step 8: Availability
router.post('/availability', addAvailabilitySlot);
router.get('/availability', getAvailabilitySlots);

// Complete Profile (All Steps in One)
router.put('/complete', updateCompleteProfile);
router.get('/complete', getCompleteProfile);

export default router;
