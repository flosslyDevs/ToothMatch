import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const CandidateProfile = sequelize?.define(
  'CandidateProfile',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    fullName: { type: DataTypes.STRING, allowNull: false },
    gender: { type: DataTypes.STRING, allowNull: true },
    jobTitle: { type: DataTypes.STRING, allowNull: true },
    currentStatus: { type: DataTypes.STRING, allowNull: true },
    linkedinUrl: { type: DataTypes.STRING, allowNull: true },
    aboutMe: { type: DataTypes.TEXT, allowNull: true },
    profileCompletion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { tableName: 'candidate_profiles', underscored: true }
);

export default CandidateProfile;
