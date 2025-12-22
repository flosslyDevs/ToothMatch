import { handleDisconnect } from "./onDisconnection.js";
import User from "../../models/auth/users.js";
import { verifyToken } from "../../utils/jwt.js";
import {
  addConnection,
} from "../registry.js";
import handleChatSend from "./chat/send.js";

export const handleConnection = async (socket, io) => {
  // Support both HTTP headers and Socket.IO auth object
  let jwt = socket.handshake.headers.auth || 
            socket.handshake.auth?.jwt;

  if (!jwt) {
    socket.disconnect();
    return;
  }

  let userId;

  try {
    const decoded = verifyToken(jwt);
    userId = decoded.sub;

    if (!userId) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    addConnection(userId, socket.id);
    socket.data.userId = userId;
  } catch (error) {
    const reason = "Authentication failed";
    handleDisconnect(socket, reason);
    return;
  }

  console.log(`Socket connected: ${socket.id} (user: ${userId})`);

  // Client -> Server: chat:send
  socket.on("chat:send", (data) => handleChatSend(socket, io, data));

  // Disconnect
  socket.on("disconnect", (reason) => {
    handleDisconnect(socket, reason);
  });
};
