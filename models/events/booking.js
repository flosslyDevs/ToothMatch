import { DataTypes } from "sequelize";
import { sequelize } from "../../services/db.js";

// Booking for an event
const Booking = sequelize?.define(
  "Booking",
  {
    /** ID of the booking */
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    /** ID of the profile who is booking the event */
    userId: { type: DataTypes.UUID, allowNull: false, unique: "uq_booking_user_event" },
    /** ID of the event */
    eventId: { type: DataTypes.UUID, allowNull: false, unique: "uq_booking_user_event" },
  },
  {
    tableName: "bookings",
    underscored: true,
  }
);

export default Booking;
