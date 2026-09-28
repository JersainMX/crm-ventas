import { Op } from 'sequelize';
import { Client, Contact, User } from '../models/index.js';
import { success, error } from '../utils/response.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// LISTAR
export const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { search = '', status, type } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { tax_id: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (type) where.type = type;

  // Vendedor solo ve sus clientes
  if (req.user.role === 'seller') where.owner_id = req.user.id;

  const { rows, count } = await Client.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
  });

  return success(res, buildPaginatedResponse(rows, count, page, limit));
});

// OBTENER POR ID
export const getById = asyncHandler(async (req, res) => {
  const client = await Client.findByPk(req.params.id, {
    include: [
      { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
      { model: Contact, as: 'contacts' },
    ],
  });

  if (!client) return error(res, 'Cliente no encontrado', 404);

  // Vendedor solo puede ver sus propios clientes
  if (req.user.role === 'seller' && client.owner_id !== req.user.id) {
    return error(res, 'No autorizado', 403);
  }

  return success(res, client);
});

// CREAR
export const create = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    owner_id: req.body.owner_id || req.user.id,
  };

  const client = await Client.create(payload);
  return success(res, client, 'Cliente creado', 201);
});

// ACTUALIZAR
export const update = asyncHandler(async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return error(res, 'Cliente no encontrado', 404);

  if (req.user.role === 'seller' && client.owner_id !== req.user.id) {
    return error(res, 'No autorizado', 403);
  }

  await client.update(req.body);
  return success(res, client, 'Cliente actualizado');
});

// ELIMINAR (soft delete cambiando status)
export const remove = asyncHandler(async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return error(res, 'Cliente no encontrado', 404);

  if (req.user.role === 'seller' && client.owner_id !== req.user.id) {
    return error(res, 'No autorizado', 403);
  }

  await client.destroy();
  return success(res, null, 'Cliente eliminado');
});

// ==============================
// CONTACTOS
// ==============================

export const listContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.findAll({
    where: { client_id: req.params.id },
    order: [['created_at', 'DESC']],
  });
  return success(res, contacts);
});

export const createContact = asyncHandler(async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return error(res, 'Cliente no encontrado', 404);

  const contact = await Contact.create({ ...req.body, client_id: client.id });
  return success(res, contact, 'Contacto creado', 201);
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    where: { id: req.params.contactId, client_id: req.params.id },
  });
  if (!contact) return error(res, 'Contacto no encontrado', 404);

  await contact.update(req.body);
  return success(res, contact, 'Contacto actualizado');
});

export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    where: { id: req.params.contactId, client_id: req.params.id },
  });
  if (!contact) return error(res, 'Contacto no encontrado', 404);

  await contact.destroy();
  return success(res, null, 'Contacto eliminado');
});