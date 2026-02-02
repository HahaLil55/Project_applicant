const express = require('express');
const router = express.Router();
const AbiturientController = require('../controllers/abiturientController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  validatePersonalData,
  validateAbiturientRole
} = require('../middleware/validationMiddleware');

// GET /api/abiturient/profile Получение профиля абитуриента (Abiturient)
router.get('/profile', authenticate, validateAbiturientRole, AbiturientController.getProfile);

// PUT /api/abiturient/profile/personal Обновление персональных данных (Abiturient)
router.put(
  '/profile/personal',
  authenticate,
  validateAbiturientRole,
  validatePersonalData,
  AbiturientController.updatePersonalData
);

module.exports = router;
