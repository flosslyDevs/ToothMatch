import User from './auth/users.js';
import UserFCMToken from './auth/userFCMToken.js';
import {Event, Booking} from './events/index.js';
import CandidateProfile from './profile/candidateProfile.js';
import Education from './profile/education.js';
import WorkExperience from './profile/workExperience.js';
import WorkPersonality from './profile/workPersonality.js';
import Skill from './profile/skill.js';
import Specialization from './profile/specialization.js';
import UserSkill from './profile/userSkill.js';
import UserSpecialization from './profile/userSpecialization.js';
import Media from './profile/media.js';
import IdentityDocument from './profile/identityDocument.js';
import JobPreference from './profile/jobPreference.js';
import AvailabilitySlot from './profile/availabilitySlot.js';
import PracticeProfile from './practice/practiceProfile.js';
import PracticeMedia from './practice/practiceMedia.js';
import PracticeLocation from './practice/practiceLocation.js';
import PracticeCompliance from './practice/practiceCompliance.js';
import PracticePayment from './practice/practicePayment.js';
import PracticeCulture from './practice/practiceCulture.js';
import LocumShift from './practice/locumShift.js';
import PermanentJob from './practice/permanentJob.js';
import Interview from './practice/interview.js';
import MatchLike from './match/matchLike.js';
import Match from './match/match.js';
import Rating from './shared/rating.js';
import Blocklist from './profile/blocklist.js';
import Report from './profile/report.js';
import ChatMessage from './chat/message.js';
import ChatThread from './chat/thread.js';
import ChatThreadParticipant from './chat/threadParticipant.js';

CandidateProfile.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(CandidateProfile, { foreignKey: 'userId' });

Education.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Education, { foreignKey: 'userId' });

WorkExperience.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(WorkExperience, { foreignKey: 'userId' });

WorkPersonality.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(WorkPersonality, { foreignKey: 'userId' });

User.belongsToMany(Skill, { through: UserSkill, foreignKey: 'userId' });
Skill.belongsToMany(User, { through: UserSkill, foreignKey: 'skillId' });

User.belongsToMany(Specialization, { through: UserSpecialization, foreignKey: 'userId' });
Specialization.belongsToMany(User, { through: UserSpecialization, foreignKey: 'specializationId' });

// Join table associations
UserSkill.belongsTo(User, { foreignKey: 'userId' });
UserSkill.belongsTo(Skill, { foreignKey: 'skillId' });
User.hasMany(UserSkill, { foreignKey: 'userId' });
Skill.hasMany(UserSkill, { foreignKey: 'skillId' });

UserSpecialization.belongsTo(User, { foreignKey: 'userId' });
UserSpecialization.belongsTo(Specialization, { foreignKey: 'specializationId' });
User.hasMany(UserSpecialization, { foreignKey: 'userId' });
Specialization.hasMany(UserSpecialization, { foreignKey: 'specializationId' });

Media.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Media, { foreignKey: 'userId' });

IdentityDocument.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(IdentityDocument, { foreignKey: 'userId' });

JobPreference.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(JobPreference, { foreignKey: 'userId' });

AvailabilitySlot.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(AvailabilitySlot, { foreignKey: 'userId' });

// Practice associations
PracticeProfile.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(PracticeProfile, { foreignKey: 'userId' });

PracticeMedia.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(PracticeMedia, { foreignKey: 'userId' });

PracticeLocation.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(PracticeLocation, { foreignKey: 'userId' });

PracticeCompliance.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(PracticeCompliance, { foreignKey: 'userId' });

// Practice Profile associations with related models
PracticeProfile.hasMany(PracticeMedia, { foreignKey: 'userId', sourceKey: 'userId' });
PracticeMedia.belongsTo(PracticeProfile, { foreignKey: 'userId', targetKey: 'userId' });

PracticeProfile.hasMany(PracticeLocation, { foreignKey: 'userId', sourceKey: 'userId' });
PracticeLocation.belongsTo(PracticeProfile, { foreignKey: 'userId', targetKey: 'userId' });

PracticeProfile.hasOne(PracticeCompliance, { foreignKey: 'userId', sourceKey: 'userId' });
PracticeCompliance.belongsTo(PracticeProfile, { foreignKey: 'userId', targetKey: 'userId' });

PracticePayment.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(PracticePayment, { foreignKey: 'userId' });

PracticeCulture.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(PracticeCulture, { foreignKey: 'userId' });

// Locum Shift associations
LocumShift.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(LocumShift, { foreignKey: 'userId' });

LocumShift.belongsTo(PracticeProfile, { foreignKey: 'userId', targetKey: 'userId' });
PracticeProfile.hasMany(LocumShift, { foreignKey: 'userId', sourceKey: 'userId' });

// Permanent Job associations
PermanentJob.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(PermanentJob, { foreignKey: 'userId' });

PermanentJob.belongsTo(PracticeProfile, { foreignKey: 'userId', targetKey: 'userId' });
PracticeProfile.hasMany(PermanentJob, { foreignKey: 'userId', sourceKey: 'userId' });

// Interview associations
Interview.belongsTo(User, { foreignKey: 'practiceUserId', as: 'Practice' });
Interview.belongsTo(User, { foreignKey: 'candidateUserId', as: 'Candidate' });
User.hasMany(Interview, { foreignKey: 'practiceUserId', as: 'ScheduledInterviews' });
User.hasMany(Interview, { foreignKey: 'candidateUserId', as: 'CandidateInterviews' });

// Event associations
Event.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Event, { foreignKey: 'userId' });

Booking.belongsTo(Event, { foreignKey: 'eventId' });
Event.hasMany(Booking, { foreignKey: 'eventId' });

User.hasMany(Booking, { foreignKey: 'userId' });
Booking.belongsTo(User, { foreignKey: 'userId' });

// Chat associations
ChatMessage.belongsTo(User, { foreignKey: 'senderId' });
User.hasMany(ChatMessage, { foreignKey: 'senderId' });

ChatMessage.belongsTo(User, { foreignKey: 'receiverId' });
User.hasMany(ChatMessage, { foreignKey: 'receiverId' });

// ChatThread associations
ChatThread.hasMany(ChatMessage, { foreignKey: 'threadId' });
ChatMessage.belongsTo(ChatThread, { foreignKey: 'threadId' });

ChatThread.hasMany(ChatThreadParticipant, { foreignKey: 'threadId' });
ChatThreadParticipant.belongsTo(ChatThread, { foreignKey: 'threadId' });

ChatThreadParticipant.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ChatThreadParticipant, { foreignKey: 'userId' });

// FCM Token associations
UserFCMToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(UserFCMToken, { foreignKey: 'userId' });

export {
	User,
	UserFCMToken,
	Booking,
	Event,
	ChatMessage,
	ChatThread,
	ChatThreadParticipant,
	CandidateProfile,
	Education,
	WorkExperience,
	WorkPersonality,
	Skill,
	Specialization,
	UserSkill,
	UserSpecialization,
	Media,
	IdentityDocument,
	JobPreference,
	AvailabilitySlot,
	PracticeProfile,
	PracticeMedia,
	PracticeLocation,
	PracticeCompliance,
	PracticePayment,
	PracticeCulture,
	LocumShift,
    PermanentJob,
    Interview,
    MatchLike,
    Match,
	Rating,
	Blocklist,
	Report,
};


