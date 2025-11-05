import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

// Represents a mutual match between a candidate and a job/practice
const Match = sequelize?.define('Match', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    candidateUserId: { type: DataTypes.UUID, allowNull: false },
    practiceUserId: { type: DataTypes.UUID, allowNull: false },
    targetType: { type: DataTypes.ENUM('locum', 'permanent'), allowNull: false },
    targetId: { type: DataTypes.UUID, allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // 0-100
    status: { type: DataTypes.ENUM('matched', 'archived'), allowNull: false, defaultValue: 'matched' },
}, { tableName: 'matches', underscored: true, timestamps: true });

export default Match;


