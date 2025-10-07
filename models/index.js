import User from './auth/users.js';
import CandidateProfile from './profile/candidateProfile.js';
import Education from './profile/education.js';
import WorkExperience from './profile/workExperience.js';
import WorkPersonality from './profile/workPersonality.js';
import Skill from './profile/skill.js';
import Specialization from './profile/Specialization.js';
import UserSkill from './profile/UserSkill.js';
import UserSpecialization from './profile/UserSpecialization.js';
import Media from './profile/media.js';
import IdentityDocument from './profile/identityDocument.js';
import JobPreference from './profile/jobPreference.js';
import AvailabilitySlot from './profile/availabilitySlot.js';

// Associations
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

export {
	User,
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
};


