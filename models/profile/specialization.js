import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const Specialization = sequelize?.define('Specialization', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'specializations', underscored: true });

export default Specialization;


