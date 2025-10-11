import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const PracticeMedia = sequelize?.define('PracticeMedia', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	kind: { type: DataTypes.ENUM('clinic_photo', 'team_photo', 'logo'), allowNull: false },
	url: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'practice_media', underscored: true });

export default PracticeMedia;



