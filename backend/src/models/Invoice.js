import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  client_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  status: {
    type: DataTypes.ENUM('issued', 'paid', 'void', 'overdue'),
    defaultValue: 'issued',
  },
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  tax_total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  paid_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  due_date: { type: DataTypes.DATEONLY },
  paid_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'invoices',
});