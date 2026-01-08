import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const PracticePayment = sequelize?.define(
  'PracticePayment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    // Step 5: Payment & invoicing
    stripeAccountId: { type: DataTypes.STRING, allowNull: true },
    bankAccountDetails: { type: DataTypes.JSONB, allowNull: true },
    invoiceEmail: { type: DataTypes.STRING, allowNull: true },
    billingAddress: { type: DataTypes.STRING, allowNull: true },
    defaultLocationRatesPerRole: { type: DataTypes.JSONB, allowNull: true },
    cancellationPolicy: { type: DataTypes.JSONB, allowNull: true },
  },
  { tableName: 'practice_payments', underscored: true }
);

export default PracticePayment;
