import app from './app.js';
import { config, validateConfig } from './config/index.js';
import prisma from './lib/prisma.js';

async function main() {
  try {
    // Проверка конфигурации
    validateConfig();

    // Проверка подключения к БД
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Запуск сервера
    app.listen(config.port, () => {
      console.log(`
🚀 Server is running!
   
   Environment: ${config.nodeEnv}
   Port: ${config.port}
   
   API: http://localhost:${config.port}/api
   Health: http://localhost:${config.port}/api/health
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
