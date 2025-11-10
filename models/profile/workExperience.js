import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const WorkExperience = sequelize?.define('WorkExperience', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	company: { type: DataTypes.STRING, allowNull: false },
	roleTitle: { type: DataTypes.STRING, allowNull: true },
	startDate: { type: DataTypes.DATEONLY, allowNull: true },
	endDate: { type: DataTypes.DATEONLY, allowNull: true },
	isCurrent: { type: DataTypes.BOOLEAN, defaultValue: false },
	yearsExperience: { type: DataTypes.STRING, allowNull: true },
	professionalRegNumber: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'work_experiences', underscored: true });

export default WorkExperience;


