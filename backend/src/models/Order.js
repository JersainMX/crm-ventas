// Order.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  client_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  seller_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  quote_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  tax_total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'orders',
});