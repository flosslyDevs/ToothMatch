import 'dotenv/config';
import http from 'http';
import express, { json } from 'express';
import morgan from 'morgan';
import path from 'path';
import { connectToDatabase } from './services/db.js';
import authRouter from './api/auth.js';
import configRouter from './api/config.js';
import locumShiftRouter from './api/locumShift.js';
import permanentJobRouter from './api/permanentJob.js';
import profileRouter from './api/profile.js';
import practiceRouter from './api/practice.js';
import uploadRouter from './api/upload.js';
import jobsRouter from './api/jobs.js';
import eventsRouter from './api/events.js';
import matchRouter from './api/match.js';
import interviewRouter from './api/interview.js';
import chatRouter from './api/chat.js';
import { createSocketServer } from './socket/index.js';

const app = express();

// Middleware
app.use(json());
app.use(morgan('dev'));
app.use('/api/auth', authRouter);
app.use('/api/config', configRouter);
app.use('/api/locum-shifts', locumShiftRouter);
app.use('/api/permanent-jobs', permanentJobRouter);
app.use('/api/profile', profileRouter);
app.use('/api/practice', practiceRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/match', matchRouter);
app.use('/api/interview', interviewRouter);
app.use('/api/chat', chatRouter);
// Serve uploads folder statically
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

// Database connection
connectToDatabase().catch(() => {
	process.exitCode = 1;
});

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Socket.IO setup
createSocketServer(server);

server.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

