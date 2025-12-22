/**
 * This module stores the connections between users and sockets.
 */

const userToSockets = new Map();    // userId -> Set<socketId>
const socketToUser = new Map();     // socketId -> userId

/**
 * Add a connection between a user and a socket.
 * @param {string} userId - The user ID.
 * @param {string} socketId - The socket ID.
 */
export const addConnection = (userId, socketId) => {
  if (!userToSockets.has(userId)) {
    userToSockets.set(userId, new Set());
  }
  userToSockets.get(userId).add(socketId);
  socketToUser.set(socketId, userId);
};

/**
 * Remove a connection between a user and a socket.
 * @param {string} socketId - The socket ID.
 */
export const removeConnection = (socketId) => {
  const userId = socketToUser.get(socketId);
  if (!userId) return;

  socketToUser.delete(socketId);
  const sockets = userToSockets.get(userId);
  if (!sockets) return;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    userToSockets.delete(userId);
  }
};

/**
 * Get the connected sockets for a user.
 * @param {string} userId - The user ID.
 * @returns {Set<string>} The sockets for the user.
 */
export const getSocketsForUser = (userId) => {
  return userToSockets.get(userId) ?? new Set();
};

/**
 * Get the user for a connected socket.
 * @param {string} socketId - The socket ID.
 * @returns {string | null} The user ID for the socket.
 */
export const getUserForSocket = (socketId) => socketToUser.get(socketId) ?? null;