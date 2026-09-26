import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  position: { type: DataTypes.STRING(100) },
  email: { type: DataTypes.STRING(150) },
  phone: { type: DataTypes.STRING(40) },
}, {
  tableName: 'contacts',
});