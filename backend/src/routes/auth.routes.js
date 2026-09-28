import { Router } from 'express';
import {
  login,
  register,
  me,
  changePassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  loginSchema,
  registerSchema,
} from '../validators/auth.validator.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit específico para login (previene fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                   // 10 intentos por IP
  message: { message: 'Demasiados intentos de login, intenta más tarde' },
});

// Públicas
router.post('/login', loginLimiter, validate(loginSchema), login);

// Protegidas
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

// Solo admin
router.post('/register', authenticate, authorize('admin'), validate(registerSchema), register);

export default router;