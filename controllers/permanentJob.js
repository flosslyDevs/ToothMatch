import { PermanentJob } from '../models/index.js';
import { Op } from 'sequelize';

// Create a new permanent job
export async function createPermanentJob(req, res) {
	const userId = req.user.sub;
	const {
		role,
		location,
		contractType,
		jobType,
		startDate,
		jobTitle,
		jobDescription,
		skills,
		software,
		experienceLevels,
		specialisms,
		salaryRange,
		benefits,
		workingHours,
		flexibleWorkingOption,
		interviewType,
		screeningQuestions,
		autoRejectIfQuestionsNotAnswered,
		boostListing,
		status
	} = req.body;

	try {
		const permanentJob = await PermanentJob.create({
			userId,
			role,
			location,
			contractType,
			jobType,
			startDate,
			jobTitle,
			jobDescription,
			skills,
			software,
			experienceLevels,
			specialisms,
			salaryRange,
			benefits,
			workingHours,
			flexibleWorkingOption,
			interviewType,
			screeningQuestions,
			autoRejectIfQuestionsNotAnswered,
			boostListing,
			status: status || 'active'
		});

		return res.status(201).json({ permanentJob });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Get all permanent jobs for a practice
export async function getPermanentJobs(req, res) {
	const userId = req.user.sub;
	const { status, page = 1, limit = 10 } = req.query;

	try {
		const whereClause = { userId };
		if (status) {
			whereClause.status = status;
		}

		const offset = (page - 1) * limit;
		
		const { count, rows: permanentJobs } = await PermanentJob.findAndCountAll({
			where: whereClause,
			order: [['createdAt', 'DESC']],
			limit: parseInt(limit),
			offset: parseInt(offset)
		});

		return res.status(200).json({
			permanentJobs,
			pagination: {
				total: count,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages: Math.ceil(count / limit)
			}
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Get a specific permanent job by ID
export async function getPermanentJobById(req, res) {
	const { id } = req.params;
	const userId = req.user.sub;

	try {
		const permanentJob = await PermanentJob.findOne({
			where: { id, userId }
		});

		if (!permanentJob) {
			return res.status(404).json({ message: 'Permanent job not found' });
		}

		return res.status(200).json({ permanentJob });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Update a permanent job
export async function updatePermanentJob(req, res) {
	const { id } = req.params;
	const userId = req.user.sub;
	const updateData = req.body;

	try {
		const permanentJob = await PermanentJob.findOne({
			where: { id, userId }
		});

		if (!permanentJob) {
			return res.status(404).json({ message: 'Permanent job not found' });
		}

		await permanentJob.update(updateData);
		await permanentJob.reload();

		return res.status(200).json({ permanentJob });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Delete a permanent job
export async function deletePermanentJob(req, res) {
	const { id } = req.params;
	const userId = req.user.sub;

	try {
		const permanentJob = await PermanentJob.findOne({
			where: { id, userId }
		});

		if (!permanentJob) {
			return res.status(404).json({ message: 'Permanent job not found' });
		}

		await permanentJob.destroy();

		return res.status(200).json({ message: 'Permanent job deleted successfully' });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Get all public permanent jobs (for candidates to browse)
export async function getPublicPermanentJobs(req, res) {
	const { 
		location, 
		role, 
		contractType,
		jobType,
		experienceLevel,
		status = 'active',
		page = 1, 
		limit = 10 
	} = req.query;

	try {
		const whereClause = { status };
		
		if (location) {
			whereClause.location = { [Op.iLike]: `%${location}%` };
		}
		if (role) {
			whereClause.role = { [Op.iLike]: `%${role}%` };
		}
		if (contractType) {
			whereClause.contractType = { [Op.iLike]: `%${contractType}%` };
		}
		if (jobType) {
			whereClause.jobType = { [Op.iLike]: `%${jobType}%` };
		}
		if (experienceLevel) {
			whereClause.experienceLevels = { [Op.contains]: [experienceLevel] };
		}

		const offset = (page - 1) * limit;
		
		const { count, rows: permanentJobs } = await PermanentJob.findAndCountAll({
			where: whereClause,
			order: [['createdAt', 'DESC']],
			limit: parseInt(limit),
			offset: parseInt(offset)
		});

		return res.status(200).json({
			permanentJobs,
			pagination: {
				total: count,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages: Math.ceil(count / limit)
			}
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}
