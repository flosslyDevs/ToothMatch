import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { logger as loggerRoot } from './logger.js';

const loggerBase = loggerRoot.child('utils/upload.js');

const uploadsRoot = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsRoot)) {
  loggerBase.info('Creating uploads directory', { path: uploadsRoot });
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const logger = loggerBase.child('storage.destination');
    logger.debug('Setting upload destination', { destination: uploadsRoot });
    cb(null, uploadsRoot);
  },
  filename: function (req, file, cb) {
    const logger = loggerBase.child('storage.filename');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = uniqueSuffix + '-' + safeOriginal;
    logger.debug('Generating filename', {
      originalName: file.originalname,
      filename,
    });
    cb(null, filename);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const logger = loggerBase.child('fileFilter');
    logger.debug('Filtering file', {
      originalName: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname,
    });
    // Accept all files
    cb(null, true);
  },
});
