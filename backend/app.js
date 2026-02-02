const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const abiturientRoutes = require('./src/routes/abiturientRoutes');
const contactRoutes = require('./src/routes/contactRoutes');

const app = express();

// Безопасность
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Логирование
app.use(morgan('combined'));

// Парсинг JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/abiturient', abiturientRoutes);
app.use('/api/abiturient', contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Сервер работает нормально',
    timestamp: new Date().toISOString()
  });
});

// Базовый маршрут
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Добро пожаловать в UniVerse API УГНТУ',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      health: '/api/health'
    }
  });
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден'
  });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('!!! Ошибка сервера:', err.stack);

  // Классификация ошибок
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации данных',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Не авторизован'
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Конфликт данных',
      details: 'Запись с такими данными уже существует'
    });
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации данных',
      details: errors
    });
  }

  // Дефолтная ошибка
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

module.exports = app;
