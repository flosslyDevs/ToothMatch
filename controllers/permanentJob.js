import { PermanentJob } from '../models/index.js';
import { Op } from 'sequelize';
import { logger as loggerRoot } from '../utils/logger.js';

const loggerBase = loggerRoot.child('controllers/permanentJob.js');

// Create a new permanent job
export async function createPermanentJob(req, res) {
  const logger = loggerBase.child('createPermanentJob');
  const userId = req.user.sub;
  logger.debug('Creating permanent job', { userId });
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
    status,
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
      status: status || 'active',
    });

    logger.info('Permanent job created', { userId, jobId: permanentJob.id });
    return res.status(201).json({ permanentJob });
  } catch (error) {
    logger.error(
      'Error creating permanent job',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Get all permanent jobs for a practice
export async function getPermanentJobs(req, res) {
  const logger = loggerBase.child('getPermanentJobs');
  const userId = req.user.sub;
  const { status, page = 1, limit = 10 } = req.query;

  try {
    logger.debug('Fetching permanent jobs', { userId, status, page, limit });
    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: permanentJobs } = await PermanentJob.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      permanentJobs,
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

// Get a specific permanent job by ID
export async function getPermanentJobById(req, res) {
  const logger = loggerBase.child('getPermanentJobById');
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    logger.debug('Fetching permanent job by ID', { id, userId });
    const permanentJob = await PermanentJob.findOne({
      where: { id, userId },
    });

    if (!permanentJob) {
      logger.warn('Permanent job not found', { id, userId });
      return res.status(404).json({ message: 'Permanent job not found' });
    }

    logger.debug('Permanent job fetched', { id, userId });
    return res.status(200).json({ permanentJob });
  } catch (error) {
    logger.error(
      'Error fetching permanent job by ID',
      { id, userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Update a permanent job
export async function updatePermanentJob(req, res) {
  const logger = loggerBase.child('updatePermanentJob');
  const { id } = req.params;
  const userId = req.user.sub;
  const updateData = req.body;

  try {
    logger.debug('Updating permanent job', { id, userId });
    const permanentJob = await PermanentJob.findOne({
      where: { id, userId },
    });

    if (!permanentJob) {
      logger.warn('Permanent job not found for update', { id, userId });
      return res.status(404).json({ message: 'Permanent job not found' });
    }

    await permanentJob.update(updateData);
    await permanentJob.reload();

    logger.info('Permanent job updated', { id, userId });
    return res.status(200).json({ permanentJob });
  } catch (error) {
    logger.error(
      'Error updating permanent job',
      { id, userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Delete a permanent job
export async function deletePermanentJob(req, res) {
  const logger = loggerBase.child('deletePermanentJob');
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    logger.debug('Deleting permanent job', { id, userId });
    const permanentJob = await PermanentJob.findOne({
      where: { id, userId },
    });

    if (!permanentJob) {
      logger.warn('Permanent job not found for deletion', { id, userId });
      return res.status(404).json({ message: 'Permanent job not found' });
    }

    await permanentJob.destroy();

    logger.info('Permanent job deleted', { id, userId });
    return res
      .status(200)
      .json({ message: 'Permanent job deleted successfully' });
  } catch (error) {
    logger.error(
      'Error deleting permanent job',
      { id, userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Get all public permanent jobs (for candidates to browse)
export async function getPublicPermanentJobs(req, res) {
  const logger = loggerBase.child('getPublicPermanentJobs');
  const {
    location,
    role,
    contractType,
    jobType,
    experienceLevel,
    status = 'active',
    page = 1,
    limit = 10,
  } = req.query;

  try {
    logger.debug('Fetching public permanent jobs', {
      location,
      role,
      contractType,
      jobType,
      experienceLevel,
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
      offset: parseInt(offset),
    });

    return res.status(200).json({
      permanentJobs,
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
