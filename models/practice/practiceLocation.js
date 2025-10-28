import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const PracticeLocation = sequelize?.define('PracticeLocation', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	address: { type: DataTypes.STRING, allowNull: false },
	phone: { type: DataTypes.STRING, allowNull: true },
	parking: { type: DataTypes.STRING, allowNull: true },
	publicTransport: { type: DataTypes.STRING, allowNull: true },
	practiceManagerName: { type: DataTypes.STRING, allowNull: true },
	email: { type: DataTypes.STRING, allowNull: true },
	practiceManagerPhone: { type: DataTypes.STRING, allowNull: true },
	latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
	longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
	// branchManagerUserId: { type: DataTypes.UUID, allowNull: true },

}, { tableName: 'practice_locations', underscored: true });

export default PracticeLocation;



