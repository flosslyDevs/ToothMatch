import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const UserFCMToken = sequelize.define(
  'UserFCMToken',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    fcmToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true, // Optional: to identify specific devices
    },
    deviceType: {
      type: DataTypes.ENUM('ios', 'android', 'web', 'other'),
      allowNull: true,
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'user_fcm_tokens',
    underscored: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['fcm_token'], unique: true }],
  }
);

export default UserFCMToken;
