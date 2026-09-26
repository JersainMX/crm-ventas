'use strict';
import bcrypt from 'bcryptjs';

export default {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Admin123!', 12);

    await queryInterface.bulkInsert('users', [{
      name: 'Administrador',
      email: 'admin@crm.com',
      password_hash: passwordHash,
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }]);

    // Etapas del pipeline por defecto
    await queryInterface.bulkInsert('pipeline_stages', [
      { name: 'Prospección', order: 1, created_at: new Date(), updated_at: new Date() },
      { name: 'Calificación', order: 2, created_at: new Date(), updated_at: new Date() },
      { name: 'Propuesta', order: 3, created_at: new Date(), updated_at: new Date() },
      { name: 'Negociación', order: 4, created_at: new Date(), updated_at: new Date() },
      { name: 'Cerrado Ganado', order: 5, created_at: new Date(), updated_at: new Date() },
      { name: 'Cerrado Perdido', order: 6, created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@crm.com' });
    await queryInterface.bulkDelete('pipeline_stages', null, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
