const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware для проверки JWT токена
 */
const authenticate = async (req, res, next) => {
  try {
    // Извлечение токена из заголовка
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Токен не предоставлен. Используйте формат: Bearer <token>'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Проверка токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Поиск пользователя в базе данных
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Аккаунт деактивирован'
      });
    }

    // Добавление пользователя в запрос
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Недействительный токен'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Срок действия токена истек'
      });
    }

    console.error('!!! Ошибка аутентификации:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка аутентификации'
    });
  }
};

/**
 * Middleware для проверки ролей пользователя
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не аутентифицирован'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Недостаточно прав. Требуемые роли: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware для проверки владения ресурсом
 * (пользователь может редактировать только свой профиль, админ - любой)
 */
const authorizeResource = (resourceType = 'user') => {
  return async (req, res, next) => {
    try {
      // Админы имеют доступ ко всему
      if (req.user.role === 'admin') {
        return next();
      }

      // Проверяем, является ли пользователь владельцем ресурса
      let resourceId;

      switch (resourceType) {
        case 'user':
          resourceId = parseInt(req.params.id || req.user.id);
          break;
        case 'profile':
          resourceId = parseInt(req.params.userId || req.user.id);
          break;
        default:
          resourceId = parseInt(req.params.id);
      }

      if (req.user.id !== resourceId) {
        return res.status(403).json({
          success: false,
          error: 'Доступ запрещен. Вы можете редактировать только свои данные'
        });
      }

      next();
    } catch (error) {
      console.error('!!! Ошибка проверки прав доступа:', error);
      return res.status(500).json({
        success: false,
        error: 'Ошибка проверки прав доступа'
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeResource
};
