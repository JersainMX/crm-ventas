'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // USERS
    await queryInterface.createTable('users', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('admin', 'supervisor', 'seller'), defaultValue: 'seller' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // CATEGORIES
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // CLIENTS
    await queryInterface.createTable('clients', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      type: { type: Sequelize.ENUM('company', 'person'), allowNull: false, defaultValue: 'company' },
      name: { type: Sequelize.STRING(180), allowNull: false },
      tax_id: { type: Sequelize.STRING(40) },
      email: { type: Sequelize.STRING(150) },
      phone: { type: Sequelize.STRING(40) },
      address: { type: Sequelize.STRING(255) },
      city: { type: Sequelize.STRING(100) },
      country: { type: Sequelize.STRING(80) },
      status: { type: Sequelize.ENUM('prospect', 'active', 'inactive'), defaultValue: 'prospect' },
      owner_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // CONTACTS
    await queryInterface.createTable('contacts', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      position: { type: Sequelize.STRING(100) },
      email: { type: Sequelize.STRING(150) },
      phone: { type: Sequelize.STRING(40) },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // PRODUCTS
    await queryInterface.createTable('products', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      sku: { type: Sequelize.STRING(60), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT },
      type: { type: Sequelize.ENUM('product', 'service'), defaultValue: 'product' },
      category_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      price: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      tax_rate: { type: Sequelize.DECIMAL(5, 2), defaultValue: 16 },
      stock: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // QUOTES
    await queryInterface.createTable('quotes', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
      },
      seller_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'approved', 'rejected', 'expired', 'converted'),
        defaultValue: 'draft',
      },
      subtotal: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      tax_total: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      discount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      valid_until: { type: Sequelize.DATEONLY },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // QUOTE ITEMS
    await queryInterface.createTable('quote_items', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      quote_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'quotes', key: 'id' },
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'products', key: 'id' },
      },
      description: { type: Sequelize.STRING(255) },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 1 },
      unit_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      tax_rate: { type: Sequelize.DECIMAL(5, 2), defaultValue: 16 },
      discount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      line_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // ORDERS
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
      },
      seller_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      quote_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        references: { model: 'quotes', key: 'id' },
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'delivered', 'cancelled'),
        defaultValue: 'pending',
      },
      subtotal: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      tax_total: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      discount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // ORDER ITEMS
    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      order_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'products', key: 'id' },
      },
      description: { type: Sequelize.STRING(255) },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      tax_rate: { type: Sequelize.DECIMAL(5, 2), defaultValue: 16 },
      discount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      line_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // INVOICES
    await queryInterface.createTable('invoices', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      order_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
      },
      client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
      },
      status: {
        type: Sequelize.ENUM('issued', 'paid', 'void', 'overdue'),
        defaultValue: 'issued',
      },
      subtotal: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      tax_total: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      paid_amount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      due_date: { type: Sequelize.DATEONLY },
      paid_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // PIPELINE STAGES
    await queryInterface.createTable('pipeline_stages', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(80), allowNull: false },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // PIPELINE DEALS
    await queryInterface.createTable('pipeline_deals', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
      },
      seller_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      stage_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'pipeline_stages', key: 'id' },
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      probability: { type: Sequelize.INTEGER, defaultValue: 0 },
      expected_at: { type: Sequelize.DATEONLY },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pipeline_deals');
    await queryInterface.dropTable('pipeline_stages');
    await queryInterface.dropTable('invoices');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('quote_items');
    await queryInterface.dropTable('quotes');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('contacts');
    await queryInterface.dropTable('clients');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('users');
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
