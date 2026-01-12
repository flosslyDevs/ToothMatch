import { LocumShift, User } from '../models/index.js';
import { Op } from 'sequelize';
import { logger as loggerRoot } from '../utils/logger.js';

const loggerBase = loggerRoot.child('controllers/locumShift.js');

// Create a new locum shift
export async function createLocumShift(req, res) {
  const logger = loggerBase.child('createLocumShift');
  const userId = req.user.sub;
  logger.debug('Creating locum shift', { userId });
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
    status,
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
      status: status || 'active',
    });

    logger.info('Locum shift created', { userId, locumShiftId: locumShift.id });
    return res.status(201).json({ locumShift });
  } catch (error) {
    logger.error(
      'Error creating locum shift',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Get all locum shifts for a practice
export async function getLocumShifts(req, res) {
  const logger = loggerBase.child('getLocumShifts');
  const userId = req.user.sub;
  const { status, page = 1, limit = 10 } = req.query;

  try {
    logger.debug('Fetching locum shifts', { userId, status, page, limit });
    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: locumShifts } = await LocumShift.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      locumShifts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Get a specific locum shift by ID
export async function getLocumShiftById(req, res) {
  const logger = loggerBase.child('getLocumShiftById');
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    logger.debug('Fetching locum shift by ID', { id, userId });

    const locumShift = await LocumShift.findOne({
      where: { id, userId },
    });

    if (!locumShift) {
      logger.warn('Locum shift not found', { id, userId });
      return res.status(404).json({ message: 'Locum shift not found' });
    }

    logger.debug('Locum shift fetched', { id, userId });
    return res.status(200).json({ locumShift });
  } catch (error) {
    logger.error(
      'Error fetching locum shift by ID',
      { id, userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Update a locum shift
export async function updateLocumShift(req, res) {
  const logger = loggerBase.child('updateLocumShift');
  const { id } = req.params;
  const userId = req.user.sub;
  const updateData = req.body;

  try {
    logger.debug('Updating locum shift', { id, userId });

    const locumShift = await LocumShift.findOne({
      where: { id, userId },
    });

    if (!locumShift) {
      logger.warn('Locum shift not found for update', { id, userId });
      return res.status(404).json({ message: 'Locum shift not found' });
    }

    await locumShift.update(updateData);
    await locumShift.reload();

    logger.info('Locum shift updated', { id, userId });
    return res.status(200).json({ locumShift });
  } catch (error) {
    logger.error(
      'Error updating locum shift',
      { id, userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Delete a locum shift
export async function deleteLocumShift(req, res) {
  const logger = loggerBase.child('deleteLocumShift');
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    logger.debug('Deleting locum shift', { id, userId });

    const locumShift = await LocumShift.findOne({
      where: { id, userId },
    });

    if (!locumShift) {
      logger.warn('Locum shift not found for deletion', { id, userId });
      return res.status(404).json({ message: 'Locum shift not found' });
    }

    await locumShift.destroy();

    logger.info('Locum shift deleted', { id, userId });
    return res
      .status(200)
      .json({ message: 'Locum shift deleted successfully' });
  } catch (error) {
    logger.error(
      'Error deleting locum shift',
      { id, userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Get all public locum shifts (for candidates to browse)
export async function getPublicLocumShifts(req, res) {
  const logger = loggerBase.child('getPublicLocumShifts');
  const {
    location,
    role,
    date,
    status = 'active',
    page = 1,
    limit = 10,
  } = req.query;

  try {
    logger.debug('Fetching public locum shifts', {
      location,
      role,
      date,
      status,
      page,
      limit,
    });
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
      order: [
        ['date', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email'],
          where: { role: 'practice' },
        },
      ],
    });

    return res.status(200).json({
      locumShifts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
