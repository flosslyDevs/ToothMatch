import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const Skill = sequelize?.define('Skill', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'skills', underscored: true });

export default Skill;


