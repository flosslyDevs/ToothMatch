import path from 'path';
import {
  Media,
  IdentityDocument,
  PracticeCompliance,
} from '../models/index.js';
import { logger as loggerRoot } from '../utils/logger.js';

const loggerBase = loggerRoot.child('controllers/upload.js');

function buildFileUrl(req, filePath) {
  return `${req.protocol}://${req.get('host')}/uploads/${path.basename(filePath)}`;
}

export async function uploadUserMedia(req, res) {
  const logger = loggerBase.child('uploadUserMedia');
  const userId = req.user?.sub;
  if (!userId) {
    logger.warn('Unauthorized upload attempt');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const file = req.file;
  if (!file) {
    logger.warn('No file uploaded', { userId });
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const { kind } = req.body;
  if (!kind) {
    logger.warn('Missing kind parameter', { userId });
    return res.status(400).json({ message: 'kind is required' });
  }
  try {
    logger.debug('Uploading user media', { userId, kind });
    const url = buildFileUrl(req, file.path);
    let media = null;
    // Replace media if its cover or profile picture
    if (kind === 'cover' || kind === 'profile_photo') {
      media = await Media.update({ url }, { where: { userId, kind } });
    } else {
      media = await Media.create({ userId, kind, url });
    }
    logger.info('User media uploaded', { userId, kind, mediaId: media.id });
    return res.status(201).json({ media });
  } catch (error) {
    logger.error(
      'Error uploading user media',
      { userId, kind, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Upload practice media (e.g., logo/avatar) to Media
export async function uploadPracticeMedia(req, res) {
  const logger = loggerBase.child('uploadPracticeMedia');
  const userId = req.user?.sub;
  if (!userId) {
    logger.warn('Unauthorized practice media upload attempt');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle both single file and multiple files
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) {
    logger.warn('No files uploaded', { userId });
    return res.status(400).json({ message: 'No files uploaded' });
  }

  // Check file limit (max 5 files)
  if (files.length > 5) {
    logger.warn('Too many files uploaded', { userId, fileCount: files.length });
    return res
      .status(400)
      .json({ message: 'Maximum 5 files allowed per request' });
  }

  const { kind } = req.body; // e.g., 'logo', 'clinic_photo', 'team_photo'
  if (!kind) {
    logger.warn('Missing kind parameter', { userId });
    return res.status(400).json({ message: 'kind is required' });
  }
  if (kind === 'logo' && files.length > 1) {
    logger.warn('Multiple logos uploaded', { userId });
    return res
      .status(400)
      .json({ message: 'Maximum 1 logo allowed per request' });
  }

  try {
    logger.debug('Uploading practice media', {
      userId,
      kind,
      fileCount: files.length,
    });
    const mediaItems = [];
    for (const file of files) {
      const url = buildFileUrl(req, file.path);
      let media = null;
      // Replace media if its logo
      if (kind === 'logo') {
        media = await Media.update({ url }, { where: { userId, kind } });
      } else {
        media = await Media.create({ userId, kind, url });
      }
      mediaItems.push(media);
    }

    // Return single media if only one file, array if multiple
    logger.info('Practice media uploaded', {
      userId,
      kind,
      count: mediaItems.length,
    });
    if (mediaItems.length === 1) {
      return res.status(201).json({ media: mediaItems[0] });
    } else {
      return res.status(201).json({ media: mediaItems });
    }
  } catch (error) {
    logger.error(
      'Error uploading practice media',
      { userId, kind, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

export async function uploadUserDocument(req, res) {
  const logger = loggerBase.child('uploadUserDocument');
  const userId = req.user?.sub;
  if (!userId) {
    logger.warn('Unauthorized document upload attempt');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle both single file and multiple files
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) {
    logger.warn('No files uploaded', { userId });
    return res.status(400).json({ message: 'No files uploaded' });
  }

  // Check file limit (max 5 files)
  if (files.length > 5) {
    logger.warn('Too many files uploaded', { userId, fileCount: files.length });
    return res
      .status(400)
      .json({ message: 'Maximum 5 files allowed per request' });
  }

  const allowedTypes = [
    'passport',
    'proof_of_address',
    'professional_certificate',
  ];
  const type = (req.body?.type || '').toLowerCase();
  if (!allowedTypes.includes(type)) {
    logger.warn('Invalid document type', { userId, type });
    return res
      .status(400)
      .json({ message: `type must be one of: ${allowedTypes.join(', ')}` });
  }

  try {
    logger.debug('Uploading user document', {
      userId,
      type,
      fileCount: files.length,
    });
    const documents = [];
    for (const file of files) {
      const url = buildFileUrl(req, file.path);
      const document = await IdentityDocument.create({ userId, type, url });
      documents.push(document);
    }

    // Return single document if only one file, array if multiple
    logger.info('User document uploaded', {
      userId,
      type,
      count: documents.length,
    });
    if (documents.length === 1) {
      return res.status(201).json({ document: documents[0] });
    } else {
      return res.status(201).json({ documents });
    }
  } catch (error) {
    logger.error(
      'Error uploading user document',
      { userId, type, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

// Upload practice compliance documents
export async function uploadPracticeComplianceDocument(req, res) {
  const logger = loggerBase.child('uploadPracticeComplianceDocument');
  const userId = req.user?.sub;
  if (!userId) {
    logger.warn('Unauthorized compliance document upload attempt');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const file = req.file;
  if (!file) {
    logger.warn('No file uploaded', { userId });
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const allowedTypes = [
    'license',
    'insurance',
    'certification',
    'compliance_certificate',
    'other',
  ];
  const documentType = (req.body?.documentType || '').toLowerCase();
  if (!allowedTypes.includes(documentType)) {
    logger.warn('Invalid document type', { userId, documentType });
    return res.status(400).json({
      message: `documentType must be one of: ${allowedTypes.join(', ')}`,
    });
  }

  try {
    logger.debug('Uploading practice compliance document', {
      userId,
      documentType,
    });
    const url = buildFileUrl(req, file.path);

    // Find or create practice compliance record
    const [compliance, _created] = await PracticeCompliance.findOrCreate({
      where: { userId },
      defaults: { userId, complianceDocuments: [] },
    });

    // Create document object
    const document = {
      id: Date.now().toString(), // Simple ID for the document
      type: documentType,
      url: url,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };

    // Add document to existing documents array
    const existingDocuments = compliance.complianceDocuments || [];
    const updatedDocuments = [...existingDocuments, document];

    // Update the compliance record
    await compliance.update({ complianceDocuments: updatedDocuments });

    logger.info('Practice compliance document uploaded', {
      userId,
      documentType,
      complianceId: compliance.id,
    });
    return res.status(201).json({
      message: 'Compliance document uploaded successfully',
      document,
      complianceId: compliance.id,
    });
  } catch (error) {
    logger.error(
      'Error uploading practice compliance document',
      { userId, documentType, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}
