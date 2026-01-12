import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const Education = sequelize?.define(
  'Education',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    highestLevel: { type: DataTypes.STRING, allowNull: true },
    institution: { type: DataTypes.STRING, allowNull: true },
    fieldOfStudy: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { tableName: 'educations', underscored: true }
);

export default Education;
