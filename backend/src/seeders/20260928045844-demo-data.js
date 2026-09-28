'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    // Guard: si ya existe Juan, saltar
    const [[{ count }]] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS count FROM users WHERE email = 'juan@crm.com'"
    );
    if (count > 0) {
      console.log('⚠️  demo-data ya ejecutado, saltando...');
      return;
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash('Vendedor123!', 12);

    // =============================
    // 1. USUARIOS
    // =============================
    await queryInterface.bulkInsert('users', [
      {
        name: 'María Supervisora',
        email: 'maria@crm.com',
        password_hash: passwordHash,
        role: 'supervisor',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Juan Vendedor',
        email: 'juan@crm.com',
        password_hash: passwordHash,
        role: 'seller',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    // Obtener IDs reales
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('maria@crm.com', 'juan@crm.com')`
    );
    const maria = users.find((u) => u.email === 'maria@crm.com');
    const juan = users.find((u) => u.email === 'juan@crm.com');

    // =============================
    // 2. CATEGORÍAS
    // =============================
    await queryInterface.bulkInsert('categories', [
      { name: 'Electrónica', created_at: now, updated_at: now },
      { name: 'Ropa', created_at: now, updated_at: now },
      { name: 'Servicios', created_at: now, updated_at: now },
      { name: 'Alimentos', created_at: now, updated_at: now },
    ]);

    const [cats] = await queryInterface.sequelize.query(
      `SELECT id, name FROM categories`
    );
    const catElec = cats.find((c) => c.name === 'Electrónica');
    const catRopa = cats.find((c) => c.name === 'Ropa');
    const catServ = cats.find((c) => c.name === 'Servicios');

    // =============================
    // 3. CLIENTES
    // =============================
    await queryInterface.bulkInsert('clients', [
      {
        type: 'company',
        name: 'Acme Corp',
        tax_id: 'ACM-123456',
        email: 'contacto@acme.com',
        phone: '+52 55 1111 2222',
        address: 'Av. Reforma 100',
        city: 'CDMX',
        country: 'México',
        status: 'active',
        owner_id: juan.id,
        created_at: now,
        updated_at: now,
      },
      {
        type: 'company',
        name: 'Globex SA',
        tax_id: 'GLX-654321',
        email: 'ventas@globex.com',
        phone: '+52 55 3333 4444',
        address: 'Calle 5 de Mayo 20',
        city: 'Guadalajara',
        country: 'México',
        status: 'prospect',
        owner_id: juan.id,
        created_at: now,
        updated_at: now,
      },
      {
        type: 'person',
        name: 'Carlos Pérez',
        email: 'carlos@mail.com',
        phone: '+52 55 5555 6666',
        city: 'Monterrey',
        country: 'México',
        status: 'active',
        owner_id: maria.id,
        created_at: now,
        updated_at: now,
      },
    ]);

    // =============================
    // 4. PRODUCTOS
    // =============================
    await queryInterface.bulkInsert('products', [
      {
        sku: 'ELE-001',
        name: 'Laptop HP 15',
        description: 'Laptop 15" i5 8GB',
        type: 'product',
        category_id: catElec.id,
        price: 12500.0,
        tax_rate: 16,
        stock: 20,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sku: 'ELE-002',
        name: 'Mouse Inalámbrico Logitech',
        description: 'Mouse inalámbrico con receptor USB',
        type: 'product',
        category_id: catElec.id,
        price: 350.0,
        tax_rate: 16,
        stock: 100,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sku: 'ROP-001',
        name: 'Camisa Formal Azul',
        description: 'Camisa talla M',
        type: 'product',
        category_id: catRopa.id,
        price: 450.0,
        tax_rate: 16,
        stock: 50,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        sku: 'SRV-001',
        name: 'Consultoría TI (hora)',
        description: 'Servicio de consultoría por hora',
        type: 'service',
        category_id: catServ.id,
        price: 1500.0,
        tax_rate: 16,
        stock: 0,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('clients', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', {
      email: ['maria@crm.com', 'juan@crm.com'],
    });
  },
};