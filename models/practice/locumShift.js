import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const LocumShift = sequelize?.define(
  'LocumShift',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false }, // Practice user ID
    role: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: true },
    time: { type: DataTypes.STRING, allowNull: true }, // Flexible time format
    breakLunchDuration: { type: DataTypes.STRING, allowNull: true },
    dayRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    hourlyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    overtimeRules: { type: DataTypes.TEXT, allowNull: true },
    paymentTerms: { type: DataTypes.TEXT, allowNull: true },
    cancellationPolicy: { type: DataTypes.TEXT, allowNull: true },
    skills: { type: DataTypes.JSON, allowNull: true }, // Array of skills
    software: { type: DataTypes.JSON, allowNull: true }, // Array of software
    specialisms: { type: DataTypes.JSON, allowNull: true }, // Array of specialisms
    parking: { type: DataTypes.STRING, allowNull: true },
    publicTransport: { type: DataTypes.STRING, allowNull: true },
    ppeProvided: { type: DataTypes.BOOLEAN, defaultValue: false },
    autoblockUnverified: { type: DataTypes.BOOLEAN, defaultValue: false },
    mandatoryDocsForBooking: { type: DataTypes.BOOLEAN, defaultValue: false },
    complianceText: { type: DataTypes.TEXT, allowNull: true },
    preapprovedCandidates: { type: DataTypes.BOOLEAN, defaultValue: false },
    candidateExpressesInterest: { type: DataTypes.BOOLEAN, defaultValue: true },
    status: { type: DataTypes.STRING, defaultValue: 'active' }, // active, filled, cancelled
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'locum_shifts',
    underscored: true,
    timestamps: true,
  }
);

export default LocumShift;
