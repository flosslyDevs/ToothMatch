import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const UserSkill = sequelize?.define('UserSkill', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	skillId: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'user_skills', underscored: true });

export default UserSkill;


