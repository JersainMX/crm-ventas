import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 4000,

  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'crm_ventas',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },

  JWT: {
    secret: process.env.JWT_SECRET,
    expires: process.env.JWT_EXPIRES || '1d',
  },

  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
};