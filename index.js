import 'dotenv/config';
import express, { json } from 'express';
import morgan from 'morgan';
import { connectToDatabase } from './services/db.js';
import authRouter from './api/auth.js';
import configRouter from './api/config.js';
import profileRouter from './api/profile.js';
import practiceRouter from './api/practice.js';

const app = express();

// Middleware
app.use(json());
app.use(morgan('dev'));
app.use('/api/auth', authRouter);
app.use('/api/config', configRouter);
app.use('/api/profile', profileRouter);
app.use('/api/practice', practiceRouter);

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

// Database connection

connectToDatabase().catch(() => {
	process.exitCode = 1;
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});


