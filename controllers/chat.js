import { ChatMessage } from '../models/index.js';
import { Op } from 'sequelize';

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

		console.log(`[getChatHistory] userId: ${userId}, receiverId: ${receiverId}, beforeMessageId: ${beforeMessageId}`);

		// Validate required parameters
		if (!receiverId) {
			console.warn(`[getChatHistory] Missing receiverId param from userId: ${userId}`);
			return res.status(400).json({ 
				message: 'receiverId is required' 
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
				console.warn(`[getChatHistory] Cursor message not found or does not belong to this conversation. userId=${userId}, receiverId=${receiverId}, beforeMessageId=${beforeMessageId}`);
				return res.status(404).json({ 
					message: 'Message not found or does not belong to this conversation' 
				});
			}

			console.log(`[getChatHistory] Found cursorMessage with createdAt: ${cursorMessage.createdAt}`);
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
		});

		console.log(`[getChatHistory] Fetched ${messages.length} messages for userId=${userId}, receiverId=${receiverId}.`);

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
			console.log(`[getChatHistory] Remaining older messages count: ${remaining}`);
		} else {
			console.log(`[getChatHistory] No messages found for userId=${userId}, receiverId=${receiverId} with params beforeMessageId=${beforeMessageId}.`);
		}

		return res.status(200).json({
			messages,
			pagination: {
				remainingMessagesCount: remaining,
			}
		});
	} catch (error) {
		console.error(`[getChatHistory] Error fetching chat history for userId=${req?.user?.sub}. Error:`, error);
		return res.status(500).json({ 
			message: 'Error fetching chat history', 
			error: error.message 
		});
	}
}

