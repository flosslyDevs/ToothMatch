import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const Interview = sequelize?.define(
  'Interview',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    practiceUserId: { type: DataTypes.UUID, allowNull: false }, // Practice user ID who scheduled the interview
    candidateUserId: { type: DataTypes.UUID, allowNull: false }, // Candidate user ID for whom the interview is scheduled
    meetingType: {
      type: DataTypes.ENUM('Video', 'Inperson', 'Call'),
      allowNull: false,
    },
    location: {
      type: DataTypes.ENUM('Online', 'Office'),
      allowNull: false,
    },
    date: { type: DataTypes.STRING, allowNull: false }, // Date as string
    time: { type: DataTypes.STRING, allowNull: false }, // Time in 24-hour format as string (e.g., "14:30")
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'scheduled',
    },
    notes: { type: DataTypes.TEXT, allowNull: true }, // Optional notes
    // Reschedule request fields
    rescheduleRequested: { type: DataTypes.BOOLEAN, defaultValue: false },
    rescheduleRequestDate: { type: DataTypes.DATE, allowNull: true },
    rescheduleRequestReason: { type: DataTypes.TEXT, allowNull: true },
    rescheduleRequestedDate: { type: DataTypes.STRING, allowNull: true }, // New requested date
    rescheduleRequestedTime: { type: DataTypes.STRING, allowNull: true }, // New requested time
    // Decline fields
    declined: { type: DataTypes.BOOLEAN, defaultValue: false },
    declinedAt: { type: DataTypes.DATE, allowNull: true },
    declineReason: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'interviews',
    underscored: true,
    timestamps: true,
  }
);

export default Interview;
