import { LocumShift, PermanentJob, User, PracticeProfile } from '../models/index.js';
import { Op } from 'sequelize';

// Get all jobs (both locum shifts and permanent jobs) for a specific practitioner
export async function getPractitionerJobs(req, res) {
	const { practitionerId } = req.params;
	
	try {
		// Get locum shifts for the practitioner
		const locumShifts = await LocumShift.findAll({
			where: { 
				userId: practitionerId,
				status: 'active' // Only active shifts
			},
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
				{
					model: PracticeProfile,
					attributes: ['clinicType', 'website', 'phoneNumber']
				}
			],
			order: [['createdAt', 'DESC']]
		});

		// Get permanent jobs for the practitioner
		const permanentJobs = await PermanentJob.findAll({
			where: { 
				userId: practitionerId,
				status: 'active' // Only active jobs
			},
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
				{
					model: PracticeProfile,
					attributes: ['clinicType', 'website', 'phoneNumber']
				}
			],
			order: [['createdAt', 'DESC']]
		});

		// Transform locum shifts to include job type identifier
		const transformedLocumShifts = locumShifts.map(shift => {
			const shiftData = shift.toJSON();
			// Remove the original User and PracticeProfile objects to avoid duplicates
			delete shiftData.User;
			delete shiftData.PracticeProfile;
			return {
				...shiftData,
				jobType: 'locum',
				jobTypeLabel: 'Locum Shift',
				user: shift.User,
				practiceProfile: shift.PracticeProfile
			};
		});

		// Transform permanent jobs to include job type identifier
		const transformedPermanentJobs = permanentJobs.map(job => {
			const jobData = job.toJSON();
			// Remove the original User and PracticeProfile objects to avoid duplicates
			delete jobData.User;
			delete jobData.PracticeProfile;
			return {
				...jobData,
				jobType: 'permanent',
				jobTypeLabel: 'Permanent Job',
				user: job.User,
				practiceProfile: job.PracticeProfile
			};
		});

		// Combine both types of jobs
		const allJobs = [...transformedLocumShifts, ...transformedPermanentJobs];

		// Sort by creation date (newest first)
		allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		return res.status(200).json({
			success: true,
			data: {
				practitionerId,
				totalJobs: allJobs.length,
				locumShifts: transformedLocumShifts.length,
				permanentJobs: transformedPermanentJobs.length,
				jobs: allJobs
			}
		});

	} catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Error fetching practitioner jobs',
			error: error.message
		});
	}
}

// Get all active jobs (both locum shifts and permanent jobs) - public endpoint
export async function getAllActiveJobs(req, res) {
	try {
		// Get all active locum shifts
		const locumShifts = await LocumShift.findAll({
			where: { status: 'active' },
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
				{
					model: PracticeProfile,
					attributes: ['clinicType', 'website', 'phoneNumber']
				}
			],
			order: [['createdAt', 'DESC']]
		});

		// Get all active permanent jobs
		const permanentJobs = await PermanentJob.findAll({
			where: { status: 'active' },
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
				{
					model: PracticeProfile,
					attributes: ['clinicType', 'website', 'phoneNumber']
				}
			],
			order: [['createdAt', 'DESC']]
		});

		// Transform locum shifts to include job type identifier
		const transformedLocumShifts = locumShifts.map(shift => {
			const shiftData = shift.toJSON();
			// Remove the original User and PracticeProfile objects to avoid duplicates
			delete shiftData.User;
			delete shiftData.PracticeProfile;
			return {
				...shiftData,
				jobType: 'locum',
				jobTypeLabel: 'Locum Shift',
				user: shift.User,
				practiceProfile: shift.PracticeProfile
			};
		});

		// Transform permanent jobs to include job type identifier
		const transformedPermanentJobs = permanentJobs.map(job => {
			const jobData = job.toJSON();
			// Remove the original User and PracticeProfile objects to avoid duplicates
			delete jobData.User;
			delete jobData.PracticeProfile;
			return {
				...jobData,
				jobType: 'permanent',
				jobTypeLabel: 'Permanent Job',
				user: job.User,
				practiceProfile: job.PracticeProfile
			};
		});

		// Combine both types of jobs
		const allJobs = [...transformedLocumShifts, ...transformedPermanentJobs];

		// Sort by creation date (newest first)
		allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		return res.status(200).json({
			success: true,
			data: {
				totalJobs: allJobs.length,
				locumShifts: transformedLocumShifts.length,
				permanentJobs: transformedPermanentJobs.length,
				jobs: allJobs
			}
		});

	} catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Error fetching all jobs',
			error: error.message
		});
	}
}