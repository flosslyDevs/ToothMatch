import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsRoot)) {
	fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsRoot);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
		cb(null, uniqueSuffix + '-' + safeOriginal);
	},
});

export const upload = multer({ storage });


