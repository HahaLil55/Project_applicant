const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

// POST /api/auth/register Регистрация нового абитуриента
router.post('/register', validateRegistration, AuthController.register);

//POST /api/auth/login Вход в систему
router.post('/login', validateLogin, AuthController.login);

//   GET /api/auth/verify Проверка токена
router.get('/verify', authenticate, AuthController.verifyToken);

// POST /api/auth/logout Выход из системы
router.post('/logout', authenticate, AuthController.logout);

// POST /api/auth/refresh Обновление токена
router.post('/refresh', authenticate, AuthController.refreshToken);

module.exports = router;
