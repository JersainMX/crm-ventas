import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const InvoicePayment = sequelize.define('InvoicePayment', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  invoice_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  method: {
    type: DataTypes.ENUM('cash', 'card', 'transfer', 'check', 'other'),
    defaultValue: 'cash',
  },
  reference: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
}, {
  tableName: 'invoice_payments',
});