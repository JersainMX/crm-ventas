// PipelineDeal.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PipelineDeal = sequelize.define('PipelineDeal', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  seller_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  stage_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  probability: { type: DataTypes.INTEGER, defaultValue: 0 },
  expected_at: { type: DataTypes.DATEONLY },
}, {
  tableName: 'pipeline_deals',
});