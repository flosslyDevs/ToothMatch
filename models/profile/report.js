import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const Report = sequelize?.define(
  'Report',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reportedUserId: { type: DataTypes.UUID, allowNull: false },
    reportedByUserId: { type: DataTypes.UUID, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedBy: { type: DataTypes.UUID, allowNull: true },
    resolvedReason: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'reports', underscored: true }
);

export default Report;
