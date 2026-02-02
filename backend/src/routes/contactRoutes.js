const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/contactController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  validateAbiturientRole,
  validateContactInfo
} = require('../middleware/validationMiddleware');

// GET /api/abiturient/contact Получение контактной информации абитуриента (Abiturient)
router.get('/contact', authenticate, validateAbiturientRole, ContactController.getContactInfo);

// PUT /api/abiturient/contact Обновление контактной информации абитуриента (Abiturient)
router.put(
  '/contact',
  authenticate,
  validateAbiturientRole,
  validateContactInfo,
  ContactController.updateContactInfo
);

module.exports = router;
