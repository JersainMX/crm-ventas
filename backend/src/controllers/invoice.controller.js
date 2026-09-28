import { Op } from 'sequelize';
import {
  sequelize, Invoice, InvoicePayment, Order, OrderItem, Client, User,
} from '../models/index.js';
import { success, error } from '../utils/response.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateCode } from '../utils/codeGenerator.js';

// =========================
// Helpers
// =========================
const computeStatus = (invoice) => {
  if (invoice.status === 'void' || invoice.status === 'paid') return invoice.status;

  const today = new Date().toISOString().slice(0, 10);
  if (invoice.due_date && invoice.due_date < today) return 'overdue';

  return invoice.status;
};

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

  const { rows, count } = await Invoice.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
      { model: Order, as: 'order', attributes: ['id', 'code'] },
    ],
  });

  // Recalcular estado (para mostrar overdue dinámicamente)
  const data = rows.map((inv) => {
    const plain = inv.toJSON();
    plain.status = computeStatus(plain);
    return plain;
  });

  return success(res, buildPaginatedResponse(data, count, page, limit));
});

// =========================
// DETALLE
// =========================
export const getById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id, {
    include: [
      { model: Client, as: 'client' },
      {
        model: Order,
        as: 'order',
        include: [{ model: OrderItem, as: 'items' }],
      },
      {
        model: InvoicePayment,
        as: 'payments',
        include: [{ model: User, as: 'created_by_user', attributes: ['id', 'name'] }],
      },
    ],
  });

  if (!invoice) return error(res, 'Factura no encontrada', 404);

  const plain = invoice.toJSON();
  plain.status = computeStatus(plain);

  return success(res, plain);
});

// =========================
// CREAR DESDE ORDEN
// =========================
export const createFromOrder = asyncHandler(async (req, res) => {
  const { order_id, due_date, notes } = req.body;

  const order = await Order.findByPk(order_id, {
    include: [{ model: OrderItem, as: 'items' }],
  });

  if (!order) return error(res, 'Orden no encontrada', 404);

  if (!['confirmed', 'delivered'].includes(order.status)) {
    return error(res,
      'Solo se pueden facturar órdenes confirmadas o entregadas', 400);
  }

  // Verificar que no tenga ya una factura
  const existing = await Invoice.findOne({ where: { order_id } });
  if (existing) {
    return error(res, 'Esta orden ya tiene una factura asociada', 409);
  }

  const code = await generateCode('FAC', 'invoices');

  const invoice = await Invoice.create({
    code,
    order_id: order.id,
    client_id: order.client_id,
    status: 'issued',
    subtotal: order.subtotal,
    tax_total: order.tax_total,
    total: order.total,
    paid_amount: 0,
    due_date: due_date || null,
    issued_at: new Date(),
    paid_at: null,
  });

  const full = await Invoice.findByPk(invoice.id, {
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
      { model: Order, as: 'order', attributes: ['id', 'code'] },
    ],
  });

  return success(res, full, 'Factura generada', 201);
});

// =========================
// REGISTRAR PAGO
// =========================
export const registerPayment = asyncHandler(async (req, res) => {
  const { amount, method, reference, notes } = req.body;

  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return error(res, 'Factura no encontrada', 404);

  if (invoice.status === 'void') {
    return error(res, 'No se puede pagar una factura anulada', 400);
  }

  if (invoice.status === 'paid') {
    return error(res, 'Esta factura ya está pagada en su totalidad', 400);
  }

  const currentPaid = Number(invoice.paid_amount) || 0;
  const total = Number(invoice.total) || 0;
  const pay = Number(amount);

  if (currentPaid + pay > total + 0.001) {
    return error(res,
      `El pago excede el total. Saldo pendiente: ${(total - currentPaid).toFixed(2)}`, 400);
  }

  const result = await sequelize.transaction(async (t) => {
    const payment = await InvoicePayment.create({
      invoice_id: invoice.id,
      amount: pay,
      method: method || 'cash',
      reference: reference || null,
      notes: notes || null,
      created_by: req.user.id,
    }, { transaction: t });

    const newPaid = currentPaid + pay;
    const newStatus = newPaid >= total - 0.001 ? 'paid' : invoice.status;

    await invoice.update({
      paid_amount: newPaid,
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date() : invoice.paid_at,
    }, { transaction: t });

    return payment;
  });

  const updated = await Invoice.findByPk(invoice.id, {
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
      { model: InvoicePayment, as: 'payments' },
    ],
  });

  return success(res, updated, 'Pago registrado', 201);
});

// =========================
// ANULAR FACTURA
// =========================
export const voidInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return error(res, 'Factura no encontrada', 404);

  if (invoice.status === 'void') {
    return error(res, 'La factura ya está anulada', 400);
  }

  if (Number(invoice.paid_amount) > 0) {
    return error(res,
      'No se puede anular una factura con pagos registrados', 400);
  }

  await invoice.update({
    status: 'void',
    notes: `${invoice.notes || ''}\n[ANULADA] ${req.body.reason}`.trim(),
  });

  return success(res, invoice, 'Factura anulada');
});

// =========================
// HISTORIAL DE PAGOS
// =========================
export const listPayments = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return error(res, 'Factura no encontrada', 404);

  const payments = await InvoicePayment.findAll({
    where: { invoice_id: invoice.id },
    order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'created_by_user', attributes: ['id', 'name'] }],
  });

  return success(res, payments);
});