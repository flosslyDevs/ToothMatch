import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const JobPreference = sequelize?.define('JobPreference', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	idealJobTitle: { type: DataTypes.STRING, allowNull: true },
	lookingFor: { type: DataTypes.STRING, allowNull: true },
	jobType: { type: DataTypes.ENUM('full_time', 'part_time', 'locum', 'contract'), allowNull: true },
	workingPattern: { type: DataTypes.STRING, allowNull: true },
	payMin: { type: DataTypes.INTEGER, allowNull: true },
	payMax: { type: DataTypes.INTEGER, allowNull: true },
	preferredLocations: { type: DataTypes.JSONB, allowNull: true },
	searchRadiusKm: { type: DataTypes.INTEGER, allowNull: true },
	salaryPreference: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'job_preferences', underscored: true });

export default JobPreference;


