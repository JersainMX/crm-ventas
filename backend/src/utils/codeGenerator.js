import { sequelize } from '../config/database.js';

export const generateCode = async (prefix, tableName, year = new Date().getFullYear()) => {
  const [results] = await sequelize.query(
    `SELECT COUNT(*) AS total FROM ${tableName} WHERE code LIKE :pattern`,
    { replacements: { pattern: `${prefix}-${year}-%` } }
  );

  const next = (parseInt(results[0].total) || 0) + 1;
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
};