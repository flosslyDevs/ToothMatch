import { handleConnection } from './onConnection.js';

export const registerSocketEvents = (io) => {
	io.on('connection', (socket) => {
		handleConnection(socket, io);
	});
};



