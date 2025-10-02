import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const UserSpecialization = sequelize?.define('UserSpecialization', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	specializationId: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'user_specializations', underscored: true });

export default UserSpecialization;


