import { ChatMessage, Interview, User, UserFCMToken } from "../models/index.js";
import { Op, Sequelize } from "sequelize";
import { sendChatNotification } from "../utils/fcm.js";

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

    const availableToChatInterviews = await Interview.findAll({
      where: {
        [Op.or]: [
          {
            candidateUserId: userId,
          },
          {
            practiceUserId: userId,
          },
        ],
        [Op.or]: [
          {
            status: "confirmed",
          },
          {
            status: "completed",
          },
        ],
      },
      order: [["updatedAt", "DESC"]],
    });

    const availableToChat = availableToChatInterviews.map((i) => ({
      participants: [i.practiceUserId, i.candidateUserId],
      timestamp: i.updatedAt,
    }));

    const chatsData = chats.map((c) => ({
      participants: [c.senderId, c.receiverId],
      timestamp: c.createdAt,
      message: {
        id: c.id,
        senderId: c.senderId,
        message: c.message,
      },
    }));

    const uniqueChats = [...chatsData, ...availableToChat].filter(
      (c, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.participants.sort().join(",") === c.participants.sort().join(",")
        )
    );

    return res.status(200).json({
      chats: uniqueChats.sort((a, b) => b.timestamp - a.timestamp),
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
}

/**
 * Send a chat message to a recipient
 * Uses FCM to send push notifications instead of socket.io
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * Body parameters:
 * - receiverId (required): UUID of the recipient
 * - message (required): Message text (max 1000 characters)
 *
 * Returns the created message and FCM send status
 */
export async function sendMessage(req, res) {
  try {
    const senderId = req.user.sub; // Authenticated user ID from JWT
    const { receiverId, message } = req.body;

    console.log(
      `[sendMessage] senderId: ${senderId}, receiverId: ${receiverId}, message length: ${message?.length}`
    );

    // Validate required fields
    if (!message || !receiverId) {
      return res.status(400).json({
        message: "Invalid message or receiver ID",
        code: "MISSING_FIELDS",
      });
    }

    // Validate sender is authenticated
    if (!senderId) {
      return res.status(401).json({
        message: "Not authenticated",
        code: "NOT_AUTHENTICATED",
      });
    }

    // Check if receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found",
        code: "RECEIVER_NOT_FOUND",
      });
    }

    // Verify message validity
    const trimmedMessage = message.trim();
    const isMessageToSelf = senderId === receiverId;
    const isMessageValid =
      trimmedMessage.length > 0 && !isMessageToSelf && message.length < 1000;

    if (!isMessageValid) {
      let reason = "Invalid message";
      if (isMessageToSelf) {
        reason = "Cannot send message to self";
      } else if (trimmedMessage.length === 0) {
        reason = "Message cannot be empty";
      } else if (message.length >= 1000) {
        reason = "Message too long (max 1000 characters)";
      }

      return res.status(400).json({
        message: reason,
        code: "INVALID_MESSAGE",
      });
    }

    // Check if there are any confirmed or completed interviews between the two users
    const interviewsCount = await Interview.count({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              {
                candidateUserId: senderId,
                practiceUserId: receiverId,
              },
              {
                candidateUserId: receiverId,
                practiceUserId: senderId,
              },
            ],
          },
          {
            [Op.or]: [
              {
                status: "confirmed",
              },
              {
                status: "completed",
              },
            ],
          },
        ],
      },
    });

    /** If there are any confirmed or completed interviews between the two users, the user is permitted to send a message */
    const isPermitted = interviewsCount > 0;

    // Check permission
    if (!isPermitted) {
      return res.status(403).json({
        message:
          "No permission to send message. You must have a confirmed or completed interview with this user.",
        code: "NO_PERMISSION",
      });
    }

    // Get sender info for notification
    const sender = await User.findByPk(senderId);
    const senderName = sender?.fullName || "Someone";
    const senderAvatar = null; // Can be enhanced later to fetch from profile media

    // Create message in database
    const savedMessage = await ChatMessage.create({
      senderId,
      receiverId,
      message: trimmedMessage,
    });

    // Send FCM notification to all receiver's registered devices
    const receiverTokens = await UserFCMToken.findAll({
      where: { userId: receiverId },
    });

    let fcmResults = {
      total: receiverTokens.length,
      successful: 0,
      failed: 0,
    };

    if (receiverTokens.length > 0) {
      const messageData = {
        id: savedMessage.id,
        senderId,
        message: trimmedMessage,
        createdAt: savedMessage.createdAt,
      };

      // Send notifications to all tokens in parallel
      const fcmPromises = receiverTokens.map((token) =>
        sendChatNotification(
          token.fcmToken,
          messageData,
          senderName,
          senderAvatar
        )
      );

      const results = await Promise.allSettled(fcmPromises);

      // Process results and clean up invalid tokens
      const invalidTokenIds = [];
      const validTokenIds = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          if (result.value.success) {
            fcmResults.successful++;
            // Track valid tokens to update lastUsedAt
            validTokenIds.push(receiverTokens[index].id);
          } else {
            fcmResults.failed++;
            // If token is invalid, mark for deletion
            if (result.value.error === "INVALID_TOKEN") {
              invalidTokenIds.push(receiverTokens[index].id);
            }
          }
        } else {
          fcmResults.failed++;
          console.error(
            `[sendMessage] FCM promise rejected for token ${receiverTokens[index].id}:`,
            result.reason
          );
        }
      });

      // Update lastUsedAt for successfully used tokens
      if (validTokenIds.length > 0) {
        await UserFCMToken.update(
          { lastUsedAt: new Date() },
          { where: { id: { [Op.in]: validTokenIds } } }
        );
      }

      // Clean up invalid tokens
      if (invalidTokenIds.length > 0) {
        await UserFCMToken.destroy({
          where: { id: { [Op.in]: invalidTokenIds } },
        });
        console.log(
          `[sendMessage] Removed ${invalidTokenIds.length} invalid FCM tokens for user ${receiverId}`
        );
      }
    } else {
      console.log(
        `[sendMessage] Receiver ${receiverId} has no FCM tokens, skipping notification`
      );
    }

    return res.status(201).json({
      message: {
        id: savedMessage.id,
        senderId,
        receiverId,
        message: trimmedMessage,
        createdAt: savedMessage.createdAt,
      },
    });
  } catch (error) {
    console.error(
      `[sendMessage] Error sending message for userId=${req?.user?.sub}. Error:`,
      error
    );
    return res.status(500).json({
      message: "Failed to send message",
      code: "SERVER_ERROR",
      error: error.message,
    });
  }
}
