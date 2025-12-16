import { getUserForSocket, getSocketsForUser } from "../../registry.js";
import { Interview, ChatMessage } from "../../../models/index.js";
import { Op } from "sequelize";
import User from "../../../models/auth/users.js";

const handleChatSend = async (socket, io, data) => {
  try {
    const message = data.message;
    const receiverId = data.receiverId;

    console.log("Chat send event received from ", socket.id);
    
    // Validate required fields
    if (!message || !receiverId) {
      socket.emit('chat:error', { 
        message: 'Invalid message or receiver ID',
        code: 'MISSING_FIELDS'
      });
      return;
    }

    // Get user ID for sender
    const senderId = getUserForSocket(socket.id);
    
    // Validate sender is authenticated
    if (!senderId) {
      socket.emit('chat:error', { 
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const receiver = await User.findByPk(receiverId);

    if (!receiver) {
      socket.emit('chat:error', { 
        message: 'Receiver not found',
        code: 'RECEIVER_NOT_FOUND'
      });
      return;
    }

    // Verify message validity
    const trimmedMessage = message.trim();
    const isMessageToSelf = senderId === receiverId;
    const isMessageValid = trimmedMessage.length > 0 && !isMessageToSelf && message.length < 1000;

    if (!isMessageValid) {
      let reason = 'Invalid message';
      if (isMessageToSelf) {
        reason = 'Cannot send message to self';
      } else if (trimmedMessage.length === 0) {
        reason = 'Message cannot be empty';
      } else if (message.length >= 1000) {
        reason = 'Message too long (max 1000 characters)';
      }
      
      socket.emit('chat:error', { 
        message: reason,
        code: 'INVALID_MESSAGE'
      });
      return;
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
      socket.emit('chat:error', { 
        message: 'No permission to send message. You must have a confirmed or completed interview with this user.',
        code: 'NO_PERMISSION'
      });
      return;
    }

    // Create message in database
    const savedMessage = await ChatMessage.create({
      senderId,
      receiverId,
      message: trimmedMessage,
    });

    // Emit message to all receiver's active socket connections (if online)
    const receiverSocketIds = getSocketsForUser(receiverId);

    if (receiverSocketIds.size > 0) {
      receiverSocketIds.forEach(socketId => {
        io.to(socketId).emit("chat:receive", {
          id: savedMessage.id,
          senderId,
          message: trimmedMessage,
          createdAt: savedMessage.createdAt,
        });
      });
    }

    // Emit confirmation to sender
    socket.emit("chat:sent", {
      id: savedMessage.id,
      receiverId,
      message: trimmedMessage,
      createdAt: savedMessage.createdAt,
    });

  } catch (error) {
    console.error('Error handling chat send:', error);
    socket.emit('chat:error', {
      message: 'Failed to send message',
      code: 'SERVER_ERROR',
      error: error.message
    });
  }
};

export default handleChatSend;