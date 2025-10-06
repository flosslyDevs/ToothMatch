import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const AvailabilitySlot = sequelize?.define('AvailabilitySlot', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	start: { type: DataTypes.DATE, allowNull: false },
	end: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'availability_slots', underscored: true });

export default AvailabilitySlot;


