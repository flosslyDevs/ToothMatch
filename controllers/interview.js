import { Interview, User, PracticeProfile, CandidateProfile, PracticeMedia, Media } from '../models/index.js';

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
					attributes: ['id', 'email', 'fullName'],
					include: [{
						model: PracticeProfile,
						attributes: ['id', 'clinicType', 'phoneNumber']
					}, {
						model: Media,
						attributes: ['id', 'kind', 'url'],
						required: false,
						limit: 1,
						separate: true,
						where: {
							kind: 'logo',
						}
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
					include: [
						{
						model: CandidateProfile,
						attributes: ['id', 'fullName', 'jobTitle']
						},
						{
							model: Media,
							attributes: ['id', 'kind', 'url'],
							required: false,
							where: {
								kind: 'profile_picture',
							},
						}
					]
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

// Unified endpoint: Get interviews based on user role (auto-detects candidate or practice)
export async function getMyInterviews(req, res) {
	const userId = req.user?.sub;
	
	if (!userId) {
		return res.status(401).json({ message: 'User not authenticated' });
	}

	try {
		const user = await User.findByPk(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		let interviews;
		
		if (user.role === 'candidate') {
			// Fetch all interviews for this candidate
			interviews = await Interview.findAll({
				where: { candidateUserId: userId },
				include: [
					{
					  model: User,
					  as: "Practice",
					  attributes: ["id", "email", "fullName"],
					  include: [
						{
						  model: PracticeProfile,
						  attributes: ["id", "clinicType", "phoneNumber"],
						},
						{
						  model: Media,
						  attributes: ["id", "kind", "url"],
						  required: false,
						  limit: 1,
						  separate: true,
						  where: {
							kind: "logo",
						  },
						},
					  ],
					},
				  ],
				order: [['date', 'ASC'], ['time', 'ASC']]
			});
		} else if (user.role === 'practice') {
			// Fetch all interviews scheduled by this practice
			interviews = await Interview.findAll({
				where: { practiceUserId: userId },
				include: [
					{
						model: User,
						as: 'Candidate',
						attributes: ['id', 'email'],
						include: [
							{
								model: CandidateProfile,
								attributes: ['id', 'fullName', 'jobTitle']
							},
							{
								model: Media,
								attributes: ['id', 'kind', 'url'],
								required: false,
								where: {
									kind: 'profile_picture',
								},
							}
						]
					}
				],
				order: [['date', 'ASC'], ['time', 'ASC']]
			});
		} else {
			return res.status(403).json({ message: 'Invalid user role' });
		}

		return res.status(200).json({ 
			interviews,
			count: interviews.length,
			role: user.role
		});
	} catch (error) {
		console.error('Error fetching interviews:', error);
		return res.status(500).json({ 
			message: 'Error fetching interviews',
			error: error.message 
		});
	}
}

// Candidate: Request reschedule for an interview
export async function requestReschedule(req, res) {
	const candidateUserId = req.user?.sub;
	const { id } = req.params;
	const { requestedDate, requestedTime, reason } = req.body;

	try {
		if (!candidateUserId) {
			return res.status(401).json({ message: 'User not authenticated' });
		}

		// Verify user is a candidate
		const candidate = await User.findByPk(candidateUserId);
		if (!candidate || candidate.role !== 'candidate') {
			return res.status(403).json({ message: 'Only candidates can request reschedule' });
		}

		// Find the interview
		const interview = await Interview.findByPk(id);
		if (!interview) {
			return res.status(404).json({ message: 'Interview not found' });
		}

		// Verify the interview belongs to this candidate
		if (interview.candidateUserId !== candidateUserId) {
			return res.status(403).json({ message: 'You can only request reschedule for your own interviews' });
		}

		// Check if interview is already declined
		if (interview.declined) {
			return res.status(400).json({ message: 'Cannot request reschedule for a declined interview' });
		}

		// Validate required fields
		if (!requestedDate || !requestedTime) {
			return res.status(400).json({ 
				message: 'Missing required fields: requestedDate and requestedTime are required' 
			});
		}

		// Validate time format (24-hour format: HH:MM)
		const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (!timeRegex.test(requestedTime)) {
			return res.status(400).json({ 
				message: 'Invalid time format. Use 24-hour format (HH:MM), e.g., "14:30"' 
			});
		}

		// Update interview with reschedule request
		await interview.update({
			rescheduleRequested: true,
			rescheduleRequestDate: new Date(),
			rescheduleRequestReason: reason || null,
			rescheduleRequestedDate: requestedDate,
			rescheduleRequestedTime: requestedTime
		});

		// Fetch updated interview with related data
		const updatedInterview = await Interview.findByPk(interview.id, {
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

		return res.status(200).json({ 
			message: 'Reschedule request submitted successfully',
			interview: updatedInterview 
		});
	} catch (error) {
		console.error('Error requesting reschedule:', error);
		return res.status(500).json({ 
			message: 'Error requesting reschedule',
			error: error.message 
		});
	}
}

// Practice: Approve reschedule and update interview date/time
export async function approveReschedule(req, res) {
	const practiceUserId = req.user?.sub;
	const { id } = req.params;
	const { date, time } = req.body;

	try {
		if (!practiceUserId) {
			return res.status(401).json({ message: 'User not authenticated' });
		}

		// Verify user is a practice
		const practice = await User.findByPk(practiceUserId);
		if (!practice || practice.role !== 'practice') {
			return res.status(403).json({ message: 'Only practices can approve reschedule requests' });
		}

		// Find the interview
		const interview = await Interview.findByPk(id);
		if (!interview) {
			return res.status(404).json({ message: 'Interview not found' });
		}

		// Verify the interview belongs to this practice
		if (interview.practiceUserId !== practiceUserId) {
			return res.status(403).json({ message: 'You can only approve reschedule for your own interviews' });
		}

		// Check if there's a pending reschedule request
		if (!interview.rescheduleRequested) {
			return res.status(400).json({ message: 'No pending reschedule request for this interview' });
		}

		// If date and time are provided, use them; otherwise use the requested date/time
		const newDate = date || interview.rescheduleRequestedDate;
		const newTime = time || interview.rescheduleRequestedTime;

		if (!newDate || !newTime) {
			return res.status(400).json({ 
				message: 'Missing required fields: date and time are required' 
			});
		}

		// Validate time format (24-hour format: HH:MM)
		const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (!timeRegex.test(newTime)) {
			return res.status(400).json({ 
				message: 'Invalid time format. Use 24-hour format (HH:MM), e.g., "14:30"' 
			});
		}

		// Update interview with new date/time and clear reschedule request
		await interview.update({
			date: newDate,
			time: newTime,
			rescheduleRequested: false,
			rescheduleRequestDate: null,
			rescheduleRequestReason: null,
			rescheduleRequestedDate: null,
			rescheduleRequestedTime: null,
			status: 'scheduled' // Reset to scheduled when rescheduled
		});

		// Fetch updated interview with related data
		const updatedInterview = await Interview.findByPk(interview.id, {
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

		return res.status(200).json({ 
			message: 'Interview rescheduled successfully',
			interview: updatedInterview 
		});
	} catch (error) {
		console.error('Error approving reschedule:', error);
		return res.status(500).json({ 
			message: 'Error approving reschedule',
			error: error.message 
		});
	}
}

// Candidate: Decline an interview
export async function declineInterview(req, res) {
	const candidateUserId = req.user?.sub;
	const { id } = req.params;
	const { reason } = req.body;

	try {
		if (!candidateUserId) {
			return res.status(401).json({ message: 'User not authenticated' });
		}

		// Verify user is a candidate
		const candidate = await User.findByPk(candidateUserId);
		if (!candidate || candidate.role !== 'candidate') {
			return res.status(403).json({ message: 'Only candidates can decline interviews' });
		}

		// Find the interview
		const interview = await Interview.findByPk(id);
		if (!interview) {
			return res.status(404).json({ message: 'Interview not found' });
		}

		// Verify the interview belongs to this candidate
		if (interview.candidateUserId !== candidateUserId) {
			return res.status(403).json({ message: 'You can only decline your own interviews' });
		}

		// Check if already declined
		if (interview.declined) {
			return res.status(400).json({ message: 'Interview is already declined' });
		}

		// Update interview to declined
		await interview.update({
			declined: true,
			declinedAt: new Date(),
			declineReason: reason || null,
			status: 'cancelled' // Also update status to cancelled
		});

		// Fetch updated interview with related data
		const updatedInterview = await Interview.findByPk(interview.id, {
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

		return res.status(200).json({ 
			message: 'Interview declined successfully',
			interview: updatedInterview 
		});
	} catch (error) {
		console.error('Error declining interview:', error);
		return res.status(500).json({ 
			message: 'Error declining interview',
			error: error.message 
		});
	}
}

// Candidate: Accept (confirm) an interview
export async function acceptInterview(req, res) {
	const candidateUserId = req.user?.sub;
	const { id } = req.params;

	try {
		if (!candidateUserId) {
			return res.status(401).json({ message: 'User not authenticated' });
		}

		// Verify user is a candidate
		const candidate = await User.findByPk(candidateUserId);
		if (!candidate || candidate.role !== 'candidate') {
			return res.status(403).json({ message: 'Only candidates can accept interviews' });
		}

		// Find the interview
		const interview = await Interview.findByPk(id);
		if (!interview) {
			return res.status(404).json({ message: 'Interview not found' });
		}

		// Verify the interview belongs to this candidate
		if (interview.candidateUserId !== candidateUserId) {
			return res.status(403).json({ message: 'You can only accept your own interviews' });
		}

		// Prevent accepting declined / cancelled / completed interviews
		if (interview.declined || ['cancelled', 'completed'].includes(interview.status)) {
			return res.status(400).json({ message: 'This interview cannot be accepted' });
		}

		// If already confirmed, just return success with current data
		if (interview.status === 'confirmed') {
			const existingInterview = await Interview.findByPk(interview.id, {
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

			return res.status(200).json({
				message: 'Interview already confirmed',
				interview: existingInterview
			});
		}

		// Mark interview as confirmed
		await interview.update({
			status: 'confirmed',
			// Clear any pending reschedule request when candidate confirms
			rescheduleRequested: false,
			rescheduleRequestDate: null,
			rescheduleRequestReason: null,
			rescheduleRequestedDate: null,
			rescheduleRequestedTime: null
		});

		// Fetch updated interview with related data
		const updatedInterview = await Interview.findByPk(interview.id, {
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

		return res.status(200).json({ 
			message: 'Interview accepted successfully',
			interview: updatedInterview 
		});
	} catch (error) {
		console.error('Error accepting interview:', error);
		return res.status(500).json({ 
			message: 'Error accepting interview',
			error: error.message 
		});
	}
}

