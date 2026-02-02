const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, authorize, authorizeResource } = require('../middleware/authMiddleware');
const { validateUserCreation, validateUserUpdate } = require('../middleware/validationMiddleware');

// GET /api/users Получение списка пользователей (Admin)
router.get('/', authenticate, authorize('admin'), UserController.getAllUsers);

//  GET /api/users/me Получение текущего пользователя
router.get('/me', authenticate, UserController.getCurrentUser);

// GET /api/users/:id Получение пользователя по ID (Admin или владелец)
router.get('/:id', authenticate, authorizeResource('user'), UserController.getUserById);

// POST /api/users Создание пользователя (администратором)
router.post('/', authenticate, authorize('admin'), validateUserCreation, UserController.createUser);

// PUT /api/users/me Обновление текущего пользователя
router.put('/me', authenticate, validateUserUpdate, UserController.updateCurrentUser);

// PUT /api/users/:id Обновление пользователя по ID (Admin)
router.put('/:id', authenticate, authorize('admin'), validateUserUpdate, UserController.updateUser);

// DELETE /api/users/:id Удаление пользователя (Admin)
router.delete('/:id', authenticate, authorize('admin'), UserController.deleteUser);

module.exports = router;
