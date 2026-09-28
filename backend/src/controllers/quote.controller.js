import { Op } from 'sequelize';
import {
  sequelize, Quote, QuoteItem, Client, Product, User,
} from '../models/index.js';
import { success, error } from '../utils/response.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calcTotals } from '../utils/calcTotals.js';
import { generateCode } from '../utils/codeGenerator.js';

// =========================
// LISTAR
// =========================
export const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status, client_id, search } = req.query;

  const where = {};
  if (status) where.status = status;
  if (client_id) where.client_id = client_id;
  if (search) where.code = { [Op.like]: `%${search}%` };

  // Vendedor solo ve sus cotizaciones
  if (req.user.role === 'seller') where.seller_id = req.user.id;

  const { rows, count } = await Quote.findAndCountAll({
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

// =========================
// OBTENER POR ID
// =========================
export const getById = asyncHandler(async (req, res) => {
  const quote = await Quote.findByPk(req.params.id, {
    include: [
      { model: Client, as: 'client' },
      { model: User, as: 'seller', attributes: ['id', 'name', 'email'] },
      {
        model: QuoteItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'name'] }],
      },
    ],
  });

  if (!quote) return error(res, 'Cotización no encontrada', 404);

  if (req.user.role === 'seller' && quote.seller_id !== req.user.id) {
    return error(res, 'No autorizado', 403);
  }

  return success(res, quote);
});

// =========================
// CREAR
// =========================
export const create = asyncHandler(async (req, res) => {
  const { client_id, items, valid_until, notes, discount } = req.body;

  // Validar que el cliente existe
  const client = await Client.findByPk(client_id);
  if (!client) return error(res, 'Cliente no encontrado', 404);

  // Validar productos
  const productIds = items.map((i) => i.product_id);
  const products = await Product.findAll({ where: { id: productIds } });
  if (products.length !== productIds.length) {
    return error(res, 'Uno o más productos no existen', 400);
  }

  // Calcular totales
  const totals = calcTotals(items, discount);

  // Código consecutivo
  const code = await generateCode('COT', 'quotes');

  // Transacción: crear cotización + items
  const result = await sequelize.transaction(async (t) => {
    const quote = await Quote.create({
      code,
      client_id,
      seller_id: req.user.id,
      status: 'draft',
      valid_until: valid_until || null,
      notes: notes || null,
      subtotal: totals.subtotal,
      tax_total: totals.tax_total,
      discount: totals.discount,
      total: totals.total,
    }, { transaction: t });

    const itemsToCreate = totals.items.map((it) => ({
      quote_id: quote.id,
      product_id: it.product_id,
      description: it.description || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_rate: it.tax_rate,
      discount: it.discount,
      line_total: it.line_total,
    }));

    await QuoteItem.bulkCreate(itemsToCreate, { transaction: t });

    return quote;
  });

  // Devolver con items
  const fullQuote = await Quote.findByPk(result.id, {
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
      { model: QuoteItem, as: 'items' },
    ],
  });

  return success(res, fullQuote, 'Cotización creada', 201);
});

// =========================
// ACTUALIZAR (solo draft)
// =========================
export const update = asyncHandler(async (req, res) => {
  const quote = await Quote.findByPk(req.params.id);
  if (!quote) return error(res, 'Cotización no encontrada', 404);

  if (quote.seller_id !== req.user.id && req.user.role === 'seller') {
    return error(res, 'No autorizado', 403);
  }

  if (quote.status !== 'draft') {
    return error(res, 'Solo se pueden editar cotizaciones en borrador', 400);
  }

  const { items, valid_until, notes, discount } = req.body;

  await sequelize.transaction(async (t) => {
    let updates = {};

    // Si se envían nuevos items, recalcular
    if (items && items.length > 0) {
      const totals = calcTotals(items, discount ?? quote.discount);
      updates = {
        subtotal: totals.subtotal,
        tax_total: totals.tax_total,
        discount: totals.discount,
        total: totals.total,
      };

      // Eliminar items viejos y crear nuevos
      await QuoteItem.destroy({ where: { quote_id: quote.id }, transaction: t });

      const itemsToCreate = totals.items.map((it) => ({
        quote_id: quote.id,
        product_id: it.product_id,
        description: it.description || null,
        quantity: it.quantity,
        unit_price: it.unit_price,
        tax_rate: it.tax_rate,
        discount: it.discount,
        line_total: it.line_total,
      }));

      await QuoteItem.bulkCreate(itemsToCreate, { transaction: t });
    }

    if (valid_until !== undefined) updates.valid_until = valid_until;
    if (notes !== undefined) updates.notes = notes;

    await quote.update(updates, { transaction: t });
  });

  const updated = await Quote.findByPk(quote.id, {
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
      { model: QuoteItem, as: 'items' },
    ],
  });

  return success(res, updated, 'Cotización actualizada');
});

