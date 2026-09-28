import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PipelineStage = sequelize.define('PipelineStage', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  name: { type: DataTypes.STRING(80), allowNull: false },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'order',   // nombre real en la BD
  },
}, {
  tableName: 'pipeline_stages',
});