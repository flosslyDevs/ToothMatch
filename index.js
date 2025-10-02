import 'dotenv/config';
import express, { json } from 'express';
import morgan from 'morgan';
import { connectToDatabase } from './services/db.js';
import authRouter from './api/auth.js';
import profileRouter from './api/profile.js';

const app = express();

// Middleware
app.use(json());
app.use(morgan('dev'));
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);

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


