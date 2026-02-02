require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3001;

// Проверка подключения к БД и запуск сервера
sequelize
  .authenticate()
  .then(() => {
    console.log('Подключение к базе данных успешно установлено');

    // Синхронизация моделей с базой данных
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Модели синхронизированы с базой данных');

    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
      console.log(`API доступно по адресу: http://localhost:${PORT}/api`);
    });
  })
  .catch(error => {
    console.error('!!! Ошибка подключения к базе данных:', error);
    process.exit(1);
  });
