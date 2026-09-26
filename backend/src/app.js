import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';

const app = express();

// Seguridad
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger (solo en desarrollo)
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limit global
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { message: 'Demasiadas peticiones, intenta más tarde' },
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Ruta base (aún sin routers)
app.get('/api/v1', (req, res) => {
  res.json({ message: 'CRM Ventas API v1' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;