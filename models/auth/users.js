import { DataTypes } from 'sequelize';
import { sequelize } from '../../services/db.js';

const User = sequelize?.define('User', {
	id: {
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4,
		primaryKey: true,
	},
	fullName: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
		validate: { isEmail: true },
	},
	mobileNumber: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	passwordHash: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	role: {
		type: DataTypes.ENUM('candidate', 'practice'),
		allowNull: false,
		defaultValue: 'candidate',
	},
	isEmailVerified: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	verificationCode: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	oauthProvider: {
		type: DataTypes.ENUM('google', 'apple'),
		allowNull: true,
	},
	oauthSubject: {
		type: DataTypes.STRING,
		allowNull: true,
		unique: true,
	},
}, {
	tableName: 'users',
	underscored: true,
});

export default User;


