import { Server } from 'socket.io';
import { registerSocketEvents } from './events/index.js';

export const createSocketServer = (httpServer) => {
	const io = new Server(httpServer, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		}
	});

	registerSocketEvents(io);

	return io;
};


