require('dotenv').config();
const { sequelize } = require('../src/models');

async function initDatabase() {
  console.log('Начало инициализации базы данных...');

  try {
    console.log('   Создание таблиц...');

    // Синхронизация без удаления существующих данных
    await sequelize.sync({ alter: true });

    console.log('База данных успешно инициализирована');
    console.log('\n Созданные таблицы:');
    console.log('   users - таблица пользователей');
    console.log('   abiturient_profiles - профили абитуриентов');
    console.log('\nСервер готов к работе!');
    console.log('Для создания тестовых данных выполните: npm run init:test-data');

    process.exit(0);
  } catch (error) {
    console.error('!!! Ошибка инициализации базы данных:', error.message);
  }
}

initDatabase();
