const Joi = require('joi');

/**
 * Валидация данных регистрации абитуриента
 */
const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен для заполнения'
    }),

    phone: Joi.string()
      .pattern(/^\+7\d{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Телефон должен быть в формате +7XXXXXXXXXX',
        'any.required': 'Телефон обязателен для заполнения'
      }),

    password: Joi.string().min(6).required().messages({
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'any.required': 'Пароль обязателен для заполнения'
    }),

    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Пароли не совпадают',
      'any.required': 'Подтверждение пароля обязательно'
    }),

    role: Joi.string().valid('abiturient').default('abiturient').messages({
      'any.only': 'При регистрации можно создать только аккаунт абитуриента'
    })
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }

  next();
};

/**
 * Валидация данных входа
 */
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен для заполнения'
    }),

    password: Joi.string().required().messages({
      'any.required': 'Пароль обязателен для заполнения'
    })
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }

  next();
};

/**
 * Валидация создания пользователя администратором
 */
const validateUserCreation = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Некорректный формат email',
      'any.required': 'Email обязателен для заполнения'
    }),

    phone: Joi.string()
      .pattern(/^\+7\d{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Телефон должен быть в формате +7XXXXXXXXXX',
        'any.required': 'Телефон обязателен для заполнения'
      }),

    password: Joi.string().min(6).required().messages({
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'any.required': 'Пароль обязателен для заполнения'
    }),

    role: Joi.string().valid('abiturient', 'specialist', 'admin').required().messages({
      'any.only': 'Роль должна быть: abiturient, specialist или admin',
      'any.required': 'Роль обязательна для заполнения'
    }),

    is_active: Joi.boolean().default(true)
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }

  next();
};

/**
 * Валидация обновления пользователя
 */
const validateUserUpdate = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().messages({
      'string.email': 'Некорректный формат email'
    }),

    phone: Joi.string()
      .pattern(/^\+7\d{10}$/)
      .messages({
        'string.pattern.base': 'Телефон должен быть в формате +7XXXXXXXXXX'
      }),

    password: Joi.string().min(6).messages({
      'string.min': 'Пароль должен содержать минимум 6 символов'
    }),

    role: Joi.string().valid('abiturient', 'specialist', 'admin').messages({
      'any.only': 'Роль должна быть: abiturient, specialist или admin'
    }),

    is_active: Joi.boolean()
  }).min(1); // Хотя бы одно поле должно быть обновлено

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }

  next();
};

/**
 * Валидация персональных данных абитуриента
 */
const validatePersonalData = (req, res, next) => {
  const schema = Joi.object({
    last_name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Фамилия должна содержать минимум 1 символ',
      'string.max': 'Фамилия не должна превышать 100 символов',
      'any.required': 'Фамилия обязательна для заполнения'
    }),

    first_name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Имя должно содержать минимум 1 символ',
      'string.max': 'Имя не должно превышать 100 символов',
      'any.required': 'Имя обязательно для заполнения'
    }),

    middle_name: Joi.string().allow('', null).max(100).optional().messages({
      'string.max': 'Отчество не должно превышать 100 символов'
    }),

    birth_date: Joi.date()
      .iso()
      .max('now')
      .required()
      .messages({
        'date.format': 'Дата рождения должна быть в формате YYYY-MM-DD',
        'date.max': 'Дата рождения не может быть в будущем',
        'any.required': 'Дата рождения обязательна для заполнения'
      })
      .custom((value, helpers) => {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 14) {
          return helpers.error('any.custom', {
            message: 'Минимальный возраст - 14 лет'
          });
        }

        return value;
      }),

    gender: Joi.string().valid('male', 'female').required().messages({
      'any.only': 'Пол должен быть male или female',
      'any.required': 'Пол обязателен для заполнения'
    }),

    consent_personal_data: Joi.boolean().valid(true).required().messages({
      'any.only': 'Согласие на обработку персональных данных обязательно',
      'any.required': 'Согласие на обработку персональных данных обязательно'
    })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }

  next();
};

/**
 * Middleware для проверки, что пользователь является абитуриентом
 */
const validateAbiturientRole = (req, res, next) => {
  if (req.user.role !== 'abiturient') {
    return res.status(403).json({
      success: false,
      error: 'Доступ запрещен. Только абитуриенты могут управлять профилем'
    });
  }

  next();
};

/**
 * Валидация контактной информации абитуриента
 */
const validateContactInfo = (req, res, next) => {
  const schema = Joi.object({
    phone: Joi.string()
      .pattern(/^\+7\d{10}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Телефон должен быть в формате +7XXXXXXXXXX'
      }),

    email: Joi.string().email().optional().messages({
      'string.email': 'Некорректный формат email'
    }),

    messengers: Joi.object({
      telegram: Joi.string()
        .pattern(/^@[a-zA-Z0-9_]{5,32}$/)
        .optional()
        .messages({
          'string.pattern.base':
            'Telegram должен быть в формате @username (5-32 символа, только буквы, цифры и подчеркивания)'
        }),

      vkontakte: Joi.string()
        .pattern(/^(id\d+|[a-zA-Z0-9._]{2,32})$/)
        .optional()
        .messages({
          'string.pattern.base':
            'VK должен быть в формате id123456789 или короткое имя пользователя'
        }),

      max: Joi.string()
        .pattern(/^\+7\d{10}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Max должен быть в формате +7XXXXXXXXXX'
        }),

      other: Joi.string().max(100).optional().messages({
        'string.max': 'Другой мессенджер не должен превышать 100 символов'
      })
    })
      .optional()
      .messages({
        'object.base': 'Мессенджеры должны быть объектом'
      })
  }).min(1); // Хотя бы одно поле должно быть обновлено

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateUserCreation,
  validateUserUpdate,
  validatePersonalData,
  validateAbiturientRole,
  validateContactInfo
};
