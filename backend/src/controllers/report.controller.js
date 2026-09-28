import { Op, fn, col, literal, QueryTypes } from 'sequelize';
import {
  sequelize, Order, OrderItem, Invoice, Client, Product,
  User, Quote, PipelineDeal, PipelineStage,
} from '../models/index.js';
import { success, error } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDateRange, currentMonthRange, lastMonthRange } from '../utils/dateRange.js';

// ============================================
// 1. DASHBOARD GENERAL
// ============================================
export const dashboard = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const { fromDate, toDate } = getDateRange(from, to);

  // Filtro por vendedor si es seller
  const sellerFilter = req.user.role === 'seller'
    ? { seller_id: req.user.id } : {};

  // === KPIs del período ===
  const [
    ordersTotal,
    ordersCount,
    quotesTotal,
    quotesCount,
    invoicesTotal,
    invoicesPaid,
    pendingReceivable,
    activeClients,
    newClients,
  ] = await Promise.all([
    // Total facturado en órdenes del período
    Order.sum('total', {
      where: {
        ...sellerFilter,
        status: { [Op.in]: ['confirmed', 'delivered'] },
        created_at: { [Op.between]: [fromDate, toDate] },
      },
    }),

    Order.count({
      where: {
        ...sellerFilter,
        created_at: { [Op.between]: [fromDate, toDate] },
      },
    }),

    Quote.sum('total', {
      where: {
        ...sellerFilter,
        status: { [Op.in]: ['sent', 'approved'] },
        created_at: { [Op.between]: [fromDate, toDate] },
      },
    }),

    Quote.count({
      where: {
        ...sellerFilter,
        created_at: { [Op.between]: [fromDate, toDate] },
      },
    }),

    Invoice.sum('total', {
      where: {
        status: { [Op.ne]: 'void' },
        created_at: { [Op.between]: [fromDate, toDate] },
      },
    }),

    Invoice.sum('paid_amount', {
      where: {
        status: { [Op.ne]: 'void' },
        created_at: { [Op.between]: [fromDate, toDate] },
      },
    }),

    Invoice.sum(literal('total - paid_amount'), {
      where: {
        status: { [Op.in]: ['issued', 'overdue'] },
      },
    }),

    Client.count({
      where: {
        status: 'active',
        ...(req.user.role === 'seller' ? { owner_id: req.user.id } : {}),
      },
    }),

    Client.count({
      where: {
        created_at: { [Op.between]: [fromDate, toDate] },
        ...(req.user.role === 'seller' ? { owner_id: req.user.id } : {}),
      },
    }),
  ]);

  // === Comparativa con mes anterior ===
  const lastMonth = lastMonthRange();
  const lastMonthSales = await Order.sum('total', {
    where: {
      ...sellerFilter,
      status: { [Op.in]: ['confirmed', 'delivered'] },
      created_at: { [Op.between]: [lastMonth.from, lastMonth.to] },
    },
  }) || 0;

  const currentSales = ordersTotal || 0;
  const growthRate = lastMonthSales > 0
    ? ((currentSales - lastMonthSales) / lastMonthSales) * 100
    : (currentSales > 0 ? 100 : 0);

  // === Ticket promedio ===
  const avgTicket = ordersCount > 0 ? currentSales / ordersCount : 0;

  // === Ventas últimos 30 días (para mini gráfico) ===
  const [salesTrend] = await sequelize.query(`
    SELECT
      DATE(created_at) AS date,
      COALESCE(SUM(total), 0) AS total,
      COUNT(*) AS count
    FROM orders
    WHERE status IN ('confirmed', 'delivered')
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ${req.user.role === 'seller' ? 'AND seller_id = :sellerId' : ''}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, {
    replacements: { sellerId: req.user.id },
    type: QueryTypes.SELECT,
  });

  return success(res, {
    period: { from: fromDate, to: toDate },
    kpis: {
      sales_total: Number(currentSales.toFixed(2)),
      sales_last_month: Number(lastMonthSales.toFixed(2)),
      growth_rate: Number(growthRate.toFixed(2)),
      orders_count: ordersCount,
      quotes_total: Number(quotesTotal || 0),
      quotes_count: quotesCount,
      avg_ticket: Number(avgTicket.toFixed(2)),
      invoiced_total: Number(invoicesTotal || 0),
      collected_total: Number(invoicesPaid || 0),
      pending_receivable: Number(pendingReceivable || 0),
      active_clients: activeClients,
      new_clients: newClients,
    },
    sales_trend: salesTrend,
  });
});

// ============================================
// 2. VENTAS POR PERÍODO
// ============================================
export const salesByPeriod = asyncHandler(async (req, res) => {
  const { from, to, group = 'day' } = req.query;
  const { fromDate, toDate } = getDateRange(from, to);

  const validGroups = { day: '%Y-%m-%d', week: '%Y-%u', month: '%Y-%m' };
  const format = validGroups[group];
  if (!format) return error(res, 'group debe ser day, week o month', 400);

  const sellerWhere = req.user.role === 'seller'
    ? 'AND seller_id = :sellerId' : '';

  const [rows] = await sequelize.query(`
    SELECT
      DATE_FORMAT(created_at, :format) AS period,
      COUNT(*) AS orders_count,
      COALESCE(SUM(subtotal), 0) AS subtotal,
      COALESCE(SUM(tax_total), 0) AS tax_total,
      COALESCE(SUM(discount), 0) AS discount,
      COALESCE(SUM(total), 0) AS total
    FROM orders
    WHERE status IN ('confirmed', 'delivered')
      AND created_at BETWEEN :fromDate AND :toDate
      ${sellerWhere}
    GROUP BY period
    ORDER BY period ASC
  `, {
    replacements: {
      format,
      fromDate,
      toDate,
      sellerId: req.user.id,
    },
    type: QueryTypes.SELECT,
  });

  return success(res, {
    period: { from: fromDate, to: toDate, group },
    data: rows,
    totals: {
      orders_count: rows.reduce((s, r) => s + Number(r.orders_count), 0),
      subtotal: Number(rows.reduce((s, r) => s + Number(r.subtotal), 0).toFixed(2)),
      tax_total: Number(rows.reduce((s, r) => s + Number(r.tax_total), 0).toFixed(2)),
      discount: Number(rows.reduce((s, r) => s + Number(r.discount), 0).toFixed(2)),
      total: Number(rows.reduce((s, r) => s + Number(r.total), 0).toFixed(2)),
    },
  });
});

// ============================================
// 3. VENTAS POR VENDEDOR
// ============================================
export const salesBySeller = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const { fromDate, toDate } = getDateRange(from, to);

  const [rows] = await sequelize.query(`
    SELECT
      u.id AS seller_id,
      u.name AS seller_name,
      u.email AS seller_email,
      COUNT(DISTINCT o.id) AS orders_count,
      COALESCE(SUM(o.total), 0) AS total_sales,
      COALESCE(AVG(o.total), 0) AS avg_ticket
    FROM users u
    LEFT JOIN orders o ON o.seller_id = u.id
      AND o.status IN ('confirmed', 'delivered')
      AND o.created_at BETWEEN :fromDate AND :toDate
    WHERE u.role IN ('seller', 'supervisor')
      AND u.is_active = 1
    GROUP BY u.id, u.name, u.email
    ORDER BY total_sales DESC
  `, {
    replacements: { fromDate, toDate },
    type: QueryTypes.SELECT,
  });

  return success(res, {
    period: { from: fromDate, to: toDate },
    data: rows.map((r) => ({
      seller_id: r.seller_id,
      seller_name: r.seller_name,
      seller_email: r.seller_email,
      orders_count: Number(r.orders_count),
      total_sales: Number(Number(r.total_sales).toFixed(2)),
      avg_ticket: Number(Number(r.avg_ticket).toFixed(2)),
    })),
  });
});

// ============================================
// 4. VENTAS POR CLIENTE
// ============================================
export const salesByClient = asyncHandler(async (req, res) => {
  const { from, to, limit = 20 } = req.query;
  const { fromDate, toDate } = getDateRange(from, to);

  const sellerWhere = req.user.role === 'seller'
    ? 'AND o.seller_id = :sellerId' : '';

  const [rows] = await sequelize.query(`
    SELECT
      c.id AS client_id,
      c.name AS client_name,
      c.email AS client_email,
      c.status AS client_status,
      COUNT(DISTINCT o.id) AS orders_count,
      COALESCE(SUM(o.total), 0) AS total_sales
    FROM clients c
    INNER JOIN orders o ON o.client_id = c.id
      AND o.status IN ('confirmed', 'delivered')
      AND o.created_at BETWEEN :fromDate AND :toDate
      ${sellerWhere}
    GROUP BY c.id, c.name, c.email, c.status
    ORDER BY total_sales DESC
    LIMIT :limit
  `, {
    replacements: { fromDate, toDate, limit: parseInt(limit), sellerId: req.user.id },
    type: QueryTypes.SELECT,
  });

  return success(res, {
    period: { from: fromDate, to: toDate },
    data: rows.map((r) => ({
      client_id: r.client_id,
      client_name: r.client_name,
      client_email: r.client_email,
      client_status: r.client_status,
      orders_count: Number(r.orders_count),
      total_sales: Number(Number(r.total_sales).toFixed(2)),
    })),
  });
});

// ============================================
// 5. PRODUCTOS MÁS VENDIDOS
// ============================================
export const topProducts = asyncHandler(async (req, res) => {
  const { from, to, limit = 20 } = req.query;
  const { fromDate, toDate } = getDateRange(from, to);

  const sellerWhere = req.user.role === 'seller'
    ? 'AND o.seller_id = :sellerId' : '';

  const [rows] = await sequelize.query(`
    SELECT
      p.id AS product_id,
      p.sku,
      p.name AS product_name,
      cat.name AS category_name,
      COALESCE(SUM(oi.quantity), 0) AS total_quantity,
      COALESCE(SUM(oi.line_total), 0) AS total_revenue,
      COUNT(DISTINCT o.id) AS orders_count
    FROM products p
    INNER JOIN order_items oi ON oi.product_id = p.id
    INNER JOIN orders o ON o.id = oi.order_id
      AND o.status IN ('confirmed', 'delivered')
      AND o.created_at BETWEEN :fromDate AND :toDate
      ${sellerWhere}
    LEFT JOIN categories cat ON cat.id = p.category_id
    GROUP BY p.id, p.sku, p.name, cat.name
    ORDER BY total_revenue DESC
    LIMIT :limit
  `, {
    replacements: { fromDate, toDate, limit: parseInt(limit), sellerId: req.user.id },
    type: QueryTypes.SELECT,
  });

  return success(res, {
    period: { from: fromDate, to: toDate },
    data: rows.map((r) => ({
      product_id: r.product_id,
      sku: r.sku,
      product_name: r.product_name,
      category_name: r.category_name,
      total_quantity: Number(r.total_quantity),
      total_revenue: Number(Number(r.total_revenue).toFixed(2)),
      orders_count: Number(r.orders_count),
    })),
  });
});

// ============================================
// 6. PIPELINE POR ETAPA
// ============================================
export const pipelineSummary = asyncHandler(async (req, res) => {
  const sellerWhere = req.user.role === 'seller'
    ? 'AND pd.seller_id = :sellerId' : '';

  const [rows] = await sequelize.query(`
    SELECT
      ps.id AS stage_id,
      ps.name AS stage_name,
      ps.\`order\` AS stage_order,
      COUNT(pd.id) AS deals_count,
      COALESCE(SUM(pd.amount), 0) AS total_amount,
      COALESCE(AVG(pd.probability), 0) AS avg_probability
    FROM pipeline_stages ps
    LEFT JOIN pipeline_deals pd ON pd.stage_id = ps.id
      ${sellerWhere}
    GROUP BY ps.id, ps.name, ps.\`order\`
    ORDER BY ps.\`order\` ASC
  `, {
    replacements: { sellerId: req.user.id },
    type: QueryTypes.SELECT,
  });

  const totalAmount = rows.reduce((s, r) => s + Number(r.total_amount), 0);
  const weightedAmount = rows.reduce((s, r) =>
    s + (Number(r.total_amount) * Number(r.avg_probability) / 100), 0);

  return success(res, {
    data: rows.map((r) => ({
      stage_id: r.stage_id,
      stage_name: r.stage_name,
      stage_order: r.stage_order,
      deals_count: Number(r.deals_count),
      total_amount: Number(Number(r.total_amount).toFixed(2)),
      avg_probability: Number(Number(r.avg_probability).toFixed(2)),
    })),
    summary: {
      total_deals: rows.reduce((s, r) => s + Number(r.deals_count), 0),
      total_amount: Number(totalAmount.toFixed(2)),
      weighted_amount: Number(weightedAmount.toFixed(2)),
    },
  });
});

