import { User } from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { success, error } from '../utils/response.js';

/**
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return error(res, 'Credenciales inválidas', 401);
    }

    if (!user.is_active) {
      return error(res, 'Usuario desactivado', 403);
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return error(res, 'Credenciales inválidas', 401);
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, 'Login exitoso');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/register  (solo admin)
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'seller' } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return error(res, 'El email ya está registrado', 409);
    }

    const password_hash = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password_hash,
      role,
      is_active: true,
    });

    return success(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }, 'Usuario registrado', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 */
export const me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'created_at'],
    });

    if (!user) {
      return error(res, 'Usuario no encontrado', 404);
    }

    return success(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return error(res, 'Usuario no encontrado', 404);

    const isValid = await comparePassword(currentPassword, user.password_hash);
    if (!isValid) {
      return error(res, 'Contraseña actual incorrecta', 401);
    }

    user.password_hash = await hashPassword(newPassword);
    await user.save();

    return success(res, null, 'Contraseña actualizada');
  } catch (err) {
    next(err);
  }
};