import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const PracticeProfile = sequelize?.define(
  'PracticeProfile',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    // Step 1: About your business
    clinicType: { type: DataTypes.STRING, allowNull: true },
    // Step 2: Contact and brand info
    about: { type: DataTypes.TEXT, allowNull: true },
    website: { type: DataTypes.STRING, allowNull: true },
    instagram: { type: DataTypes.STRING, allowNull: true },
    facebook: { type: DataTypes.STRING, allowNull: true },
    linkedin: { type: DataTypes.STRING, allowNull: true },
    phoneNumber: { type: DataTypes.STRING, allowNull: true },
    hideFromPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    profileCompletion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { tableName: 'practice_profiles', underscored: true }
);

export default PracticeProfile;