// ============================================
// 7. CUENTAS POR COBRAR
// ============================================
export const accountsReceivable = asyncHandler(async (req, res) => {
  const [rows] = await sequelize.query(`
    SELECT
      i.id AS invoice_id,
      i.code AS invoice_code,
      i.status,
      i.total,
      i.paid_amount,
      (i.total - i.paid_amount) AS balance,
      i.due_date,
      DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
      c.id AS client_id,
      c.name AS client_name,
      c.email AS client_email
    FROM invoices i
    INNER JOIN clients c ON c.id = i.client_id
    WHERE i.status IN ('issued', 'overdue')
      AND i.total > i.paid_amount
    ORDER BY i.due_date ASC
  `, { type: QueryTypes.SELECT });

  const today = new Date().toISOString().slice(0, 10);

  const data = rows.map((r) => {
    let bucket = 'current';
    if (r.due_date) {
      const due = new Date(r.due_date).toISOString().slice(0, 10);
      if (due < today) {
        const days = Number(r.days_overdue);
        if (days <= 30) bucket = '1-30';
        else if (days <= 60) bucket = '31-60';
        else if (days <= 90) bucket = '61-90';
        else bucket = '90+';
      }
    }
    return {
      invoice_id: r.invoice_id,
      invoice_code: r.invoice_code,
      status: r.status,
      total: Number(Number(r.total).toFixed(2)),
      paid_amount: Number(Number(r.paid_amount).toFixed(2)),
      balance: Number(Number(r.balance).toFixed(2)),
      due_date: r.due_date,
      days_overdue: r.days_overdue,
      bucket,
      client: {
        id: r.client_id,
        name: r.client_name,
        email: r.client_email,
      },
    };
  });

  const totalReceivable = data.reduce((s, r) => s + r.balance, 0);
  const overdue = data.filter((r) => r.bucket !== 'current');
  const totalOverdue = overdue.reduce((s, r) => s + r.balance, 0);

  const buckets = data.reduce((acc, r) => {
    acc[r.bucket] = (acc[r.bucket] || 0) + r.balance;
    return acc;
  }, {});

  return success(res, {
    summary: {
      total_receivable: Number(totalReceivable.toFixed(2)),
      total_overdue: Number(totalOverdue.toFixed(2)),
      invoices_count: data.length,
      overdue_count: overdue.length,
      buckets: {
        current: Number((buckets.current || 0).toFixed(2)),
        '1-30': Number((buckets['1-30'] || 0).toFixed(2)),
        '31-60': Number((buckets['31-60'] || 0).toFixed(2)),
        '61-90': Number((buckets['61-90'] || 0).toFixed(2)),
        '90+': Number((buckets['90+'] || 0).toFixed(2)),
      },
    },
    data,
  });
});

