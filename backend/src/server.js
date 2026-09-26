import app from './app.js';
import { sequelize } from './models/index.js';
import { env } from './config/env.js';

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL conectado');

    app.listen(env.PORT, () => {
      console.log(`🚀 Servidor en http://localhost:${env.PORT}`);
      console.log(`🌎 Entorno: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar:', error);
    process.exit(1);
  }
};

start();