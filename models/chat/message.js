import { DataTypes } from "sequelize";
import { sequelize } from "../../services/db.js";

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    threadId: { type: DataTypes.UUID, allowNull: false },
    senderId: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "chat_messages",
    underscored: true,
    indexes: [{ fields: ["thread_id", "created_at"] }],
  }
);

export default ChatMessage;
