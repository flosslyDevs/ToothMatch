import { removeConnection } from "../registry.js";

export const handleDisconnect = (socket, reason) => {
	console.log(`Socket disconnected: ${socket.id} (reason: ${reason})`);
    removeConnection(socket.id);
};


