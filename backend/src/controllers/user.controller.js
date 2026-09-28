import { Op } from 'sequelize';
import { User } from '../models/index.js';
import { hashPassword } from '../utils/password.js';
import { success, error } from '../utils/response.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { search = '', role, is_active } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  if (role) where.role = role;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password_hash'] },
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return success(res, buildPaginatedResponse(rows, count, page, limit));
});

export const getById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password_hash'] },
  });
  if (!user) return error(res, 'Usuario no encontrado', 404);
  return success(res, user);
});

export const create = asyncHandler(async (req, res) => {
  const { name, email, password, role, is_active = true } = req.body;

  const exists = await User.findOne({ where: { email } });
  if (exists) return error(res, 'El email ya está registrado', 409);

  const password_hash = await hashPassword(password);
  const user = await User.create({ name, email, password_hash, role, is_active });

  return success(res, {
    id: user.id, name: user.name, email: user.email, role: user.role, is_active: user.is_active,
  }, 'Usuario creado', 201);
});

export const update = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return error(res, 'Usuario no encontrado', 404);

  if (req.body.email && req.body.email !== user.email) {
    const exists = await User.findOne({ where: { email: req.body.email } });
    if (exists) return error(res, 'El email ya está registrado', 409);
  }

  await user.update(req.body);
  return success(res, {
    id: user.id, name: user.name, email: user.email, role: user.role, is_active: user.is_active,
  }, 'Usuario actualizado');
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return error(res, 'Usuario no encontrado', 404);

  user.password_hash = await hashPassword(req.body.newPassword);
  await user.save();

  return success(res, null, 'Contraseña actualizada');
});

export const toggleActive = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return error(res, 'Usuario no encontrado', 404);

  if (user.id === req.user.id) {
    return error(res, 'No puedes desactivar tu propio usuario', 400);
  }

  user.is_active = !user.is_active;
  await user.save();

  return success(res, { id: user.id, is_active: user.is_active },
    user.is_active ? 'Usuario activado' : 'Usuario desactivado');
});

export const remove = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return error(res, 'Usuario no encontrado', 404);

  if (user.id === req.user.id) {
    return error(res, 'No puedes eliminar tu propio usuario', 400);
  }

  await user.destroy();
  return success(res, null, 'Usuario eliminado', 200);
});