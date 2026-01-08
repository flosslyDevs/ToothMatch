import {
  ChatMessage,
  ChatThread,
  ChatThreadParticipant,
  Interview,
  User,
  UserFCMToken,
  Media,
  PracticeMedia,
  Match,
} from '../models/index.js';
import { Op } from 'sequelize';
import { sendChatNotification } from '../utils/fcm.js';
import { logger as loggerRoot } from '../utils/logger.js';

const loggerBase = loggerRoot.child('controllers/chat.js');

/**
 * Get chat history between the authenticated user and a recipient
 * Uses cursor-based pagination for infinite scroll
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * Query parameters:
 * - threadId (optional): UUID of the thread (if provided, uses this directly)
 * - receiverId (optional): UUID of the other participant (required if threadId not provided)
 * - beforeMessageId (optional): UUID of message to fetch older messages before (cursor)
 *
 * Returns messages ordered by createdAt DESC (newest first)
 * When beforeMessageId is provided, returns messages older than that message
 */
export async function getChatHistory(req, res) {
  const logger = loggerBase.child('getChatHistory');
  try {
    const userId = req.user.sub; // Authenticated user ID from JWT
    const { threadId, receiverId, beforeMessageId } = req.query;

    logger.debug('Fetching chat history', {
      userId,
      threadId,
      receiverId,
      beforeMessageId,
    });

    const messageLimit = 10;
    let resolvedThreadId = null;

    // If threadId is provided, use it directly (but verify user is a participant)
    if (threadId) {
      const userParticipant = await ChatThreadParticipant.findOne({
        where: {
          threadId,
          userId,
        },
        include: [
          {
            model: ChatThread,
          },
        ],
      });

      if (!userParticipant) {
        return res.status(403).json({
          message: 'Thread not found or user is not a participant',
        });
      }

      resolvedThreadId = threadId;
    } else {
      // Fall back to finding thread by receiverId
      if (!receiverId) {
        logger.warn('Missing both threadId and receiverId', { userId });
        return res.status(400).json({
          message: 'Either threadId or receiverId is required',
        });
      }

      // Find thread between userId and receiverId
      // Get thread where both users are participants
      const userParticipant = await ChatThreadParticipant.findOne({
        where: { userId },
        include: [
          {
            model: ChatThread,
            where: { type: 'direct' },
            include: [
              {
                model: ChatThreadParticipant,
                where: { userId: receiverId },
                required: true,
              },
            ],
          },
        ],
      });

      if (!userParticipant?.ChatThread) {
        // No thread exists yet, return empty messages
        return res.status(200).json({
          messages: [],
          pagination: {
            remainingMessagesCount: 0,
          },
        });
      }

      resolvedThreadId = userParticipant.ChatThread.id;
    }

    // Build where clause using resolved threadId
    const whereClause = {
      threadId: resolvedThreadId,
    };

    // If beforeMessageId is provided, fetch messages older than that message
    if (beforeMessageId) {
      // First, verify the message exists and belongs to this thread
      const cursorMessage = await ChatMessage.findOne({
        where: {
          id: beforeMessageId,
          threadId: resolvedThreadId,
        },
      });

      if (!cursorMessage) {
        logger.warn('Cursor message not found or does not belong to thread', {
          userId,
          threadId: resolvedThreadId,
          beforeMessageId,
        });
        return res.status(404).json({
          message: 'Message not found or does not belong to this conversation',
        });
      }

      logger.debug('Found cursor message', {
        createdAt: cursorMessage.createdAt,
      });
      // Fetch messages older than the cursor message
      whereClause.createdAt = {
        [Op.lt]: cursorMessage.createdAt,
      };
    }

    // Fetch messages ordered by createdAt DESC (newest first)
    // When loading older messages, we want messages before the cursor
    const messages = await ChatMessage.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: messageLimit,
      attributes: ['id', 'senderId', 'message', 'createdAt'],
    });

    logger.debug('Fetched messages', {
      count: messages.length,
      userId,
      threadId: resolvedThreadId,
    });

    // Determine if there are more messages to load
    let remaining = 0;
    if (messages.length > 0) {
      // Check if there are more messages older than the oldest one we fetched
      const oldestMessage = messages[messages.length - 1];

      // Build where clause for checking older messages
      const olderWhereClause = {
        threadId: resolvedThreadId,
        createdAt: {
          [Op.lt]: oldestMessage.createdAt,
        },
      };

      remaining = await ChatMessage.count({
        where: olderWhereClause,
      });
      logger.debug('Remaining messages count', { remaining });
    } else {
      logger.debug('No messages found', {
        userId,
        threadId: resolvedThreadId,
        beforeMessageId,
      });
    }

    return res.status(200).json({
      messages,
      pagination: {
        remainingMessagesCount: remaining,
      },
    });
  } catch (error) {
    logger.error(
      'Error fetching chat history',
      { userId: req?.user?.sub, error: error.message },
      error
    );
    return res.status(500).json({
      message: 'Error fetching chat history',
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
  const logger = loggerBase.child('getChats');
  const userId = req.user.sub;
  logger.debug('Fetching chats', { userId });

  if (!userId) {
    logger.warn('No userId found in request');
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    // Optimized: Get all threads where user is a participant with latest messages in one query
    logger.debug('Fetching chat thread participants', { userId });
    const userParticipants = await ChatThreadParticipant.findAll({
      where: { userId },
      include: [
        {
          model: ChatThread,
          include: [
            {
              model: ChatMessage,
              separate: true,
              order: [['createdAt', 'DESC']],
              limit: 1,
              attributes: ['id', 'senderId', 'message', 'createdAt'],
            },
            {
              model: ChatThreadParticipant,
              where: { userId: { [Op.ne]: userId } },
              required: false,
              include: [
                {
                  model: User,
                  attributes: ['id', 'fullName'],
                  required: false,
                  include: [
                    {
                      model: Media,
                      attributes: ['kind', 'url'],
                      limit: 1,
                      separate: true,
                      required: false,
                      where: {
                        kind: {
                          [Op.in]: ['logo', 'profile_photo'],
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    logger.debug('Found chat threads', {
      count: userParticipants.length,
      userId,
    });

    // Avatar map for other users
    const avatarMap = new Map();
    for (const participant of userParticipants) {
      const otherParticipant =
        participant.ChatThread?.ChatThreadParticipants?.[0];
      if (!otherParticipant) {
        continue;
      }
      const otherUserId = otherParticipant.userId;
      const otherUser = otherParticipant.User;
      const avatar = otherUser?.Media?.[0]?.url || null;
      avatarMap.set(otherUserId, avatar);
    }

    // Build response data
    const chatsData = [];
    for (const participant of userParticipants) {
      const thread = participant.ChatThread;
      if (!thread) {
        logger.warn('ChatThread missing for participant', {
          participantId: participant.id,
        });
        continue;
      }

      // Access latest message - Sequelize pluralizes model name for hasMany
      const latestMessage = thread.ChatMessages?.[0] || null;
      const otherParticipant = thread.ChatThreadParticipants?.[0];

      if (!otherParticipant) {
        logger.warn('No other participant found for thread', {
          threadId: thread.id,
        });
        continue;
      }

      const otherUserId = otherParticipant.userId;
      const otherUser = otherParticipant.User;

      const otherUserData = {
        id: otherUserId,
        name: otherUser?.fullName || null,
        avatar: avatarMap.get(otherUserId) || null,
      };

      chatsData.push({
        threadId: thread.id,
        otherUser: otherUserData,
        timestamp: latestMessage?.createdAt ?? thread.createdAt,
        message: latestMessage
          ? {
              id: latestMessage.id,
              senderId: latestMessage.senderId,
              message: latestMessage.message,
            }
          : {
              senderId: null,
              message: 'You started a new conversation',
            },
        lastReadAt: participant.lastReadAt,
        muted: participant.muted,
        archived: participant.archived,
      });
    }

    logger.debug('Returning chats', { count: chatsData.length, userId });
    return res.status(200).json({
      chats: chatsData.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    });
  } catch (error) {
    logger.error(
      'Error fetching chats',
      { userId, error: error.message },
      error
    );
    return res
      .status(500)
      .json({ message: error.message || 'Internal server error' });
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
  const logger = loggerBase.child('sendMessage');
  try {
    const senderId = req.user.sub; // Authenticated user ID from JWT
    const { receiverId, message } = req.body;

    logger.debug('Sending message', {
      senderId,
      receiverId,
      messageLength: message?.length,
    });

    // Validate required fields
    if (!message || !receiverId) {
      return res.status(400).json({
        message: 'Invalid message or receiver ID',
        code: 'MISSING_FIELDS',
      });
    }

    // Validate sender is authenticated
    if (!senderId) {
      return res.status(401).json({
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED',
      });
    }

    // Check if receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        message: 'Receiver not found',
        code: 'RECEIVER_NOT_FOUND',
      });
    }

    // Verify message validity
    const trimmedMessage = message.trim();
    const isMessageToSelf = senderId === receiverId;
    const isMessageValid =
      trimmedMessage.length > 0 && !isMessageToSelf && message.length < 1000;

    if (!isMessageValid) {
      let reason = 'Invalid message';
      if (isMessageToSelf) {
        reason = 'Cannot send message to self';
      } else if (trimmedMessage.length === 0) {
        reason = 'Message cannot be empty';
      } else if (message.length >= 1000) {
        reason = 'Message too long (max 1000 characters)';
      }

      return res.status(400).json({
        message: reason,
        code: 'INVALID_MESSAGE',
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
                status: 'confirmed',
              },
              {
                status: 'completed',
              },
            ],
          },
        ],
      },
    });

    // Check if the users have liked each other
    const matchExists = await Match.findOne({
      where: {
        [Op.or]: [{ candidateUserId: senderId }, { practiceUserId: senderId }],
        status: 'matched',
      },
      attributes: ['id'],
    });

    /** If there are any confirmed or completed interviews between the two users, the user is permitted to send a message */
    const isPermitted = interviewsCount > 0 || matchExists;

    // Check permission
    if (!isPermitted) {
      return res.status(403).json({
        message:
          'No permission to send message. You must either have a confirmed or completed interview with this user, or have liked each other.',
        code: 'NO_PERMISSION',
      });
    }

    // Get sender info for notification
    const sender = await User.findByPk(senderId, {
      include: [
        {
          model: Media,
          attributes: ['url'],
          required: false,
          where: {
            kind: 'profile_photo',
          },
        },
        {
          model: PracticeMedia,
          attributes: ['url'],
          required: false,
          where: {
            kind: 'logo',
          },
        },
      ],
    });
    const senderName = sender?.fullName || 'Someone';
    const senderAvatar =
      sender?.Media?.[0]?.url || sender?.PracticeMedia?.[0]?.url || null;

    // Find or create thread between sender and receiver
    // Get thread where both users are participants
    const senderParticipant = await ChatThreadParticipant.findOne({
      where: { userId: senderId },
      include: [
        {
          model: ChatThread,
          where: { type: 'direct' },
          include: [
            {
              model: ChatThreadParticipant,
              where: { userId: receiverId },
              required: true,
            },
          ],
        },
      ],
    });

    let thread = senderParticipant?.ChatThread;

    // If thread doesn't exist, create it
    if (!thread) {
      thread = await ChatThread.create({
        type: 'direct',
      });

      // Create participants for both users
      await ChatThreadParticipant.create({
        threadId: thread.id,
        userId: senderId,
      });

      await ChatThreadParticipant.create({
        threadId: thread.id,
        userId: receiverId,
      });
    }

    // Update thread's updatedAt timestamp
    await thread.update({ updatedAt: new Date() });

    // Update sender's lastReadAt in ChatThreadParticipant
    await ChatThreadParticipant.update(
      { lastReadAt: new Date() },
      { where: { threadId: thread.id, userId: senderId } }
    );

    // Create message in database
    const savedMessage = await ChatMessage.create({
      threadId: thread.id,
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
        threadId: thread.id,
        senderId: senderId,
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
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            fcmResults.successful++;
            // Track valid tokens to update lastUsedAt
            validTokenIds.push(receiverTokens[index].id);
          } else {
            fcmResults.failed++;
            // If token is invalid, mark for deletion
            if (result.value.error === 'INVALID_TOKEN') {
              invalidTokenIds.push(receiverTokens[index].id);
            }
          }
        } else {
          fcmResults.failed++;
          logger.warn('FCM promise rejected', {
            tokenId: receiverTokens[index].id,
            error: result.reason?.message || result.reason,
          });
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
        logger.info('Removed invalid FCM tokens', {
          count: invalidTokenIds.length,
          receiverId,
        });
      }
    } else {
      logger.debug('Receiver has no FCM tokens', { receiverId });
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
    logger.error(
      'Error sending message',
      { userId: req?.user?.sub, error: error.message },
      error
    );
    return res.status(500).json({
      message: 'Failed to send message',
      code: 'SERVER_ERROR',
      error: error.message,
    });
  }
}

/**
 * Mark a thread as read for the authenticated user
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * URL parameters:
 * - threadId (required): UUID of the thread
 */
export async function markThreadAsRead(req, res) {
  const logger = loggerBase.child('markThreadAsRead');
  const userId = req.user.sub;
  const { threadId } = req.params;

  try {
    logger.debug('Marking thread as read', { userId, threadId });

    if (!threadId) {
      return res.status(400).json({
        message: 'threadId is required',
      });
    }

    // Verify user is a participant in this thread
    const participant = await ChatThreadParticipant.findOne({
      where: {
        threadId,
        userId,
      },
    });

    if (!participant) {
      return res.status(404).json({
        message: 'Thread not found or user is not a participant',
      });
    }

    // Update lastReadAt
    await participant.update({
      lastReadAt: new Date(),
    });

    return res.status(200).json({
      message: 'Thread marked as read',
      lastReadAt: participant.lastReadAt,
    });
  } catch (error) {
    logger.error(
      'Error marking thread as read',
      { userId: req?.user?.sub, threadId, error: error.message },
      error
    );
    return res.status(500).json({
      message: 'Failed to mark thread as read',
      error: error.message,
    });
  }
}

/**
 * Toggle mute status for a thread
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * URL parameters:
 * - threadId (required): UUID of the thread
 */
export async function toggleThreadMute(req, res) {
  const logger = loggerBase.child('toggleThreadMute');
  const userId = req.user.sub;
  const { threadId } = req.params;
  try {
    logger.debug('Toggling thread mute', { userId, threadId });

    if (!threadId) {
      return res.status(400).json({
        message: 'threadId is required',
      });
    }

    // Verify user is a participant in this thread
    const participant = await ChatThreadParticipant.findOne({
      where: {
        threadId,
        userId,
      },
    });

    if (!participant) {
      return res.status(404).json({
        message: 'Thread not found or user is not a participant',
      });
    }

    // Toggle mute status
    const newMutedStatus = !participant.muted;
    await participant.update({
      muted: newMutedStatus,
    });

    return res.status(200).json({
      message: `Thread ${newMutedStatus ? 'muted' : 'unmuted'}`,
      muted: newMutedStatus,
    });
  } catch (error) {
    logger.error(
      'Error toggling thread mute',
      { userId: req?.user?.sub, threadId, error: error.message },
      error
    );
    return res.status(500).json({
      message: 'Failed to toggle thread mute',
      error: error.message,
    });
  }
}

/**
 * Toggle archive status for a thread
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * URL parameters:
 * - threadId (required): UUID of the thread
 */
export async function toggleThreadArchive(req, res) {
  const logger = loggerBase.child('toggleThreadArchive');

  const userId = req.user.sub;
  const { threadId } = req.params;

  try {
    logger.debug('Toggling thread archive', { userId, threadId });

    if (!threadId) {
      return res.status(400).json({
        message: 'threadId is required',
      });
    }

    // Verify user is a participant in this thread
    const participant = await ChatThreadParticipant.findOne({
      where: {
        threadId,
        userId,
      },
    });

    if (!participant) {
      return res.status(404).json({
        message: 'Thread not found or user is not a participant',
      });
    }

    // Toggle archive status
    const newArchivedStatus = !participant.archived;
    await participant.update({
      archived: newArchivedStatus,
    });

    return res.status(200).json({
      message: `Thread ${newArchivedStatus ? 'archived' : 'unarchived'}`,
      archived: newArchivedStatus,
    });
  } catch (error) {
    logger.error(
      'Error toggling thread archive',
      { userId: req?.user?.sub, threadId, error: error.message },
      error
    );
    return res.status(500).json({
      message: 'Failed to toggle thread archive',
      error: error.message,
    });
  }
}
