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

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
	if (err) {
		if (err.code === 'LIMIT_FILE_COUNT') {
			return res.status(400).json({ message: 'Too many files. Maximum 5 files allowed.' });
		}
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ message: 'File too large. Please check file size limits.' });
		}
		if (err.code === 'LIMIT_UNEXPECTED_FILE') {
			// If the unexpected field is 'file', it means multer.array was used but single file was sent
			// or vice versa. Provide helpful message.
			if (err.field === 'file') {
				return res.status(400).json({ 
					message: 'Field name mismatch. For multiple files, use field name "file" and send multiple files with the same field name.',
					hint: 'Example: formData.append("file", file1); formData.append("file", file2);'
				});
			}
			return res.status(400).json({ message: `Unexpected field: ${err.field}. Please use 'file' as the field name for file uploads.` });
		}
		return res.status(400).json({ message: err.message || 'File upload error' });
	}
	next();
};

// Wrapper to handle multer errors properly
const handleUpload = (multerMiddleware, controller) => {
	return (req, res, next) => {
		multerMiddleware(req, res, (err) => {
			if (err) {
				return handleMulterError(err, req, res, next);
			}
			controller(req, res, next);
		});
	};
};

// Authenticated uploads that also create DB records linked to the user
router.post('/user/media', authMiddleware, handleUpload(upload.single('file'), uploadUserMedia));
router.post('/practice/media', authMiddleware, handleUpload(upload.array('file', 5), uploadPracticeMedia));
router.post('/user/document', authMiddleware, handleUpload(upload.array('file', 5), uploadUserDocument));

// Practice compliance document uploads
router.post('/practice/compliance', authMiddleware, handleUpload(upload.single('file'), uploadPracticeComplianceDocument));


