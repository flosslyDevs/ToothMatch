import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const Media = sequelize?.define('Media', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	kind: { type: DataTypes.ENUM('profile_photo', 'cover_photo', 'intro_video'), allowNull: false },
	url: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'media', underscored: true });

export default Media;


