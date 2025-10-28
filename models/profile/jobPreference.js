import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const JobPreference = sequelize?.define('JobPreference', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	idealJobTitle: { type: DataTypes.STRING, allowNull: true },
	lookingFor: { type: DataTypes.STRING, allowNull: true },
	jobType: { type: DataTypes.STRING, allowNull: true },
	workingPattern: { type: DataTypes.STRING, allowNull: true },
	payMin: { type: DataTypes.INTEGER, allowNull: true },
	payMax: { type: DataTypes.INTEGER, allowNull: true },
	hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
	currentAddress: { type: DataTypes.STRING, allowNull: true },
	latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
	longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
	searchRadiusKm: { type: DataTypes.INTEGER, allowNull: true },
	salaryPreference: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'job_preferences', underscored: true });

export default JobPreference;


