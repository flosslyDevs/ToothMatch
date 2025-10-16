import path from 'path';
import { Media, IdentityDocument } from '../models/index.js';

function buildFileUrl(req, filePath) {
	return `${req.protocol}://${req.get('host')}/uploads/${path.basename(filePath)}`;
}

export async function uploadUserMedia(req, res) {
	const userId = req.user?.sub;
	if (!userId) return res.status(401).json({ message: 'Unauthorized' });
	const file = req.file;
	if (!file) return res.status(400).json({ message: 'No file uploaded' });
	const { kind } = req.body;
	if (!kind) return res.status(400).json({ message: 'kind is required' });
	try {
		const url = buildFileUrl(req, file.path);
		const media = await Media.create({ userId, kind, url });
		return res.status(201).json({ media });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function uploadUserDocument(req, res) {
	const userId = req.user?.sub;
	if (!userId) return res.status(401).json({ message: 'Unauthorized' });
	const file = req.file;
	if (!file) return res.status(400).json({ message: 'No file uploaded' });
	const allowedTypes = ['passport', 'proof_of_address', 'professional_certificate'];
	const type = (req.body?.type || '').toLowerCase();
	if (!allowedTypes.includes(type)) {
		return res.status(400).json({ message: `type must be one of: ${allowedTypes.join(', ')}` });
	}
	try {
		const url = buildFileUrl(req, file.path);
		const document = await IdentityDocument.create({ userId, type, url });
		return res.status(201).json({ document });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}


