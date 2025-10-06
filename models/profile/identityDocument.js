import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const IdentityDocument = sequelize?.define('IdentityDocument', {
	id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
	userId: { type: DataTypes.UUID, allowNull: false },
	type: { type: DataTypes.ENUM('passport', 'proof_of_address', 'professional_certificate'), allowNull: false },
	url: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'identity_documents', underscored: true });

export default IdentityDocument;


