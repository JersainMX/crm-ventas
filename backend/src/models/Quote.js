// Quote.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Quote = sequelize.define('Quote', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  client_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  seller_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'approved', 'rejected', 'expired', 'converted'),
    defaultValue: 'draft',
  },
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  tax_total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  valid_until: { type: DataTypes.DATEONLY },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'quotes',
});