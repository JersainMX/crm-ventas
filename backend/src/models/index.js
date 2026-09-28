import { sequelize } from '../config/database.js';
import { User } from './User.js';
import { Client } from './Client.js';
import { Contact } from './Contact.js';
import { Category } from './Category.js';
import { Product } from './Product.js';
import { Quote } from './Quote.js';
import { QuoteItem } from './QuoteItem.js';
import { Order } from './Order.js';
import { OrderItem } from './OrderItem.js';
import { Invoice } from './Invoice.js';
import { PipelineStage } from './PipelineStage.js';
import { PipelineDeal } from './PipelineDeal.js';
import { InvoicePayment } from './InvoicePayment.js';

// ============ ASOCIACIONES ============

// Cliente → Contactos
Client.hasMany(Contact, { foreignKey: 'client_id', as: 'contacts', onDelete: 'CASCADE' });
Contact.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Cliente → Vendedor (User)
User.hasMany(Client, { foreignKey: 'owner_id', as: 'clients' });
Client.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Producto → Categoría
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Cotización → Cliente / Vendedor / Items
Client.hasMany(Quote, { foreignKey: 'client_id', as: 'quotes' });
Quote.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

User.hasMany(Quote, { foreignKey: 'seller_id', as: 'quotes' });
Quote.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

Quote.hasMany(QuoteItem, { foreignKey: 'quote_id', as: 'items', onDelete: 'CASCADE' });
QuoteItem.belongsTo(Quote, { foreignKey: 'quote_id', as: 'quote' });

Product.hasMany(QuoteItem, { foreignKey: 'product_id' });
QuoteItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Orden → Cliente / Vendedor / Cotización / Items
Client.hasMany(Order, { foreignKey: 'client_id', as: 'orders' });
Order.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

User.hasMany(Order, { foreignKey: 'seller_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

Quote.hasOne(Order, { foreignKey: 'quote_id', as: 'order' });
Order.belongsTo(Quote, { foreignKey: 'quote_id', as: 'quote' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Factura → Orden / Cliente
Order.hasOne(Invoice, { foreignKey: 'order_id', as: 'invoice' });
Invoice.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Client.hasMany(Invoice, { foreignKey: 'client_id', as: 'invoices' });
Invoice.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Pipeline
Client.hasMany(PipelineDeal, { foreignKey: 'client_id', as: 'deals' });
PipelineDeal.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

User.hasMany(PipelineDeal, { foreignKey: 'seller_id', as: 'deals' });
PipelineDeal.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

PipelineStage.hasMany(PipelineDeal, { foreignKey: 'stage_id', as: 'deals' });
PipelineDeal.belongsTo(PipelineStage, { foreignKey: 'stage_id', as: 'stage' });

// Invoice → Payments
Invoice.hasMany(InvoicePayment, { foreignKey: 'invoice_id', as: 'payments', onDelete: 'CASCADE' });
InvoicePayment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

User.hasMany(InvoicePayment, { foreignKey: 'created_by', as: 'payments_made' });
InvoicePayment.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });

// ============ EXPORTS ============
export {
  sequelize,
  User,
  Client,
  Contact,
  Category,
  Product,
  Quote,
  QuoteItem,
  Order,
  OrderItem,
  Invoice,
  InvoicePayment,
  PipelineStage,
  PipelineDeal,
};