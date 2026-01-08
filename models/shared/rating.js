import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const Rating = sequelize?.define(
  'Rating',
  {
    /** ID of the rating */
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    /** ID of the profile being rated (practice or candidate) */
    profileId: { type: DataTypes.UUID, allowNull: false },
    /** ID of the user who gave the rating */
    userId: { type: DataTypes.UUID, allowNull: false },
    /** Type of rating: "candidate" (practice rating a candidate) or "practice" (candidate rating a practice) */
    type: {
      type: DataTypes.ENUM('candidate', 'practice'),
      allowNull: false,
    },
    /** Rating given by the user (1-5) */
    rating: { type: DataTypes.INTEGER, allowNull: false },
    /** Comment given by the user */
    comment: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'ratings', underscored: true }
);

export default Rating;
