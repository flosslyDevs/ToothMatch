import { ChatMessage } from "../models/index.js";
import { Op, Sequelize } from "sequelize";

/**
 * Get chat history between the authenticated user and a recipient
 * Uses cursor-based pagination for infinite scroll
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * Query parameters:
 * - receiverId (required): UUID of the other participant
 * - beforeMessageId (optional): UUID of message to fetch older messages before (cursor)
 *
 * Returns messages ordered by createdAt DESC (newest first)
 * When beforeMessageId is provided, returns messages older than that message
 */
export async function getChatHistory(req, res) {
  try {
    const userId = req.user.sub; // Authenticated user ID from JWT
    const { receiverId, beforeMessageId } = req.query;

    console.log(
      `[getChatHistory] userId: ${userId}, receiverId: ${receiverId}, beforeMessageId: ${beforeMessageId}`
    );

    // Validate required parameters
    if (!receiverId) {
      console.warn(
        `[getChatHistory] Missing receiverId param from userId: ${userId}`
      );
      return res.status(400).json({
        message: "receiverId is required",
      });
    }

    const messageLimit = 10;

    // Build where clause: messages between userId and receiverId
    const whereClause = {
      [Op.or]: [
        {
          senderId: userId,
          receiverId: receiverId,
        },
        {
          senderId: receiverId,
          receiverId: userId,
        },
      ],
    };

    // If beforeMessageId is provided, fetch messages older than that message
    if (beforeMessageId) {
      // First, verify the message exists and belongs to this conversation
      const cursorMessage = await ChatMessage.findOne({
        where: {
          id: beforeMessageId,
          [Op.or]: [
            { senderId: userId, receiverId: receiverId },
            { senderId: receiverId, receiverId: userId },
          ],
        },
      });

      if (!cursorMessage) {
        console.warn(
          `[getChatHistory] Cursor message not found or does not belong to this conversation. userId=${userId}, receiverId=${receiverId}, beforeMessageId=${beforeMessageId}`
        );
        return res.status(404).json({
          message: "Message not found or does not belong to this conversation",
        });
      }

      console.log(
        `[getChatHistory] Found cursorMessage with createdAt: ${cursorMessage.createdAt}`
      );
      // Fetch messages older than the cursor message
      whereClause.createdAt = {
        [Op.lt]: cursorMessage.createdAt,
      };
    }

    // Fetch messages ordered by createdAt DESC (newest first)
    // When loading older messages, we want messages before the cursor
    const messages = await ChatMessage.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: messageLimit,
    });

    console.log(
      `[getChatHistory] Fetched ${messages.length} messages for userId=${userId}, receiverId=${receiverId}.`
    );

    // Determine if there are more messages to load
    let remaining = 0;
    if (messages.length > 0) {
      // Check if there are more messages older than the oldest one we fetched
      const oldestMessage = messages[messages.length - 1];

      // Build base where clause for checking older messages
      const olderWhereClause = {
        [Op.or]: [
          {
            senderId: userId,
            receiverId: receiverId,
          },
          {
            senderId: receiverId,
            receiverId: userId,
          },
        ],
        createdAt: {
          [Op.lt]: oldestMessage.createdAt,
        },
      };

      remaining = await ChatMessage.count({
        where: olderWhereClause,
      });
      console.log(
        `[getChatHistory] Remaining older messages count: ${remaining}`
      );
    } else {
      console.log(
        `[getChatHistory] No messages found for userId=${userId}, receiverId=${receiverId} with params beforeMessageId=${beforeMessageId}.`
      );
    }

    return res.status(200).json({
      messages,
      pagination: {
        remainingMessagesCount: remaining,
      },
    });
  } catch (error) {
    console.error(
      `[getChatHistory] Error fetching chat history for userId=${req?.user?.sub}. Error:`,
      error
    );
    return res.status(500).json({
      message: "Error fetching chat history",
      error: error.message,
    });
  }
}

/**
 * Gets chats list for the current user
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * Returns chats list with the latest message data
 */
export async function getChats(req, res) {
  const userId = req.user.sub;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    // DB-side grouping: latest message per unique conversation, where (senderId, receiverId)
    // is treated the same as (receiverId, senderId).
    //
    // Implementation uses Postgres DISTINCT ON + a normalized other_user_id (relative to userId).
    const limit = 100;
    const offset = 0;

    const sql = `
      WITH latest AS (
        SELECT DISTINCT ON (other_user_id)
          id,
          sender_id   AS "senderId",
          receiver_id AS "receiverId",
          message,
          created_at  AS "createdAt",
          updated_at  AS "updatedAt",
          other_user_id AS "otherUserId"
        FROM (
          SELECT
            cm.*,
            CASE
              WHEN cm.sender_id = :userId THEN cm.receiver_id
              ELSE cm.sender_id
            END AS other_user_id
          FROM chat_messages cm
          WHERE cm.sender_id = :userId OR cm.receiver_id = :userId
        ) t
        ORDER BY other_user_id, created_at DESC
      )
      SELECT *
      FROM latest
      ORDER BY "createdAt" DESC
      LIMIT :limit OFFSET :offset;
    `;

    const chats = await ChatMessage.sequelize.query(sql, {
      replacements: { userId, limit, offset },
      type: Sequelize.QueryTypes.SELECT,
    });

    console.log(
      `[getChats] Fetched ${chats.length} chats for userId=${userId}`
    );

    return res.status(200).json({
      chats: chats.map((c) => ({
        id: c.id,
        senderId: c.senderId,
        receiverId: c.receiverId,
        message: c.message,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}
