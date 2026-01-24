import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

// Events posted by a practice (userId is the practice's user id)
const Event = sequelize?.define(
  'Event',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // e.g. Free, Paid, Webinar
    description: { type: DataTypes.TEXT, allowNull: false },
    // JSON agenda array: [{ time: utcTime (0-2359), activity: string }, ...]
    agenda: { type: DataTypes.JSONB, allowNull: true },
    // String arrays
    whatsIncluded: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      field: 'whats_included',
    },
    eventImages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      field: 'event_images',
    },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    speakerInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'speaker_info',
    },
    cancellationPolicy: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cancellation_policy',
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'location',
    },
    titleOfEvent: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'title_of_event',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'amount',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
    }, // active, cancelled, archived
  },
  {
    tableName: 'events',
    underscored: true,
  }
);

export default Event;
