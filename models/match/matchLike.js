import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

// Stores swipe/like/pass decisions
const MatchLike = sequelize?.define(
  'MatchLike',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    actorUserId: { type: DataTypes.UUID, allowNull: false }, // who swiped
    targetType: {
      type: DataTypes.ENUM('locum', 'permanent', 'candidate'),
      allowNull: false,
    },
    targetId: { type: DataTypes.UUID, allowNull: false }, // job id or candidate userId
    decision: { type: DataTypes.ENUM('like', 'pass'), allowNull: false },
  },
  { tableName: 'match_likes', underscored: true, timestamps: true }
);

export default MatchLike;
