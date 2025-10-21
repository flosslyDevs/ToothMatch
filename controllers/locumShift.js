import { LocumShift, User } from '../models/index.js';
import { Op } from 'sequelize';

// Create a new locum shift
export async function createLocumShift(req, res) {
	const userId = req.user.sub;
	const {
		role,
		location,
		date,
		time,
		breakLunchDuration,
		dayRate,
		hourlyRate,
		overtimeRules,
		paymentTerms,
		cancellationPolicy,
		skills,
		software,
		specialisms,
		parking,
		publicTransport,
		ppeProvided,
		autoblockUnverified,
		mandatoryDocsForBooking,
		complianceText,
		preapprovedCandidates,
		candidateExpressesInterest,
		status
	} = req.body;

	try {
		const locumShift = await LocumShift.create({
			userId,
			role,
			location,
			date,
			time,
			breakLunchDuration,
			dayRate,
			hourlyRate,
			overtimeRules,
			paymentTerms,
			cancellationPolicy,
			skills,
			software,
			specialisms,
			parking,
			publicTransport,
			ppeProvided,
			autoblockUnverified,
			mandatoryDocsForBooking,
			complianceText,
			preapprovedCandidates,
			candidateExpressesInterest,
			status: status || 'active'
		});

		return res.status(201).json({ locumShift });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Get all locum shifts for a practice
export async function getLocumShifts(req, res) {
	const userId = req.user.sub;
	const { status, page = 1, limit = 10 } = req.query;

	try {
		const whereClause = { userId };
		if (status) {
			whereClause.status = status;
		}

		const offset = (page - 1) * limit;
		
		const { count, rows: locumShifts } = await LocumShift.findAndCountAll({
			where: whereClause,
			order: [['createdAt', 'DESC']],
			limit: parseInt(limit),
			offset: parseInt(offset)
		});

		return res.status(200).json({
			locumShifts,
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

// Get a specific locum shift by ID
export async function getLocumShiftById(req, res) {
	const { id } = req.params;
	const userId = req.user.sub;

	try {
		console.log('Looking for locum shift with ID:', id, 'and userId:', userId);
		
		const locumShift = await LocumShift.findOne({
			where: { id, userId }
		});

		if (!locumShift) {
			return res.status(404).json({ message: 'Locum shift not found' });
		}

		return res.status(200).json({ locumShift });
	} catch (error) {
		console.error('Error in getLocumShiftById:', error);
		return res.status(500).json({ message: error.message });
	}
}

// Update a locum shift
export async function updateLocumShift(req, res) {
	const { id } = req.params;
	const userId = req.user.sub;
	const updateData = req.body;

	try {
		console.log('Updating locum shift with ID:', id, 'and userId:', userId);
		console.log('Update data:', updateData);
		
		const locumShift = await LocumShift.findOne({
			where: { id, userId }
		});

		if (!locumShift) {
			return res.status(404).json({ message: 'Locum shift not found' });
		}

		await locumShift.update(updateData);
		await locumShift.reload();

		return res.status(200).json({ locumShift });
	} catch (error) {
		console.error('Error in updateLocumShift:', error);
		return res.status(500).json({ message: error.message });
	}
}

// Delete a locum shift
export async function deleteLocumShift(req, res) {
	const { id } = req.params;
	const userId = req.user.sub;

	try {
		console.log('Deleting locum shift with ID:', id, 'and userId:', userId);
		
		const locumShift = await LocumShift.findOne({
			where: { id, userId }
		});

		if (!locumShift) {
			return res.status(404).json({ message: 'Locum shift not found' });
		}

		await locumShift.destroy();

		return res.status(200).json({ message: 'Locum shift deleted successfully' });
	} catch (error) {
		console.error('Error in deleteLocumShift:', error);
		return res.status(500).json({ message: error.message });
	}
}

// Get all public locum shifts (for candidates to browse)
export async function getPublicLocumShifts(req, res) {
	const { 
		location, 
		role, 
		date, 
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
		if (date) {
			whereClause.date = date;
		}

		const offset = (page - 1) * limit;
		
		const { count, rows: locumShifts } = await LocumShift.findAndCountAll({
			where: whereClause,
			order: [['date', 'ASC'], ['createdAt', 'DESC']],
			limit: parseInt(limit),
			offset: parseInt(offset),
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email'],
					where: { role: 'practice' }
				}
			]
		});

		return res.status(200).json({
			locumShifts,
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
