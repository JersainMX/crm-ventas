import { Category, Product } from '../models/index.js';
import { success, error } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    order: [['name', 'ASC']],
    include: [{ model: Product, as: 'products', attributes: ['id'] }],
  });

  const data = categories.map((c) => ({
    id: c.id,
    name: c.name,
    products_count: c.products?.length || 0,
  }));

  return success(res, data);
});

export const getById = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return error(res, 'Categoría no encontrada', 404);
  return success(res, category);
});

export const create = asyncHandler(async (req, res) => {
  const exists = await Category.findOne({ where: { name: req.body.name } });
  if (exists) return error(res, 'Ya existe una categoría con ese nombre', 409);

  const category = await Category.create(req.body);
  return success(res, category, 'Categoría creada', 201);
});

export const update = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return error(res, 'Categoría no encontrada', 404);

  if (req.body.name && req.body.name !== category.name) {
    const exists = await Category.findOne({ where: { name: req.body.name } });
    if (exists) return error(res, 'Ya existe una categoría con ese nombre', 409);
  }

  await category.update(req.body);
  return success(res, category, 'Categoría actualizada');
});

export const remove = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return error(res, 'Categoría no encontrada', 404);

  const productsCount = await Product.count({ where: { category_id: category.id } });
  if (productsCount > 0) {
    return error(res, `No puedes eliminar: hay ${productsCount} productos asociados`, 400);
  }

  await category.destroy();
  return success(res, null, 'Categoría eliminada');
});