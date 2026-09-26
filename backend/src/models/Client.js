import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('company', 'person'),
    allowNull: false,
    defaultValue: 'company',
  },
  name: { type: DataTypes.STRING(180), allowNull: false },
  tax_id: { type: DataTypes.STRING(40) },
  email: { type: DataTypes.STRING(150) },
  phone: { type: DataTypes.STRING(40) },
  address: { type: DataTypes.STRING(255) },
  city: { type: DataTypes.STRING(100) },
  country: { type: DataTypes.STRING(80) },
  status: {
    type: DataTypes.ENUM('prospect', 'active', 'inactive'),
    defaultValue: 'prospect',
  },
  owner_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
}, {
  tableName: 'clients',
});