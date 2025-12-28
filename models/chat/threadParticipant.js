import { DataTypes } from "sequelize";
import { sequelize } from "../../services/db.js";

const ChatThreadParticipant = sequelize.define(
  "ChatThreadParticipant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    threadId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    lastReadAt: { type: DataTypes.DATE, allowNull: true },
    muted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "chat_thread_participants",
    underscored: true,
    indexes: [
      { fields: ["thread_id"] },
      { fields: ["user_id"] },
      { unique: true, fields: ["thread_id", "user_id"] },
    ],
  }
);

export default ChatThreadParticipant;
