import { verifyToken } from './jwt.js';

export function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'No token provided' });
	}
	
	const token = authHeader.substring(7);
	try {
		const decoded = verifyToken(token);
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ message: 'Invalid token' });
	}
}
