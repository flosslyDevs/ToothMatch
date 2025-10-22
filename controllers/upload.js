import path from 'path';
import { Media, IdentityDocument, PracticeCompliance } from '../models/index.js';

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

// Upload practice compliance documents
export async function uploadPracticeComplianceDocument(req, res) {
	const userId = req.user?.sub;
	if (!userId) return res.status(401).json({ message: 'Unauthorized' });
	const file = req.file;
	if (!file) return res.status(400).json({ message: 'No file uploaded' });
	
	const allowedTypes = ['license', 'insurance', 'certification', 'compliance_certificate', 'other'];
	const documentType = (req.body?.documentType || '').toLowerCase();
	if (!allowedTypes.includes(documentType)) {
		return res.status(400).json({ message: `documentType must be one of: ${allowedTypes.join(', ')}` });
	}

	try {
		const url = buildFileUrl(req, file.path);
		
		// Find or create practice compliance record
		const [compliance, created] = await PracticeCompliance.findOrCreate({
			where: { userId },
			defaults: { userId, complianceDocuments: [] }
		});

		// Create document object
		const document = {
			id: Date.now().toString(), // Simple ID for the document
			type: documentType,
			url: url,
			filename: file.originalname,
			size: file.size,
			mimetype: file.mimetype,
			uploadedAt: new Date().toISOString()
		};

		// Add document to existing documents array
		const existingDocuments = compliance.complianceDocuments || [];
		const updatedDocuments = [...existingDocuments, document];

		// Update the compliance record
		await compliance.update({ complianceDocuments: updatedDocuments });

		return res.status(201).json({ 
			message: 'Compliance document uploaded successfully',
			document,
			complianceId: compliance.id
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}


