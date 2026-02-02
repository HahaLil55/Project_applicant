const jwt = require('jsonwebtoken');
const { User, AbiturientProfile } = require('../models');

/**
 * Контроллер для аутентификации и регистрации
 */
class AuthController {
  /**
   * Регистрация нового абитуриента
   */
  static async register(req, res) {
    try {
      const { email, phone, password, role = 'abiturient' } = req.body;

      // Проверка, существует ли пользователь с таким email
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Пользователь с таким email уже существует'
        });
      }

      // Создание пользователя
      const user = await User.create({
        email,
        phone,
        password_hash: password, // Пароль хешируется в хуке beforeCreate
        role,
        is_active: true
      });

      // Генерация JWT токена
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Обновление времени последнего входа
      await user.updateLastLogin();

      // Создание пустого профиля абитуриента
      if (role === 'abiturient') {
        await AbiturientProfile.create({
          user_id: user.id,
          last_name: '',
          first_name: '',
          consent_personal_data: false
        });
      }

      res.status(201).json({
        success: true,
        message: 'Пользователь успешно зарегистрирован',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active
          },
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      console.error('!!! Ошибка регистрации:', error);

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          error: 'Пользователь с таким email или телефоном уже существует'
        });
      }

      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации данных',
          details: errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Ошибка при регистрации пользователя'
      });
    }
  }

  /**
   * Вход в систему
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Поиск пользователя
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Неверный email или пароль'
        });
      }

      // Проверка активности аккаунта
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Аккаунт деактивирован. Обратитесь к администратору'
        });
      }

      // Проверка пароля
      const isPasswordValid = await user.checkPassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Неверный email или пароль'
        });
      }

      // Генерация JWT токена
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Обновление времени последнего входа
      await user.updateLastLogin();

      res.status(200).json({
        success: true,
        message: 'Вход выполнен успешно',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active,
            last_login: user.last_login
          },
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      console.error('!!! Ошибка входа:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при входе в систему'
      });
    }
  }

  /**
   * Проверка токена
   */
  static async verifyToken(req, res) {
    try {
      // Если middleware authenticate прошел успешно, пользователь уже проверен
      const user = req.user;

      res.status(200).json({
        success: true,
        message: 'Токен действителен',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active,
            last_login: user.last_login
          }
        }
      });
    } catch (error) {
      console.error('!!! Ошибка проверки токена:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка проверки токена'
      });
    }
  }

  /**
   * Выход из системы
   */
  static async logout(req, res) {
    try {
      // В JWT нет состояния, поэтому просто возвращаем успех
      // На клиенте токен должен быть удален
      res.status(200).json({
        success: true,
        message: 'Выход выполнен успешно'
      });
    } catch (error) {
      console.error('!!! Ошибка выхода:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при выходе из системы'
      });
    }
  }

  /**
   * Обновление токена (refresh)
   */
  static async refreshToken(req, res) {
    try {
      const user = req.user;

      // Генерация нового токена
      const newToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Токен обновлен',
        data: {
          token: newToken,
          expires_in: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      console.error('!!! Ошибка обновления токена:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка обновления токена'
      });
    }
  }
}

module.exports = AuthController;
