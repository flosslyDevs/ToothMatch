import { Interview, User, PracticeProfile, CandidateProfile } from '../models/index.js';
import { Op } from 'sequelize';

// Schedule an interview (Practice side)
export async function scheduleInterview(req, res) {
	const practiceUserId = req.user.sub;
	const {
		candidateUserId,
		meetingType, // "Video", "Inperson", "Call"
		location, // "Online", "Office"
		date, // string
		time, // string in 24-hour format (e.g., "14:30")
		notes
	} = req.body;

	try {
		// Validate required fields
		if (!candidateUserId || !meetingType || !location || !date || !time) {
			return res.status(400).json({ 
				message: 'Missing required fields: candidateUserId, meetingType, location, date, and time are required' 
			});
		}

		// Validate meetingType enum
		if (!['Video', 'Inperson', 'Call'].includes(meetingType)) {
			return res.status(400).json({ 
				message: 'Invalid meetingType. Must be one of: Video, Inperson, Call' 
			});
		}

		// Validate location enum
		if (!['Online', 'Office'].includes(location)) {
			return res.status(400).json({ 
				message: 'Invalid location. Must be one of: Online, Office' 
			});
		}

		// Validate time format (24-hour format: HH:MM)
		const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (!timeRegex.test(time)) {
			return res.status(400).json({ 
				message: 'Invalid time format. Use 24-hour format (HH:MM), e.g., "14:30"' 
			});
		}

		// Verify candidate exists
		const candidate = await User.findByPk(candidateUserId);
		if (!candidate || candidate.role !== 'candidate') {
			return res.status(404).json({ message: 'Candidate not found' });
		}

		// Verify practice user exists and is a practice
		const practice = await User.findByPk(practiceUserId);
		if (!practice || practice.role !== 'practice') {
			return res.status(403).json({ message: 'Only practices can schedule interviews' });
		}

		// Create the interview
		const interview = await Interview.create({
			practiceUserId,
			candidateUserId,
			meetingType,
			location,
			date,
			time,
			notes: notes || null,
			status: 'scheduled'
		});

		// Fetch interview with related data
		const interviewWithDetails = await Interview.findByPk(interview.id, {
			include: [
				{
					model: User,
					as: 'Practice',
					attributes: ['id', 'email'],
					include: [{
						model: PracticeProfile,
						attributes: ['id', 'clinicType', 'phoneNumber']
					}]
				},
				{
					model: User,
					as: 'Candidate',
					attributes: ['id', 'email'],
					include: [{
						model: CandidateProfile,
						attributes: ['id', 'fullName', 'jobTitle']
					}]
				}
			]
		});

		return res.status(201).json({ 
			message: 'Interview scheduled successfully',
			interview: interviewWithDetails 
		});
	} catch (error) {
		return res.status(500).json({ 
			message: 'Error scheduling interview',
			error: error.message 
		});
	}
}

// Get interviews for a candidate (Candidate side)
export async function getCandidateInterviews(req, res) {
	const candidateUserId = req.user.sub;

	try {
		// Verify user is a candidate
		const candidate = await User.findByPk(candidateUserId);
		if (!candidate || candidate.role !== 'candidate') {
			return res.status(403).json({ message: 'Only candidates can view their interviews' });
		}

		// Fetch all interviews for this candidate
		const interviews = await Interview.findAll({
			where: { candidateUserId },
			include: [
				{
					model: User,
					as: 'Practice',
					attributes: ['id', 'email'],
					include: [{
						model: PracticeProfile,
						attributes: ['id', 'clinicType', 'phoneNumber']
					}]
				}
			],
			order: [['date', 'ASC'], ['time', 'ASC']] // Sort by date and time
		});

		return res.status(200).json({ 
			interviews,
			count: interviews.length 
		});
	} catch (error) {
		return res.status(500).json({ 
			message: 'Error fetching interviews',
			error: error.message 
		});
	}
}

// Get interviews scheduled by a practice (Practice side - optional but useful)
export async function getPracticeInterviews(req, res) {
	const practiceUserId = req.user.sub;

	try {
		// Verify user is a practice
		const practice = await User.findByPk(practiceUserId);
		if (!practice || practice.role !== 'practice') {
			return res.status(403).json({ message: 'Only practices can view their scheduled interviews' });
		}

		// Fetch all interviews scheduled by this practice
		const interviews = await Interview.findAll({
			where: { practiceUserId },
			include: [
				{
					model: User,
					as: 'Candidate',
					attributes: ['id', 'email'],
					include: [{
						model: CandidateProfile,
						attributes: ['id', 'fullName', 'jobTitle']
					}]
				}
			],
			order: [['date', 'ASC'], ['time', 'ASC']] // Sort by date and time
		});

		return res.status(200).json({ 
			interviews,
			count: interviews.length 
		});
	} catch (error) {
		return res.status(500).json({ 
			message: 'Error fetching interviews',
			error: error.message 
		});
	}
}

