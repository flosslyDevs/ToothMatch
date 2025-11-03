import express from 'express';
import path from 'path';
import { upload } from '../utils/upload.js';
import { authMiddleware } from '../utils/auth.js';
import { uploadUserMedia, uploadPracticeMedia, uploadUserDocument, uploadPracticeComplianceDocument } from '../controllers/upload.js';

const router = express.Router();

// Single file upload: field name 'file'
router.post('/single', upload.single('file'), async (req, res) => {
	const file = req.file;
	if (!file) return res.status(400).json({ message: 'No file uploaded' });
	const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(file.path)}`;
	return res.status(201).json({ url: fileUrl, filename: path.basename(file.path), size: file.size, mimetype: file.mimetype });
});

// Multiple files upload: field name 'files'
router.post('/multiple', upload.array('files', 10), async (req, res) => {
	const files = req.files || [];
	if (!files.length) return res.status(400).json({ message: 'No files uploaded' });
	const items = files.map(f => ({
		url: `${req.protocol}://${req.get('host')}/uploads/${path.basename(f.path)}`,
		filename: path.basename(f.path),
		size: f.size,
		mimetype: f.mimetype,
	}));
	return res.status(201).json({ files: items });
});

export default router;

// Authenticated uploads that also create DB records linked to the user
router.post('/user/media', authMiddleware, upload.single('file'), uploadUserMedia);
router.post('/practice/media', authMiddleware, upload.single('file'), uploadPracticeMedia);
router.post('/user/document', authMiddleware, upload.array('file', 10), uploadUserDocument);

// Practice compliance document uploads
router.post('/practice/compliance', authMiddleware, upload.single('file'), uploadPracticeComplianceDocument);


