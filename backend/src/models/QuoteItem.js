// QuoteItem.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const QuoteItem = sequelize.define('QuoteItem', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  quote_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  description: { type: DataTypes.STRING(255) },
  quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  tax_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 16 },
  discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
}, {
  tableName: 'quote_items',
});