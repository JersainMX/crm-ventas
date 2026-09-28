import { Op } from 'sequelize';
import {
  sequelize, Order, OrderItem, Client, User, Quote, Product,
} from '../models/index.js';
import { success, error } from '../utils/response.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calcTotals } from '../utils/calcTotals.js';
import { generateCode } from '../utils/codeGenerator.js';

// LISTAR
export const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status, client_id, search } = req.query;

  const where = {};
  if (status) where.status = status;
  if (client_id) where.client_id = client_id;
  if (search) where.code = { [Op.like]: `%${search}%` };

  if (req.user.role === 'seller') where.seller_id = req.user.id;

  const { rows, count } = await Order.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
      { model: User, as: 'seller', attributes: ['id', 'name'] },
    ],
  });

  return success(res, buildPaginatedResponse(rows, count, page, limit));
});

// DETALLE
export const getById = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: Client, as: 'client' },
      { model: User, as: 'seller', attributes: ['id', 'name', 'email'] },
      { model: Quote, as: 'quote', attributes: ['id', 'code'] },
      {
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'name'] }],
      },
    ],
  });

  if (!order) return error(res, 'Orden no encontrada', 404);

  if (req.user.role === 'seller' && order.seller_id !== req.user.id) {
    return error(res, 'No autorizado', 403);
  }

  return success(res, order);
});

// CREAR (manual, sin cotización)
export const create = asyncHandler(async (req, res) => {
  const { client_id, items, notes, discount, quote_id } = req.body;

  const client = await Client.findByPk(client_id);
  if (!client) return error(res, 'Cliente no encontrado', 404);

  const totals = calcTotals(items, discount);
  const code = await generateCode('ORD', 'orders');

  const order = await sequelize.transaction(async (t) => {
    const newOrder = await Order.create({
      code,
      client_id,
      seller_id: req.user.id,
      quote_id: quote_id || null,
      status: 'pending',
      notes: notes || null,
      subtotal: totals.subtotal,
      tax_total: totals.tax_total,
      discount: totals.discount,
      total: totals.total,
    }, { transaction: t });

    const itemsToCreate = totals.items.map((it) => ({
      order_id: newOrder.id,
      product_id: it.product_id,
      description: it.description || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_rate: it.tax_rate,
      discount: it.discount,
      line_total: it.line_total,
    }));

    await OrderItem.bulkCreate(itemsToCreate, { transaction: t });
    return newOrder;
  });

  const fullOrder = await Order.findByPk(order.id, {
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
      { model: OrderItem, as: 'items' },
    ],
  });

  return success(res, fullOrder, 'Orden creada', 201);
});

// CAMBIAR ESTADO
export const changeStatus = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return error(res, 'Orden no encontrada', 404);

  if (order.seller_id !== req.user.id && req.user.role === 'seller') {
    return error(res, 'No autorizado', 403);
  }

  const { status } = req.body;

  const allowed = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  if (!allowed[order.status]?.includes(status)) {
    return error(res,
      `No se puede cambiar de '${order.status}' a '${status}'`, 400);
  }

  await order.update({ status });
  return success(res, order, 'Estado actualizado');
});

// ELIMINAR (solo pending)
export const remove = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return error(res, 'Orden no encontrada', 404);

  if (req.user.role !== 'admin' && order.seller_id !== req.user.id) {
    return error(res, 'No autorizado', 403);
  }

  if (order.status !== 'pending') {
    return error(res, 'Solo se pueden eliminar órdenes pendientes', 400);
  }

  await order.destroy();
  return success(res, null, 'Orden eliminada');
});