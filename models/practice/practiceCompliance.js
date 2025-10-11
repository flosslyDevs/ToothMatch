import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const PracticeCompliance = sequelize?.define('PracticeCompliance', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	documentsRequired: { type: DataTypes.TEXT, allowNull: true },
	yearsOfExperience: { type: DataTypes.INTEGER, allowNull: true },
	skillsOrSoftwareRequired: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'practice_compliance', underscored: true });

export default PracticeCompliance;