// ============================================
// 8. RESUMEN FINANCIERO
// ============================================
export const financialSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const { fromDate, toDate } = getDateRange(from, to);

  const sellerWhere = req.user.role === 'seller' ? 'AND seller_id = :sellerId' : '';

  const [rows] = await sequelize.query(`
    SELECT
      COALESCE(SUM(CASE WHEN status IN ('confirmed','delivered') THEN total ELSE 0 END), 0) AS gross_sales,
      COALESCE(SUM(CASE WHEN status IN ('confirmed','delivered') THEN discount ELSE 0 END), 0) AS total_discount,
      COALESCE(SUM(CASE WHEN status IN ('confirmed','delivered') THEN tax_total ELSE 0 END), 0) AS total_tax,
      COALESCE(SUM(CASE WHEN status = 'cancelled' THEN total ELSE 0 END), 0) AS cancelled_sales,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_count,
      COUNT(*) AS total_orders
    FROM orders
    WHERE created_at BETWEEN :fromDate AND :toDate
      ${sellerWhere}
  `, {
    replacements: { fromDate, toDate, sellerId: req.user.id },
    type: QueryTypes.SELECT,
  });

  const summary = rows[0];

  const [invoicesRows] = await sequelize.query(`
    SELECT
      COALESCE(SUM(total), 0) AS invoiced,
      COALESCE(SUM(paid_amount), 0) AS collected,
      COALESCE(SUM(total - paid_amount), 0) AS pending
    FROM invoices
    WHERE status != 'void'
      AND created_at BETWEEN :fromDate AND :toDate
  `, {
    replacements: { fromDate, toDate },
    type: QueryTypes.SELECT,
  });

  const invoiceSummary = invoicesRows[0];

  return success(res, {
    period: { from: fromDate, to: toDate },
    sales: {
      gross: Number(Number(summary.gross_sales).toFixed(2)),
      discount: Number(Number(summary.total_discount).toFixed(2)),
      tax: Number(Number(summary.total_tax).toFixed(2)),
      net: Number((Number(summary.gross_sales) - Number(summary.total_discount)).toFixed(2)),
      cancelled: Number(Number(summary.cancelled_sales).toFixed(2)),
      cancelled_count: Number(summary.cancelled_count),
      total_orders: Number(summary.total_orders),
    },
    invoices: {
      invoiced: Number(Number(invoiceSummary.invoiced).toFixed(2)),
      collected: Number(Number(invoiceSummary.collected).toFixed(2)),
      pending: Number(Number(invoiceSummary.pending).toFixed(2)),
      collection_rate: Number(invoiceSummary.invoiced) > 0
        ? Number(((Number(invoiceSummary.collected) / Number(invoiceSummary.invoiced)) * 100).toFixed(2))
        : 0,
    },
  });
});