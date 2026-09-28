import { Op } from 'sequelize';
import { Product, Category } from '../models/index.js';
import { success, error } from '../utils/response.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { search = '', category_id, type, is_active } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
    ];
  }
  if (category_id) where.category_id = category_id;
  if (type) where.type = type;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const { rows, count } = await Product.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
  });

  return success(res, buildPaginatedResponse(rows, count, page, limit));
});

export const getById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
  });
  if (!product) return error(res, 'Producto no encontrado', 404);
  return success(res, product);
});

export const create = asyncHandler(async (req, res) => {
  const exists = await Product.findOne({ where: { sku: req.body.sku } });
  if (exists) return error(res, 'Ya existe un producto con ese SKU', 409);

  if (req.body.category_id) {
    const cat = await Category.findByPk(req.body.category_id);
    if (!cat) return error(res, 'Categoría no encontrada', 404);
  }

  const product = await Product.create(req.body);
  return success(res, product, 'Producto creado', 201);
});

export const update = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return error(res, 'Producto no encontrado', 404);

  if (req.body.sku && req.body.sku !== product.sku) {
    const exists = await Product.findOne({ where: { sku: req.body.sku } });
    if (exists) return error(res, 'Ya existe un producto con ese SKU', 409);
  }

  await product.update(req.body);
  return success(res, product, 'Producto actualizado');
});

export const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return error(res, 'Producto no encontrado', 404);

  // Soft delete: desactiva en vez de eliminar
  product.is_active = false;
  await product.save();

  return success(res, null, 'Producto desactivado');
});