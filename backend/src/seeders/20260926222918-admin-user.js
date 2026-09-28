'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    // Guard: si ya existe admin, saltar
    const [[{ count: userCount }]] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS count FROM users WHERE email = 'admin@crm.com'"
    );
    if (userCount > 0) {
      console.log('⚠️  admin-user ya ejecutado, saltando...');
      return;
    }

    const passwordHash = await bcrypt.hash('Admin123!', 12);
    const now = new Date();

    await queryInterface.bulkInsert('users', [{
      name: 'Administrador',
      email: 'admin@crm.com',
      password_hash: passwordHash,
      role: 'admin',
      is_active: true,
      created_at: now,
      updated_at: now,
    }]);

    await queryInterface.bulkInsert('pipeline_stages', [
      { name: 'Prospección',      '`order`': 1, created_at: now, updated_at: now },
      { name: 'Calificación',     '`order`': 2, created_at: now, updated_at: now },
      { name: 'Propuesta',        '`order`': 3, created_at: now, updated_at: now },
      { name: 'Negociación',      '`order`': 4, created_at: now, updated_at: now },
      { name: 'Cerrado Ganado',   '`order`': 5, created_at: now, updated_at: now },
      { name: 'Cerrado Perdido',  '`order`': 6, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@crm.com' });
    await queryInterface.bulkDelete('pipeline_stages', null, {});
  },
};