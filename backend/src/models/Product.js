import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  sku: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  description: { type: DataTypes.TEXT },
  type: {
    type: DataTypes.ENUM('product', 'service'),
    defaultValue: 'product',
  },
  category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  price: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  tax_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 16.0 },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'products',
});