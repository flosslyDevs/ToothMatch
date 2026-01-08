import {
  CandidateProfile,
  PracticeProfile,
  Education,
  WorkExperience,
  WorkPersonality,
  Skill,
  Specialization,
  PracticeMedia,
  PracticeLocation,
  PracticeCompliance,
  PracticePayment,
  PracticeCulture,
  UserSkill,
  UserSpecialization,
  Media,
  IdentityDocument,
  JobPreference,
  AvailabilitySlot,
  LocumShift,
  PermanentJob,
  Interview,
  MatchLike,
  Match,
  Event,
  Booking,
  Rating,
  Blocklist,
  Report,
  User,
} from '../models/index.js';
import { Op } from 'sequelize';
import { sequelize } from '../services/db.js';
import { logger as loggerRoot } from '../utils/logger.js';

const loggerBase = loggerRoot.child('controllers/profile.js');

// Step 1-2: Basic Profile
export async function createProfile(req, res) {
  const logger = loggerBase.child('createProfile');
  const { fullName, gender, jobTitle, currentStatus, linkedinUrl, aboutMe } =
    req.body;
  const userId = req.user.sub;

  try {
    logger.debug('Creating profile', { userId });
    const [profile, created] = await CandidateProfile.findOrCreate({
      where: { userId },
      defaults: {
        fullName,
        gender,
        jobTitle,
        currentStatus,
        linkedinUrl,
        aboutMe,
        userId,
      },
    });

    if (!created) {
      await profile.update({
        fullName,
        gender,
        jobTitle,
        currentStatus,
        linkedinUrl,
        aboutMe,
      });
    }

    logger.info('Profile created/updated', { userId, profileId: profile.id });
    return res.status(200).json({ profile });
  } catch (error) {
    logger.error(
      'Error creating profile',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

export async function getProfile(req, res) {
  const userId = req.user.sub;
  const logger = loggerBase.child('getProfile');

  try {
    const profile = await CandidateProfile.findOne({ where: { userId } });
    logger.info('Profile created/updated', { userId, profileId: profile.id });
    return res.status(200).json({ profile });
  } catch (error) {
    logger.error(
      'Error creating profile',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Step 3: Education
export async function addEducation(req, res) {
  const logger = loggerBase.child('addEducation');
  const { highestLevel, institution, fieldOfStudy, startDate, endDate } =
    req.body;
  const userId = req.user.sub;
  try {
    const education = await Education.create({
      userId,
      highestLevel,
      institution,
      fieldOfStudy,
      startDate,
      endDate,
    });
    logger.info('Education added', { userId, educationId: education.id });
    return res.status(201).json({ education });
  } catch (error) {
    logger.error(
      'Error adding education',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

export async function getEducations(req, res) {
  const userId = req.user.sub;
  const logger = loggerBase.child('getEducations');

  try {
    const educations = await Education.findAll({ where: { userId } });
    logger.info('Educations fetched', { userId, count: educations.length });
    return res.status(200).json({ educations });
  } catch (error) {
    logger.error(
      'Error fetching educations',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Step 3: Work Experience
export async function addWorkExperience(req, res) {
  const {
    company,
    roleTitle,
    startDate,
    endDate,
    isCurrent,
    yearsExperience,
    professionalRegNumber,
  } = req.body;
  const userId = req.user.sub;
  const logger = loggerBase.child('addWorkExperience');
  try {
    if (!company) {
      return res.status(400).json({ message: 'company is required' });
    }
    logger.debug('Adding work experience', { userId });
    const experience = await WorkExperience.create({
      userId,
      company,
      roleTitle,
      startDate,
      endDate,
      isCurrent,
      yearsExperience,
      professionalRegNumber,
    });
    logger.info('Work experience added', {
      userId,
      experienceId: experience.id,
    });
    return res.status(201).json({ experience });
  } catch (error) {
    logger.error(
      'Error adding work experience',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

export async function getWorkExperiences(req, res) {
  const userId = req.user.sub;
  const logger = loggerBase.child('getWorkExperiences');
  try {
    const experiences = await WorkExperience.findAll({ where: { userId } });
    logger.info('Work experiences fetched', {
      userId,
      count: experiences.length,
    });
    return res.status(200).json({ experiences });
  } catch (error) {
    logger.error(
      'Error fetching work experiences',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Step 4: Work Personality
export async function updateWorkPersonality(req, res) {
  const logger = loggerBase.child('updateWorkPersonality');
  const { workingSuperpower, favoriteWorkVibe, tacklingDifficultSituations } =
    req.body;
  const userId = req.user.sub;

  try {
    logger.debug('Updating work personality', { userId });
    const [personality, created] = await WorkPersonality.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        workingSuperpower,
        favoriteWorkVibe,
        tacklingDifficultSituations,
      },
    });

    if (!created) {
      logger.debug('Work personality not created, updating existing');
      await personality.update({
        workingSuperpower,
        favoriteWorkVibe,
        tacklingDifficultSituations,
      });
    }

    logger.info('Work personality updated', {
      userId,
      personalityId: personality.id,
    });
    return res.status(200).json({ personality });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Step 5: Skills and Specializations
export async function addSkills(req, res) {
  const logger = loggerBase.child('addSkills');
  const { skillIds } = req.body;
  const userId = req.user.sub;

  try {
    logger.debug('Adding skills', { userId, skillCount: skillIds?.length });
    // Remove existing skills
    await UserSkill.destroy({ where: { userId } });

    // Add new skills
    const userSkills = await Promise.all(
      skillIds.map((skillId) => UserSkill.create({ userId, skillId }))
    );

    logger.info('Skills added', { userId, count: userSkills.length });
    return res.status(200).json({ userSkills });
  } catch (error) {
    logger.error(
      'Error adding skills',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

export async function addSpecializations(req, res) {
  const logger = loggerBase.child('addSpecializations');
  const { specializationIds } = req.body;
  const userId = req.user.sub;

  try {
    logger.debug('Adding specializations', {
      userId,
      specializationCount: specializationIds?.length,
    });
    // Remove existing specializations
    await UserSpecialization.destroy({ where: { userId } });

    // Add new specializations
    const userSpecializations = await Promise.all(
      specializationIds.map((specializationId) =>
        UserSpecialization.create({ userId, specializationId })
      )
    );

    logger.info('Specializations added', {
      userId,
      count: userSpecializations.length,
    });
    return res.status(200).json({ userSpecializations });
  } catch (error) {
    logger.error(
      'Error adding specializations',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Step 6: Media
export async function uploadMedia(req, res) {
  const logger = loggerBase.child('uploadMedia');
  const { kind, url } = req.body;
  const userId = req.user.sub;

  try {
    logger.debug('Uploading media', { userId, kind });
    let media = null;
    // Replace media if its cover or profile picture
    if (kind === 'cover' || kind === 'profile_photo') {
      media = await Media.update({ url }, { where: { userId, kind } });
    } else {
      media = await Media.create({ userId, kind, url });
    }
    logger.info('Media uploaded', { userId, kind });
    return res.status(201).json({ media });
  } catch (error) {
    logger.error(
      'Error uploading media',
      { userId, kind, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

export async function getMedia(req, res) {
  const logger = loggerBase.child('getMedia');
  const userId = req.user.sub;

  try {
    logger.debug('Fetching media', { userId });
    const media = await Media.findAll({ where: { userId } });
    logger.debug('Media fetched', { userId, count: media.length });
    return res.status(200).json({ media });
  } catch (error) {
    logger.error(
      'Error fetching media',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Step 7: Identity Documents
export async function uploadIdentityDocument(req, res) {
  const logger = loggerBase.child('uploadIdentityDocument');
  const { type, url } = req.body;
  const userId = req.user.sub;

  try {
    logger.debug('Uploading identity document', { userId, type });
    const document = await IdentityDocument.create({ userId, type, url });
    logger.info('Identity document uploaded', {
      userId,
      type,
      documentId: document.id,
    });
    return res.status(201).json({ document });
  } catch (error) {
    logger.error(
      'Error uploading identity document',
      { userId, type, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

export async function getIdentityDocuments(req, res) {
  const logger = loggerBase.child('getIdentityDocuments');
  const userId = req.user.sub;

  try {
    logger.debug('Fetching identity documents', { userId });
    const documents = await IdentityDocument.findAll({ where: { userId } });
    logger.debug('Identity documents fetched', {
      userId,
      count: documents.length,
    });
    return res.status(200).json({ documents });
  } catch (error) {
    logger.error(
      'Error fetching identity documents',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Step 8: Job Preferences
export async function updateJobPreferences(req, res) {
  const logger = loggerBase.child('updateJobPreferences');
  const {
    idealJobTitle,
    lookingFor,
    jobType,
    workingPattern,
    payMin,
    payMax,
    hourlyRate,
    preferredLocations,
    searchRadiusKm,
    salaryPreference,
  } = req.body;
  const userId = req.user.sub;

  try {
    logger.debug('Updating job preferences', { userId });
    const [preferences, created] = await JobPreference.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        idealJobTitle,
        lookingFor,
        jobType,
        workingPattern,
        payMin,
        payMax,
        hourlyRate,
        preferredLocations,
        searchRadiusKm,
        salaryPreference,
      },
    });

    if (!created) {
      await preferences.update({
        idealJobTitle,
        lookingFor,
        jobType,
        workingPattern,
        payMin,
        payMax,
        hourlyRate,
        preferredLocations,
        searchRadiusKm,
        salaryPreference,
      });
    }

    logger.info('Job preferences updated', {
      userId,
      preferenceId: preferences.id,
    });
    return res.status(200).json({ preferences });
  } catch (error) {
    logger.error(
      'Error updating job preferences',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Step 8: Availability
export async function addAvailabilitySlot(req, res) {
  const logger = loggerBase.child('addAvailabilitySlot');
  const { start, end } = req.body;
  const userId = req.user.sub;

  try {
    logger.debug('Adding availability slot', { userId, start, end });
    const slot = await AvailabilitySlot.create({ userId, start, end });
    logger.info('Availability slot added', { userId, slotId: slot.id });
    return res.status(201).json({ slot });
  } catch (error) {
    logger.error(
      'Error adding availability slot',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

export async function getAvailabilitySlots(req, res) {
  const logger = loggerBase.child('getAvailabilitySlots');
  const userId = req.user.sub;

  try {
    logger.debug('Fetching availability slots', { userId });
    const slots = await AvailabilitySlot.findAll({ where: { userId } });
    logger.debug('Availability slots fetched', { userId, count: slots.length });
    return res.status(200).json({ slots });
  } catch (error) {
    logger.error(
      'Error fetching availability slots',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Get all skills and specializations for dropdowns
export async function getAllSkills(req, res) {
  const logger = loggerBase.child('getAllSkills');
  try {
    logger.debug('Fetching all skills');
    const skills = await Skill.findAll();
    logger.debug('All skills fetched', { count: skills.length });
    return res.status(200).json({ skills });
  } catch (error) {
    logger.error('Error fetching all skills', { error: error.message }, error);
    return res.status(500).json({ message: error.message });
  }
}

export async function getAllSpecializations(req, res) {
  const logger = loggerBase.child('getAllSpecializations');
  try {
    logger.debug('Fetching all specializations');
    const specializations = await Specialization.findAll();
    logger.debug('All specializations fetched', {
      count: specializations.length,
    });
    return res.status(200).json({ specializations });
  } catch (error) {
    logger.error(
      'Error fetching all specializations',
      { error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Unified profile fetch for either candidate or practice based on kind or auto-detect
export async function getUnifiedProfile(req, res) {
  const logger = loggerBase.child('getUnifiedProfile');
  const userId = req.user.sub;
  const { kind } = req.query; // optional: 'candidate' | 'practice'

  logger.debug('Getting unified profile', { userId, kind });
  try {
    let resolvedKind = (kind || '').toLowerCase();
    if (resolvedKind !== 'candidate' && resolvedKind !== 'practice') {
      // auto-detect: prefer practice if exists, else candidate
      const practice = await PracticeProfile.findOne({ where: { userId } });
      if (practice) {
        resolvedKind = 'practice';
      } else {
        resolvedKind = 'candidate';
      }
    }

    logger.debug('Resolved kind', { resolvedKind });

    if (resolvedKind === 'candidate') {
      logger.debug('Fetching candidate profile data', { userId });
      // Reuse logic from getCompleteProfile
      const profile = await CandidateProfile.findOne({ where: { userId } });
      logger.debug('Candidate profile fetched', {
        userId,
        profileExists: !!profile,
      });

      const educations = await Education.findAll({ where: { userId } });
      logger.debug('Educations fetched', { userId, count: educations.length });

      const workExperiences = await WorkExperience.findAll({
        where: { userId },
      });
      logger.debug('Work experiences fetched', {
        userId,
        count: workExperiences.length,
      });

      const personality = await WorkPersonality.findOne({ where: { userId } });
      logger.debug('Personality fetched', { userId, exists: !!personality });

      const media = await Media.findAll({ where: { userId } });
      logger.debug('Media fetched', { userId, count: media.length });

      const documents = await IdentityDocument.findAll({ where: { userId } });
      logger.debug('Documents fetched', { userId, count: documents.length });

      const jobPreferences = await JobPreference.findOne({ where: { userId } });
      logger.debug('Job preferences fetched', {
        userId,
        exists: !!jobPreferences,
      });

      const availabilitySlots = await AvailabilitySlot.findAll({
        where: { userId },
      });
      logger.debug('Availability slots fetched', {
        userId,
        count: availabilitySlots.length,
      });

      const userSkills = await UserSkill.findAll({
        where: { userId },
        include: [{ model: Skill }],
      });
      logger.debug('User skills fetched', { userId, count: userSkills.length });

      const userSpecializations = await UserSpecialization.findAll({
        where: { userId },
        include: [{ model: Specialization }],
      });
      logger.debug('User specializations fetched', {
        userId,
        count: userSpecializations.length,
      });

      // Extract logo from media (prefer kind='logo', else first item)
      let logo = null;
      if (media && media.length > 0) {
        const logoMedia = media.find(
          (m) => (m.kind || '').toLowerCase() === 'logo'
        );
        logo = logoMedia ? logoMedia.url : media[0] ? media[0].url : null;
        logger.debug('Logo extracted', { userId });
      }

      // Add logo to profile object
      const profileWithLogo = profile
        ? {
            ...profile.toJSON(),
            logo,
          }
        : null;

      logger.debug('Candidate profile response prepared', { userId });
      return res.status(200).json({
        kind: 'candidate',
        profile: profileWithLogo,
        educations,
        workExperiences,
        personality,
        skills: userSkills,
        specializations: userSpecializations,
        media,
        documents,
        jobPreferences,
        availabilitySlots,
      });
    }

    // practice
    logger.debug('Fetching practice profile data', { userId });
    const practiceProfile = await PracticeProfile.findOne({
      where: { userId },
    });
    logger.debug('Practice profile fetched', {
      userId,
      profileExists: !!practiceProfile,
    });

    const practiceMedia = await PracticeMedia.findAll({ where: { userId } });
    logger.debug('Practice media fetched', {
      userId,
      count: practiceMedia.length,
    });

    const practiceLocations = await PracticeLocation.findAll({
      where: { userId },
    });
    logger.debug('Practice locations fetched', {
      userId,
      count: practiceLocations.length,
    });

    const practiceCompliance = await PracticeCompliance.findOne({
      where: { userId },
    });
    logger.debug('Practice compliance fetched', {
      userId,
      exists: !!practiceCompliance,
    });

    // Also check IdentityDocument table (in case documents were uploaded via /api/upload/user/document)
    const identityDocuments = await IdentityDocument.findAll({
      where: { userId },
    });
    logger.debug('Identity documents fetched', {
      userId,
      count: identityDocuments.length,
    });

    // Extract logo from media (prefer kind='logo', else first item)
    let logo = null;
    if (practiceMedia && practiceMedia.length > 0) {
      const logoMedia = practiceMedia.find(
        (m) => (m.kind || '').toLowerCase() === 'logo'
      );
      logo = logoMedia
        ? logoMedia.url
        : practiceMedia[0]
          ? practiceMedia[0].url
          : null;
      logger.debug('Logo extracted', { userId });
    }

    // Add logo to profile object
    const profileWithLogo = practiceProfile
      ? {
          ...practiceProfile.toJSON(),
          logo,
        }
      : null;

    // Combine compliance documents and identity documents
    const complianceDocuments = practiceCompliance?.complianceDocuments || [];
    const allDocuments = [
      ...complianceDocuments,
      ...identityDocuments.map((doc) => doc.toJSON()),
    ];
    logger.debug('Documents combined', {
      userId,
      totalCount: allDocuments.length,
    });

    const response = {
      kind: 'practice',
      profile: profileWithLogo,
      media: practiceMedia,
      locations: practiceLocations,
      documents: allDocuments,
    };

    logger.debug('Practice profile response prepared', {
      userId: req.user?.sub,
    });
    return res.status(200).json(response);
  } catch (error) {
    logger.error(
      'Error fetching unified profile',
      { userId: req.user?.sub, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Profile deletion handler
export async function deleteProfile(req, res) {
  const logger = loggerBase.child('deleteProfile');
  const userId = req.user.sub;
  logger.debug('Deleting profile', { userId });
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Profile not found' });
    }

    const [
      candidateProfile,
      practiceProfile,
      locumShifts,
      permanentJobs,
      events,
    ] = await Promise.all([
      CandidateProfile.findOne({ where: { userId }, transaction }),
      PracticeProfile.findOne({ where: { userId }, transaction }),
      LocumShift.findAll({
        where: { userId },
        attributes: ['id'],
        transaction,
      }),
      PermanentJob.findAll({
        where: { userId },
        attributes: ['id'],
        transaction,
      }),
      Event.findAll({ where: { userId }, attributes: ['id'], transaction }),
    ]);

    const candidateProfileId = candidateProfile?.id;
    const practiceProfileId = practiceProfile?.id;
    const locumShiftIds = locumShifts.map((shift) => shift.id);
    const permanentJobIds = permanentJobs.map((job) => job.id);
    const eventIds = events.map((event) => event.id);

    const destroyPromises = [
      Education.destroy({ where: { userId }, transaction }),
      WorkExperience.destroy({ where: { userId }, transaction }),
      WorkPersonality.destroy({ where: { userId }, transaction }),
      UserSkill.destroy({ where: { userId }, transaction }),
      UserSpecialization.destroy({ where: { userId }, transaction }),
      Media.destroy({ where: { userId }, transaction }),
      IdentityDocument.destroy({ where: { userId }, transaction }),
      JobPreference.destroy({ where: { userId }, transaction }),
      AvailabilitySlot.destroy({ where: { userId }, transaction }),
      PracticeMedia.destroy({ where: { userId }, transaction }),
      PracticeLocation.destroy({ where: { userId }, transaction }),
      PracticeCompliance.destroy({ where: { userId }, transaction }),
      PracticePayment.destroy({ where: { userId }, transaction }),
      PracticeCulture.destroy({ where: { userId }, transaction }),
      LocumShift.destroy({ where: { userId }, transaction }),
      PermanentJob.destroy({ where: { userId }, transaction }),
      Interview.destroy({
        where: {
          [Op.or]: [{ practiceUserId: userId }, { candidateUserId: userId }],
        },
        transaction,
      }),
      Blocklist.destroy({
        where: {
          [Op.or]: [{ blockedUserId: userId }, { blockedByUserId: userId }],
        },
        transaction,
      }),
      Report.destroy({
        where: {
          [Op.or]: [
            { reportedUserId: userId },
            { reportedByUserId: userId },
            { resolvedBy: userId },
          ],
        },
        transaction,
      }),
    ];

    const bookingConditions = [
      { userId },
      eventIds.length ? { eventId: { [Op.in]: eventIds } } : null,
    ].filter(Boolean);
    if (bookingConditions.length) {
      destroyPromises.push(
        Booking.destroy({
          where: { [Op.or]: bookingConditions },
          transaction,
        })
      );
    }

    const matchLikeConditions = [
      { actorUserId: userId },
      { targetType: 'candidate', targetId: userId },
      locumShiftIds.length ? { targetId: { [Op.in]: locumShiftIds } } : null,
      permanentJobIds.length
        ? { targetId: { [Op.in]: permanentJobIds } }
        : null,
    ].filter(Boolean);
    if (matchLikeConditions.length) {
      destroyPromises.push(
        MatchLike.destroy({
          where: { [Op.or]: matchLikeConditions },
          transaction,
        })
      );
    }

    const matchConditions = [
      { candidateUserId: userId },
      { practiceUserId: userId },
      locumShiftIds.length ? { targetId: { [Op.in]: locumShiftIds } } : null,
      permanentJobIds.length
        ? { targetId: { [Op.in]: permanentJobIds } }
        : null,
    ].filter(Boolean);
    if (matchConditions.length) {
      destroyPromises.push(
        Match.destroy({
          where: { [Op.or]: matchConditions },
          transaction,
        })
      );
    }

    const ratingConditions = [
      { userId },
      candidateProfileId ? { profileId: candidateProfileId } : null,
      practiceProfileId ? { profileId: practiceProfileId } : null,
    ].filter(Boolean);
    if (ratingConditions.length) {
      destroyPromises.push(
        Rating.destroy({
          where: { [Op.or]: ratingConditions },
          transaction,
        })
      );
    }

    if (eventIds.length) {
      destroyPromises.push(
        Event.destroy({ where: { id: { [Op.in]: eventIds } }, transaction })
      );
    }

    await Promise.all(destroyPromises);

    await CandidateProfile.destroy({ where: { userId }, transaction });
    await PracticeProfile.destroy({ where: { userId }, transaction });

    await User.destroy({ where: { id: userId }, transaction });
    await transaction.commit();

    logger.info('Profile deleted successfully', { userId });
    return res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    logger.error(
      'Error deleting profile',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Report candidate profile
export async function reportCandidateProfile(req, res) {
  const logger = loggerBase.child('reportCandidateProfile');
  const { reportedUserId } = req.params;
  const { reason } = req.body;
  const reportedByUserId = req.user.sub;
  try {
    logger.debug('Reporting candidate profile', {
      reportedByUserId,
      reportedUserId,
    });
    const result = await Report.create({
      reportedUserId,
      reportedByUserId,
      reason,
    });
    logger.info('Candidate profile reported', {
      reportedByUserId,
      reportedUserId,
      reportId: result.id,
    });
    return res
      .status(200)
      .json({ message: 'Profile reported successfully', reportId: result.id });
  } catch (error) {
    logger.error(
      'Error reporting candidate profile',
      { reportedByUserId, reportedUserId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Block candidate profile
export async function blockCandidateProfile(req, res) {
  const logger = loggerBase.child('blockCandidateProfile');
  const { blockedUserId } = req.params;
  const blockedByUserId = req.user.sub;
  try {
    logger.debug('Blocking candidate profile', {
      blockedByUserId,
      blockedUserId,
    });
    await Blocklist.create({ blockedUserId, blockedByUserId });
    logger.info('Candidate profile blocked', {
      blockedByUserId,
      blockedUserId,
    });
    return res
      .status(200)
      .json({ message: 'Candidate profile blocked successfully' });
  } catch (error) {
    logger.warn('Error blocking candidate profile - may already be blocked', {
      blockedByUserId,
      blockedUserId,
      error: error.message,
    });
    return res.status(500).json({ message: 'Already blocked' });
  }
}

// Unblock candidate profile
export async function unblockCandidateProfile(req, res) {
  const logger = loggerBase.child('unblockCandidateProfile');
  const { blockedUserId } = req.params;
  const blockedByUserId = req.user.sub;
  try {
    logger.debug('Unblocking candidate profile', {
      blockedByUserId,
      blockedUserId,
    });
    await Blocklist.destroy({ where: { blockedUserId, blockedByUserId } });
    logger.info('Candidate profile unblocked', {
      blockedByUserId,
      blockedUserId,
    });
    return res
      .status(200)
      .json({ message: 'Candidate profile unblocked successfully' });
  } catch (error) {
    logger.warn('Error unblocking candidate profile - may not be blocked', {
      blockedByUserId,
      blockedUserId,
      error: error.message,
    });
    return res.status(500).json({ message: 'Not blocked' });
  }
}

// Rate candidate profile (by practice)
export async function rateCandidateProfile(req, res) {
  const logger = loggerBase.child('rateCandidateProfile');
  const { candidateId } = req.params;
  const { rating, comment } = req.body;
  const practiceUserId = req.user.sub;
  logger.debug('Rating candidate profile', {
    practiceUserId,
    candidateId,
    rating,
  });
  if (rating < 1 || rating > 5) {
    logger.warn('Invalid rating value', {
      practiceUserId,
      candidateId,
      rating,
    });
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  if (comment && comment.length > 500) {
    logger.warn('Comment too long', {
      practiceUserId,
      candidateId,
      commentLength: comment.length,
    });
    return res
      .status(400)
      .json({ message: 'Comment must be less than 500 characters' });
  }
  const userId = req.user.sub;
  try {
    // Find the candidate profile by ID or userId
    let profile = await CandidateProfile.findByPk(candidateId);
    if (!profile) {
      // Try finding by userId
      profile = await CandidateProfile.findOne({
        where: { userId: candidateId },
      });
    }
    if (!profile) {
      logger.warn('Candidate profile not found for rating', {
        practiceUserId,
        candidateId,
      });
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    const candidateRating = await Rating.create({
      profileId: profile.id,
      userId,
      type: 'candidate',
      rating,
      comment,
    });
    logger.info('Candidate profile rated', {
      practiceUserId,
      candidateId,
      rating,
      ratingId: candidateRating.id,
    });
    return res.status(200).json({
      message: 'Candidate profile rated successfully',
      candidateRating,
    });
  } catch (error) {
    logger.error(
      'Error rating candidate profile',
      { practiceUserId, candidateId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Complete Profile Create (All Steps in One)
export async function createCompleteProfile(req, res) {
  const logger = loggerBase.child('createCompleteProfile');
  const userId = req.user.sub;
  logger.debug('Creating complete profile', { userId });
  const {
    // Step 1-2: Basic Profile
    fullName,
    gender,
    jobTitle,
    currentStatus,
    linkedinUrl,
    aboutMe,
    // Step 3: Education & Experience
    educations,
    workExperiences,
    // Step 4: Work Personality
    workingSuperpower,
    favoriteWorkVibe,
    tacklingDifficultSituations,
    // Step 5: Skills & Specializations
    skillIds,
    specializationIds,
    // Step 6: Media
    media,
    // Step 7: Identity Documents
    documents,
    // Step 8: Job Preferences & Availability
    jobPreferences,
    availabilitySlots,
  } = req.body;

  try {
    // Do not allow duplicate profile creation
    const existing = await CandidateProfile.findOne({ where: { userId } });
    if (existing) {
      return res.status(400).json({
        message:
          'Candidate profile already exists. Use PUT /api/profile/complete to update.',
      });
    }

    // Step 1-2: Create Profile
    const profile = await CandidateProfile.create({
      userId,
      fullName,
      gender,
      jobTitle,
      currentStatus,
      linkedinUrl,
      aboutMe,
      profileCompletion: true,
    });

    // Step 3: Educations
    if (Array.isArray(educations) && educations.length > 0) {
      await Promise.all(
        educations.map((edu) =>
          Education.create({
            userId,
            highestLevel: edu?.highestLevel ?? null,
            institution: edu?.institution ?? null,
            fieldOfStudy: edu?.fieldOfStudy ?? null,
            startDate: edu?.startDate ?? null,
            endDate: edu?.endDate ?? null,
          })
        )
      );
    }

    // Step 3: Work Experiences
    if (Array.isArray(workExperiences) && workExperiences.length > 0) {
      const filteredExperiences = workExperiences.filter(
        (exp) => !!exp?.company
      );
      await Promise.all(
        filteredExperiences.map((exp) =>
          WorkExperience.create({ ...exp, userId })
        )
      );
    }

    // Step 4: Work Personality
    if (workingSuperpower || favoriteWorkVibe || tacklingDifficultSituations) {
      await WorkPersonality.create({
        userId,
        workingSuperpower,
        favoriteWorkVibe,
        tacklingDifficultSituations,
      });
    }

    // Step 5: Skills
    if (Array.isArray(skillIds) && skillIds.length > 0) {
      for (const skillName of skillIds) {
        const [skill] = await Skill.findOrCreate({
          where: { name: skillName },
          defaults: { name: skillName },
        });
        await UserSkill.create({ userId, skillId: skill.id });
      }
    }

    // Step 5: Specializations
    if (Array.isArray(specializationIds) && specializationIds.length > 0) {
      for (const specName of specializationIds) {
        const [specialization] = await Specialization.findOrCreate({
          where: { name: specName },
          defaults: { name: specName },
        });
        await UserSpecialization.create({
          userId,
          specializationId: specialization.id,
        });
      }
    }

    // Step 6: Media
    if (Array.isArray(media) && media.length > 0) {
      await Promise.all(media.map((m) => Media.create({ ...m, userId })));
    }

    // Step 7: Identity Documents
    if (Array.isArray(documents) && documents.length > 0) {
      await Promise.all(
        documents.map((doc) => IdentityDocument.create({ ...doc, userId }))
      );
    }

    // Step 8: Job Preferences
    if (jobPreferences) {
      await JobPreference.create({ ...jobPreferences, userId });
    }

    // Step 8: Availability Slots
    if (Array.isArray(availabilitySlots) && availabilitySlots.length > 0) {
      await Promise.all(
        availabilitySlots.map((slot) =>
          AvailabilitySlot.create({ ...slot, userId })
        )
      );
    }

    logger.info('Complete profile created', { userId, profileId: profile.id });
    return res.status(201).json({
      message: 'Candidate profile created successfully',
      profileId: profile.id,
      profileCompletion: true,
    });
  } catch (error) {
    logger.error(
      'Error creating complete profile',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Complete Profile Update (All Steps in One)
export async function updateCompleteProfile(req, res) {
  const logger = loggerBase.child('updateCompleteProfile');
  const userId = req.user.sub;
  logger.debug('Updating complete profile', { userId });
  const {
    // Step 1-2: Basic Profile
    fullName,
    gender,
    jobTitle,
    currentStatus,
    linkedinUrl,
    aboutMe,
    // Step 3: Education & Experience
    educations,
    workExperiences,
    // Step 4: Work Personality
    workingSuperpower,
    favoriteWorkVibe,
    tacklingDifficultSituations,
    // Step 5: Skills & Specializations
    skillIds,
    specializationIds,
    // Step 6: Media
    media,
    // Step 7: Identity Documents
    documents,
    // Step 8: Job Preferences & Availability
    jobPreferences,
    availabilitySlots,
  } = req.body;

  try {
    // Get or create profile (needed for profileCompletion update at the end)
    const [profile] = await CandidateProfile.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        fullName,
        gender,
        jobTitle,
        currentStatus,
        linkedinUrl,
        aboutMe,
      },
    });

    // Step 1-2: Update/Create Profile
    if (
      fullName ||
      gender ||
      jobTitle ||
      currentStatus ||
      linkedinUrl ||
      aboutMe
    ) {
      await profile.update({
        fullName,
        gender,
        jobTitle,
        currentStatus,
        linkedinUrl,
        aboutMe,
      });
    }

    // Step 3: Handle Educations
    if (educations && educations.length > 0) {
      await Education.destroy({ where: { userId } });
      await Promise.all(
        educations.map((edu) =>
          Education.create({
            userId,
            highestLevel: edu?.highestLevel ?? null,
            institution: edu?.institution ?? null,
            fieldOfStudy: edu?.fieldOfStudy ?? null,
            startDate: edu?.startDate ?? null,
            endDate: edu?.endDate ?? null,
          })
        )
      );
    }

    // Step 3: Handle Work Experiences
    if (workExperiences && workExperiences.length > 0) {
      await WorkExperience.destroy({ where: { userId } });
      const filteredExperiences = workExperiences.filter(
        (exp) => !!exp?.company
      );
      await Promise.all(
        filteredExperiences.map((exp) =>
          WorkExperience.create({ ...exp, userId })
        )
      );
    }

    // Step 4: Work Personality
    if (workingSuperpower || favoriteWorkVibe || tacklingDifficultSituations) {
      const [personality] = await WorkPersonality.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          workingSuperpower,
          favoriteWorkVibe,
          tacklingDifficultSituations,
        },
      });
      await personality.update({
        workingSuperpower,
        favoriteWorkVibe,
        tacklingDifficultSituations,
      });
    }

    // Step 5: Skills
    if (skillIds && skillIds.length > 0) {
      await UserSkill.destroy({ where: { userId } });
      // Create skills if they don't exist, then link them
      for (const skillName of skillIds) {
        const [skill] = await Skill.findOrCreate({
          where: { name: skillName },
          defaults: { name: skillName },
        });
        await UserSkill.create({ userId, skillId: skill.id });
      }
    }

    // Step 5: Specializations
    if (specializationIds && specializationIds.length > 0) {
      await UserSpecialization.destroy({ where: { userId } });
      // Create specializations if they don't exist, then link them
      for (const specName of specializationIds) {
        const [specialization] = await Specialization.findOrCreate({
          where: { name: specName },
          defaults: { name: specName },
        });
        await UserSpecialization.create({
          userId,
          specializationId: specialization.id,
        });
      }
    }

    // Step 6: Media
    if (media && media.length > 0) {
      await Media.destroy({ where: { userId } });
      await Promise.all(media.map((m) => Media.create({ ...m, userId })));
    }

    // Step 7: Identity Documents
    if (documents && documents.length > 0) {
      await IdentityDocument.destroy({ where: { userId } });
      await Promise.all(
        documents.map((doc) => IdentityDocument.create({ ...doc, userId }))
      );
    }

    // Step 8: Job Preferences
    if (jobPreferences) {
      const [preferences] = await JobPreference.findOrCreate({
        where: { userId },
        defaults: { ...jobPreferences, userId },
      });
      await preferences.update(jobPreferences);
    }

    // Step 8: Availability Slots
    if (availabilitySlots && availabilitySlots.length > 0) {
      await AvailabilitySlot.destroy({ where: { userId } });
      await Promise.all(
        availabilitySlots.map((slot) =>
          AvailabilitySlot.create({ ...slot, userId })
        )
      );
    }

    // Update profileCompletion to true after successful profile update
    await profile.update({ profileCompletion: true });

    logger.info('Complete profile updated', { userId });
    return res.status(200).json({
      message: 'Profile updated successfully',
      profileCompletion: true,
    });
  } catch (error) {
    logger.error(
      'Error updating complete profile',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Get Complete Profile (All Data)
export async function getCompleteProfile(req, res) {
  const logger = loggerBase.child('getCompleteProfile');
  const userId = req.user.sub;

  try {
    logger.debug('Fetching complete profile', { userId });
    const profile = await CandidateProfile.findOne({ where: { userId } });
    const educations = await Education.findAll({ where: { userId } });
    const workExperiences = await WorkExperience.findAll({ where: { userId } });
    const personality = await WorkPersonality.findOne({ where: { userId } });
    const media = await Media.findAll({ where: { userId } });
    const documents = await IdentityDocument.findAll({ where: { userId } });
    const jobPreferences = await JobPreference.findOne({ where: { userId } });
    const availabilitySlots = await AvailabilitySlot.findAll({
      where: { userId },
    });

    // Get user skills and specializations with names
    const userSkills = await UserSkill.findAll({
      where: { userId },
      include: [{ model: Skill }],
    });
    const userSpecializations = await UserSpecialization.findAll({
      where: { userId },
      include: [{ model: Specialization }],
    });

    // Extract logo from media (prefer kind='logo', else first item)
    let logo = null;
    if (media && media.length > 0) {
      const logoMedia = media.find(
        (m) => (m.kind || '').toLowerCase() === 'logo'
      );
      logo = logoMedia ? logoMedia.url : media[0] ? media[0].url : null;
    }

    // Add logo to profile object
    const profileWithLogo = profile
      ? {
          ...profile.toJSON(),
          logo,
        }
      : null;

    return res.status(200).json({
      profile: profileWithLogo,
      educations,
      workExperiences,
      personality,
      skills: userSkills,
      specializations: userSpecializations,
      media,
      documents,
      jobPreferences,
      availabilitySlots,
    });
  } catch (error) {
    logger.error(
      'Error fetching complete profile',
      { userId, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Get Candidate by ID (Public - for practices to view candidates)
export async function getCandidateById(req, res) {
  const logger = loggerBase.child('getCandidateById');
  const { id } = req.params; // Can be userId or candidate profile id

  try {
    logger.debug('Fetching candidate by ID', { id });
    // Try to find by candidate profile id first
    let profile = await CandidateProfile.findByPk(id);
    let userId = null;

    if (profile) {
      userId = profile.userId;
    } else {
      // If not found, assume it's a userId
      userId = id;
      profile = await CandidateProfile.findOne({ where: { userId } });
    }

    if (!profile) {
      logger.warn('Candidate not found', { id });
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Get all candidate data
    const educations = await Education.findAll({ where: { userId } });
    const workExperiences = await WorkExperience.findAll({ where: { userId } });
    const personality = await WorkPersonality.findOne({ where: { userId } });
    const media = await Media.findAll({ where: { userId } });
    const documents = await IdentityDocument.findAll({ where: { userId } });
    const jobPreferences = await JobPreference.findOne({ where: { userId } });
    const availabilitySlots = await AvailabilitySlot.findAll({
      where: { userId },
    });
    const ratings = await Rating.findAll({
      where: { profileId: profile.id, type: 'candidate' },
    });

    // Get user skills and specializations with names
    const userSkills = await UserSkill.findAll({
      where: { userId },
      include: [{ model: Skill }],
    });
    const userSpecializations = await UserSpecialization.findAll({
      where: { userId },
      include: [{ model: Specialization }],
    });

    // Extract logo from media (prefer kind='logo', else first item)
    let logo = null;
    if (media && media.length > 0) {
      const logoMedia = media.find(
        (m) => (m.kind || '').toLowerCase() === 'logo'
      );
      logo = logoMedia ? logoMedia.url : media[0] ? media[0].url : null;
    }

    // Add logo to profile object
    const profileWithLogo = profile
      ? {
          ...profile.toJSON(),
          logo,
        }
      : null;

    return res.status(200).json({
      profile: profileWithLogo,
      educations,
      workExperiences,
      personality,
      skills: userSkills,
      specializations: userSpecializations,
      media,
      documents,
      jobPreferences,
      availabilitySlots,
      ratings,
    });
  } catch (error) {
    logger.error(
      'Error fetching candidate by ID',
      { id, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}
