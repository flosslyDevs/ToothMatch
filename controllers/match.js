import { Op } from 'sequelize';
import {
  MatchLike,
  Match,
  LocumShift,
  PermanentJob,
  CandidateProfile,
  JobPreference,
  PracticeProfile,
  PracticeLocation,
  User,
  Media,
  PracticeMedia,
} from '../models/index.js';
import { sendLikeNotification, getFCMTokensForUser } from '../utils/fcm.js';

function normalizeStr(s) {
  return (s || '').toString().trim().toLowerCase();
}

function parseSalaryRange(s) {
  if (!s) return { min: null, max: null };
  const nums = String(s).match(/[\d,]+/g);
  if (!nums || nums.length === 0) return { min: null, max: null };
  const vals = nums
    .map((n) => Number(n.replace(/,/g, '')))
    .filter((v) => !isNaN(v));
  if (vals.length === 0) return { min: null, max: null };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

function scoreCandidateToJob(candidate, job, jobType) {
  // Simple heuristic scoring 0-100
  let score = 0;
  const pref = candidate?.User?.JobPreference || {};

  // jobType / working pattern match (20)
  const jtMatch =
    pref.jobType &&
    job.jobType &&
    normalizeStr(pref.jobType) === normalizeStr(job.jobType)
      ? 1
      : 0;
  score += jtMatch * 10;
  const wp = normalizeStr(pref.workingPattern);
  const wh = normalizeStr(job.workingHours || job.time);
  if (wp && wh && (wh.includes(wp.split('-')[0]) || wh.includes(wp)))
    score += 10;

  // pay/salary match (40)
  let candMin = Number(pref.payMin) || 0;
  let candMax = Number(pref.payMax) || Number(pref.hourlyRate) || 0;
  let jobMin = 0;
  let jobMax = 0;
  if (jobType === 'permanent') {
    const sr = parseSalaryRange(job.salaryRange);
    jobMin = sr.min || 0;
    jobMax = sr.max || 0;
  } else {
    jobMin = Number(job.hourlyRate) || Number(job.dayRate) || 0;
    jobMax = jobMin;
  }
  if (
    (jobMax && candMin && jobMax >= candMin) ||
    (jobMin && candMax && jobMin <= candMax) ||
    (!candMin && !candMax)
  )
    score += 40;

  // location proximity (20) – if candidate has lat/lng and practice has locations
  // For now, award points if practice has any location when candidate has radius set
  if (pref.searchRadiusKm && pref.latitude && pref.longitude) score += 10;
  // award another 10 if practice has any saved locations
  if (
    job.PracticeProfile &&
    job.PracticeProfile.PracticeLocations &&
    job.PracticeProfile.PracticeLocations.length > 0
  )
    score += 10;

  // simple cap
  if (score > 100) score = 100;
  return Math.round(score);
}

async function ensureMatchIfMutual(actorUserId, targetType, targetId) {
  // If actor is candidate liking job: candidateUserId=actor, practiceUserId=job.userId
  // If actor is practice liking candidate: candidateUserId=targetId, practiceUserId=actor
  if (targetType === 'candidate') {
    const candidateUserId = targetId;
    const practiceUserId = actorUserId;

    try {
      // Find all jobs the candidate has liked
      const candidateLikes = await MatchLike.findAll({
        where: {
          actorUserId: candidateUserId,
          targetType: { [Op.in]: ['locum', 'permanent'] },
          decision: 'like',
        },
      });

      console.log(
        `[ensureMatchIfMutual] Practice ${practiceUserId} liking candidate ${candidateUserId}`
      );
      console.log(
        `[ensureMatchIfMutual] Candidate has liked ${candidateLikes.length} jobs`
      );

      if (candidateLikes.length === 0) {
        console.log(
          `[ensureMatchIfMutual] No jobs liked by candidate, returning null`
        );
        return null;
      }

      // Group likes by type and extract target IDs
      const locumTargetIds = candidateLikes
        .filter((l) => l.targetType === 'locum')
        .map((l) => l.targetId);
      const permanentTargetIds = candidateLikes
        .filter((l) => l.targetType === 'permanent')
        .map((l) => l.targetId);

      console.log(`[ensureMatchIfMutual] Locum target IDs:`, locumTargetIds);
      console.log(
        `[ensureMatchIfMutual] Permanent target IDs:`,
        permanentTargetIds
      );

      // Find matching jobs (jobs from this practice that candidate liked) with PracticeProfile included
      const matchingJobs = [];

      if (locumTargetIds.length > 0) {
        // First, let's check what jobs exist for these IDs (without userId filter)
        const allLikedLocumJobs = await LocumShift.findAll({
          where: {
            id: { [Op.in]: locumTargetIds },
          },
        });
        console.log(
          `[ensureMatchIfMutual] All liked locum jobs found:`,
          allLikedLocumJobs.map((j) => ({ id: j.id, userId: j.userId }))
        );

        // Now filter by practice userId
        const locumJobs = await LocumShift.findAll({
          where: {
            id: { [Op.in]: locumTargetIds },
            userId: practiceUserId,
          },
          include: [
            {
              model: PracticeProfile,
              include: [{ model: PracticeLocation, required: false }],
            },
          ],
        });
        console.log(
          `[ensureMatchIfMutual] Found ${locumJobs.length} locum jobs from this practice (userId: ${practiceUserId})`
        );

        // Also check what jobs this practice actually has
        const practiceLocumJobs = await LocumShift.findAll({
          where: { userId: practiceUserId },
          attributes: ['id', 'userId'],
        });
        console.log(
          `[ensureMatchIfMutual] All locum jobs for this practice:`,
          practiceLocumJobs.map((j) => ({ id: j.id, userId: j.userId }))
        );

        for (const job of locumJobs) {
          matchingJobs.push({ job, targetType: 'locum', targetId: job.id });
        }
      }

      if (permanentTargetIds.length > 0) {
        // First, let's check what jobs exist for these IDs (without userId filter)
        const allLikedPermanentJobs = await PermanentJob.findAll({
          where: {
            id: { [Op.in]: permanentTargetIds },
          },
        });
        console.log(
          `[ensureMatchIfMutual] All liked permanent jobs found:`,
          allLikedPermanentJobs.map((j) => ({ id: j.id, userId: j.userId }))
        );

        const permanentJobs = await PermanentJob.findAll({
          where: {
            id: { [Op.in]: permanentTargetIds },
            userId: practiceUserId,
          },
          include: [
            {
              model: PracticeProfile,
              include: [{ model: PracticeLocation, required: false }],
            },
          ],
        });
        console.log(
          `[ensureMatchIfMutual] Found ${permanentJobs.length} permanent jobs from this practice (userId: ${practiceUserId})`
        );

        // Also check what jobs this practice actually has
        const practicePermanentJobs = await PermanentJob.findAll({
          where: { userId: practiceUserId },
          attributes: ['id', 'userId'],
        });
        console.log(
          `[ensureMatchIfMutual] All permanent jobs for this practice:`,
          practicePermanentJobs.map((j) => ({ id: j.id, userId: j.userId }))
        );

        for (const job of permanentJobs) {
          matchingJobs.push({ job, targetType: 'permanent', targetId: job.id });
        }
      }

      console.log(
        `[ensureMatchIfMutual] Total matching jobs: ${matchingJobs.length}`
      );

      if (matchingJobs.length === 0) {
        console.log(
          `[ensureMatchIfMutual] No matching jobs found, returning null`
        );
        return null;
      }

      // Create matches for all matching jobs (or return the first one if multiple)
      let firstMatch = null;
      const candidate = await CandidateProfile.findOne({
        where: { userId: candidateUserId },
        include: [
          { model: User, include: [{ model: JobPreference, required: false }] },
        ],
      });

      if (!candidate) {
        console.log(
          `[ensureMatchIfMutual] Candidate profile not found, returning null`
        );
        return null;
      }

      for (const {
        job,
        targetType: jobType,
        targetId: jobId,
      } of matchingJobs) {
        // Check if match already exists
        const existing = await Match.findOne({
          where: {
            candidateUserId,
            practiceUserId,
            targetType: jobType,
            targetId: jobId,
          },
        });
        if (existing) {
          console.log(
            `[ensureMatchIfMutual] Match already exists for job ${jobId}`
          );
          if (!firstMatch) firstMatch = existing;
          continue;
        }

        const score = scoreCandidateToJob(candidate, job, jobType);
        console.log(
          `[ensureMatchIfMutual] Creating match for job ${jobId} with score ${score}`
        );
        const match = await Match.create({
          candidateUserId,
          practiceUserId,
          targetType: jobType,
          targetId: jobId,
          score,
        });
        if (!firstMatch) firstMatch = match;
      }

      console.log(`[ensureMatchIfMutual] Returning match:`, firstMatch?.id);
      return firstMatch;
    } catch (error) {
      console.error('[ensureMatchIfMutual] Error:', error);
      throw error;
    }
  } else {
    // target is job; get job to find practice user
    const model = targetType === 'locum' ? LocumShift : PermanentJob;
    const job = await model.findByPk(targetId, {
      include: [
        {
          model: PracticeProfile,
          include: [{ model: PracticeLocation, required: false }],
        },
      ],
    });
    if (!job) return null;
    const candidateLike = await MatchLike.findOne({
      where: { targetType, targetId, decision: 'like' },
    });
    if (!candidateLike) return null;
    const candidateUserId = candidateLike.actorUserId;
    const practiceUserId = job.userId;

    // fetch candidate profile+preferences for scoring
    const candidate = await CandidateProfile.findOne({
      where: { userId: candidateUserId },
      include: [
        { model: User, include: [{ model: JobPreference, required: false }] },
      ],
    });
    if (!candidate) return null;
    const score = scoreCandidateToJob(
      candidate,
      job,
      targetType === 'locum' ? 'locum' : 'permanent'
    );

    const existing = await Match.findOne({
      where: { candidateUserId, practiceUserId, targetType, targetId },
    });
    if (existing) return existing;
    return await Match.create({
      candidateUserId,
      practiceUserId,
      targetType: targetType === 'locum' ? 'locum' : 'permanent',
      targetId,
      score,
    });
  }
}

export async function likeTarget(req, res) {
  const actorUserId = req.user.sub;
  const { targetType, targetId, decision } = req.body; // targetType: 'locum'|'permanent'|'candidate'; decision: 'like'|'pass'
  if (!['locum', 'permanent', 'candidate'].includes(targetType))
    return res.status(400).json({ message: 'invalid targetType' });
  if (!['like', 'pass'].includes(decision))
    return res.status(400).json({ message: 'invalid decision' });
  try {
    const like = await MatchLike.create({
      actorUserId,
      targetType,
      targetId,
      decision,
    });
    let match = null;
    if (decision === 'like') {
      match = await ensureMatchIfMutual(actorUserId, targetType, targetId);

      // Send FCM notification to the recipient
      try {
        let recipientUserId = null;

        // Determine recipient based on targetType
        if (targetType === 'candidate') {
          // Practice is liking candidate, so recipient is the candidate
          recipientUserId = targetId;
        } else {
          // Candidate is liking a job, so recipient is the practice owner
          const model = targetType === 'locum' ? LocumShift : PermanentJob;
          const job = await model.findByPk(targetId);
          if (job) {
            recipientUserId = job.userId;
          }
        }

        if (recipientUserId) {
          // Get sender's (actor's) name and avatar
          const senderUser = await User.findByPk(actorUserId, {
            attributes: ['fullName'],
          });
          const senderName = senderUser?.fullName || 'Someone';

          let senderAvatar = null;
          // Check if actor is a candidate or practice
          const candidateProfile = await CandidateProfile.findOne({
            where: { userId: actorUserId },
          });
          if (candidateProfile) {
            // Actor is a candidate, get profile picture
            const profilePic = await Media.findOne({
              where: { userId: actorUserId, kind: 'profile_picture' },
            });
            senderAvatar = profilePic?.url || null;
          } else {
            // Actor is a practice, get logo
            const practiceLogo = await PracticeMedia.findOne({
              where: { userId: actorUserId, kind: 'logo' },
            });
            senderAvatar = practiceLogo?.url || null;
          }

          // Determine likerType (candidate or practice)
          const likerType = candidateProfile ? 'candidate' : 'practice';

          // Get recipient's FCM tokens and send notifications
          const fcmTokens = await getFCMTokensForUser(recipientUserId);
          if (fcmTokens && fcmTokens.length > 0) {
            const notificationPromises = fcmTokens.map((token) =>
              sendLikeNotification(
                token,
                { likerId: actorUserId, likerType },
                senderName,
                senderAvatar
              )
            );
            await Promise.allSettled(notificationPromises);
          }
        }
      } catch (notificationError) {
        // Log error but don't fail the request
        console.error('Error sending FCM notification:', notificationError);
      }
    }

    // Get target profile picture/logo and name for response
    let targetInfo = null;
    try {
      if (targetType === 'candidate') {
        // Target is a candidate
        const targetUser = await User.findByPk(targetId, {
          attributes: ['fullName'],
        });
        const targetProfilePic = await Media.findOne({
          where: { userId: targetId, kind: 'profile_picture' },
        });
        targetInfo = {
          name: targetUser?.fullName || null,
          avatar: targetProfilePic?.url || null,
        };
      } else {
        // Target is a job (locum or permanent), get practice info
        const model = targetType === 'locum' ? LocumShift : PermanentJob;
        const job = await model.findByPk(targetId);
        if (job) {
          const practiceUser = await User.findByPk(job.userId, {
            attributes: ['fullName'],
          });
          const practiceLogo = await Media.findOne({
            where: { userId: job.userId, kind: 'logo' },
          });
          targetInfo = {
            name: practiceUser?.fullName || null,
            avatar: practiceLogo?.url || null,
          };
        }
      }
    } catch (targetInfoError) {
      // Log error but don't fail the request
      console.error('Error fetching target info:', targetInfoError);
    }

    return res.status(201).json({ like, match, target: targetInfo });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMatches(req, res) {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const where = {
      [Op.or]: [{ candidateUserId: userId }, { practiceUserId: userId }],
      status: 'matched',
    };
    const { count, rows } = await Match.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Enrich rows with target data
    const enriched = await Promise.all(
      rows.map(async (m) => {
        let target = null;
        if (m.targetType === 'locum') {
          target = await LocumShift.findByPk(m.targetId);
        } else if (m.targetType === 'permanent') {
          target = await PermanentJob.findByPk(m.targetId);
        }
        const candidateProfile = await CandidateProfile.findOne({
          where: { userId: m.candidateUserId },
        });
        const candidateProfilePicture = await Media.findOne({
          where: { userId: m.candidateUserId, kind: 'profile_picture' },
        });
        const practiceProfile = await PracticeProfile.findOne({
          where: { userId: m.practiceUserId },
        });
        const practiceLogo = await Media.findOne({
          where: { userId: m.practiceUserId, kind: 'logo' },
        });
        const practiceName = await User.findOne({
          where: { id: m.practiceUserId },
          attributes: ['fullName'],
        });

        const candidate = {
          ...candidateProfile.toJSON(),
          avatar: candidateProfilePicture ? candidateProfilePicture.url : null,
        };
        const practice = {
          ...practiceProfile.toJSON(),
          avatar: practiceLogo ? practiceLogo.url : null,
          name: practiceName ? practiceName.fullName : null,
        };
        return {
          ...m.toJSON(),
          target: target ? target.toJSON() : null,
          candidate,
          practice,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        total: count,
        matches: enriched,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getMatches:', error);
    return res
      .status(500)
      .json({ message: error.message || 'Internal server error' });
  }
}