// =========================
// CAMBIAR ESTADO
// =========================
export const changeStatus = asyncHandler(async (req, res) => {
  const quote = await Quote.findByPk(req.params.id);
  if (!quote) return error(res, 'Cotización no encontrada', 404);

  if (quote.seller_id !== req.user.id && req.user.role === 'seller') {
    return error(res, 'No autorizado', 403);
  }

  const { status } = req.body;

  // Transiciones permitidas
  const allowed = {
    draft: ['sent', 'rejected'],
    sent: ['approved', 'rejected', 'expired'],
    approved: ['converted', 'rejected'],
    rejected: [],
    expired: ['sent'],
    converted: [],
  };

  if (!allowed[quote.status]?.includes(status)) {
    return error(res,
      `No se puede cambiar de '${quote.status}' a '${status}'`, 400);
  }

  await quote.update({ status });
  return success(res, quote, 'Estado actualizado');
});

// =========================
// CONVERTIR A ORDEN
// =========================
export const convertToOrder = asyncHandler(async (req, res) => {
  const quote = await Quote.findByPk(req.params.id, {
    include: [{ model: QuoteItem, as: 'items' }],
  });

  if (!quote) return error(res, 'Cotización no encontrada', 404);

  if (quote.seller_id !== req.user.id && req.user.role === 'seller') {
    return error(res, 'No autorizado', 403);
  }

  if (quote.status !== 'approved') {
    return error(res, 'Solo se pueden convertir cotizaciones aprobadas', 400);
  }

  // Verificar que no tenga ya una orden
  const { Order } = await import('../models/index.js');
  const existing = await Order.findOne({ where: { quote_id: quote.id } });
  if (existing) {
    return error(res, 'Esta cotización ya tiene una orden asociada', 409);
  }

  const orderCode = await generateCode('ORD', 'orders');

  const order = await sequelize.transaction(async (t) => {
    const newOrder = await Order.create({
      code: orderCode,
      client_id: quote.client_id,
      seller_id: quote.seller_id,
      quote_id: quote.id,
      status: 'pending',
      subtotal: quote.subtotal,
      tax_total: quote.tax_total,
      discount: quote.discount,
      total: quote.total,
      notes: quote.notes,
    }, { transaction: t });

    const { OrderItem } = await import('../models/index.js');

    const itemsToCreate = quote.items.map((it) => ({
      order_id: newOrder.id,
      product_id: it.product_id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_rate: it.tax_rate,
      discount: it.discount,
      line_total: it.line_total,
    }));

    await OrderItem.bulkCreate(itemsToCreate, { transaction: t });

    // Marcar cotización como convertida
    await quote.update({ status: 'converted' }, { transaction: t });

    return newOrder;
  });

  const fullOrder = await Order.findByPk(order.id, {
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
      { model: OrderItem, as: 'items' },
    ],
  });

  return success(res, fullOrder, 'Orden generada desde cotización', 201);
});

// =========================
// ELIMINAR (solo draft)
// =========================
export const remove = asyncHandler(async (req, res) => {
  const quote = await Quote.findByPk(req.params.id);
  if (!quote) return error(res, 'Cotización no encontrada', 404);

  if (quote.seller_id !== req.user.id && req.user.role === 'seller') {
    return error(res, 'No autorizado', 403);
  }

  if (quote.status !== 'draft') {
    return error(res, 'Solo se pueden eliminar cotizaciones en borrador', 400);
  }

  await quote.destroy();
  return success(res, null, 'Cotización eliminada');
});