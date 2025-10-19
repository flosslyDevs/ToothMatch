import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const PermanentJob = sequelize?.define('PermanentJob', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false }, // Practice user ID
	role: { type: DataTypes.STRING, allowNull: true },
	location: { type: DataTypes.STRING, allowNull: true },
	contractType: { type: DataTypes.STRING, allowNull: true },
	jobType: { type: DataTypes.STRING, allowNull: true },
	startDate: { type: DataTypes.DATEONLY, allowNull: true },
	jobTitle: { type: DataTypes.STRING, allowNull: true },
	jobDescription: { type: DataTypes.TEXT, allowNull: true },
	skills: { type: DataTypes.JSON, allowNull: true }, // Array of skills
	software: { type: DataTypes.JSON, allowNull: true }, // Array of software
	experienceLevels: { type: DataTypes.JSON, allowNull: true }, // Array of experience levels
	specialisms: { type: DataTypes.JSON, allowNull: true }, // Array of specialisms
	salaryRange: { type: DataTypes.STRING, allowNull: true }, // Flexible salary range format
	benefits: { type: DataTypes.JSON, allowNull: true }, // Array of benefits
	workingHours: { type: DataTypes.STRING, allowNull: true },
	flexibleWorkingOption: { type: DataTypes.BOOLEAN, defaultValue: false },
	interviewType: { type: DataTypes.STRING, allowNull: true },
	screeningQuestions: { type: DataTypes.JSON, allowNull: true }, // Array of questions
	autoRejectIfQuestionsNotAnswered: { type: DataTypes.BOOLEAN, defaultValue: false },
	boostListing: { type: DataTypes.BOOLEAN, defaultValue: false },
	status: { type: DataTypes.STRING, defaultValue: 'active' }, // active, filled, closed, paused
	createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
	updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { 
	tableName: 'permanent_jobs', 
	underscored: true,
	timestamps: true
});

export default PermanentJob;
