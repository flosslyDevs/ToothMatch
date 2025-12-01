import { DataTypes } from "sequelize";
import { sequelize } from "../../services/db.js";

const Blocklist = sequelize?.define('Blocklist', {
    blockedUserId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    blockedByUserId: { type: DataTypes.UUID, allowNull: false , primaryKey: true},
}, { tableName: 'blocklists', underscored: true });

export default Blocklist;