import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const PracticeCulture = sequelize?.define(
  'PracticeCulture',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    clinicCultureDescriptors: { type: DataTypes.TEXT, allowNull: true },
    benefitsOffered: { type: DataTypes.TEXT, allowNull: true },
    workloadStyle: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: 'practice_culture', underscored: true }
);

export default PracticeCulture;
