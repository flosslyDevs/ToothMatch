import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const WorkPersonality = sequelize?.define(
  'WorkPersonality',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    workingSuperpower: { type: DataTypes.STRING, allowNull: true },
    favoriteWorkVibe: { type: DataTypes.STRING, allowNull: true },
    tacklingDifficultSituations: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'work_personalities', underscored: true }
);

export default WorkPersonality;
