const { User, AbiturientProfile } = require('../models');

/**
 * Контроллер для управления пользователями
 */
class UserController {
  /**
   * Получение списка пользователей (только для администратора)
   */
  static async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, role, is_active } = req.query;
      const offset = (page - 1) * limit;

      // Формирование условий фильтрации
      const where = {};

      if (role) {
        where.role = role;
      }

      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      // Получение пользователей с пагинацией
      const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password_hash'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: AbiturientProfile,
            as: 'profile',
            attributes: ['id', 'last_name', 'first_name']
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('!!! Ошибка получения списка пользователей:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении списка пользователей'
      });
    }
  }

  /**
   * Получение информации о пользователе по ID
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: AbiturientProfile,
            as: 'profile'
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('!!! Ошибка получения пользователя:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении пользователя'
      });
    }
  }

  /**
   * Создание пользователя администратором
   */
  static async createUser(req, res) {
    try {
      const { email, phone, password, role, is_active = true } = req.body;

      // Проверка существования пользователя
      const existingUser = await User.findOne({
        where: { email }
      });

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
        password_hash: password,
        role,
        is_active
      });

      // Создание профиля для абитуриента
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
        message: 'Пользователь успешно создан',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active
          }
        }
      });
    } catch (error) {
      console.error('!!! Ошибка создания пользователя:', error);

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

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          error: 'Пользователь с таким email или телефоном уже существует'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Ошибка при создании пользователя'
      });
    }
  }

  /**
   * Обновление пользователя
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Удаляем password_hash из updateData, если оно есть
      // Для обновления пароля используем отдельный метод
      if (updateData.password) {
        updateData.password_hash = updateData.password;
        delete updateData.password;
      }

      // Поиск пользователя
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }

      // Проверка на уникальность email
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: updateData.email }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: 'Пользователь с таким email уже существует'
          });
        }
      }

      // Обновление пользователя
      await user.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Пользователь успешно обновлен',
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
      console.error('!!! Ошибка обновления пользователя:', error);

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
        error: 'Ошибка при обновлении пользователя'
      });
    }
  }

  /**
   * Удаление пользователя
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Проверка, нельзя удалить самого себя
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Нельзя удалить свой собственный аккаунт'
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }

      // Вместо удаления деактивируем аккаунт
      await user.update({ is_active: false });

      res.status(200).json({
        success: true,
        message: 'Аккаунт пользователя деактивирован'
      });
    } catch (error) {
      console.error('!!! Ошибка удаления пользователя:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении пользователя'
      });
    }
  }

  /**
   * Получение текущего пользователя
   */
  static async getCurrentUser(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: AbiturientProfile,
            as: 'profile'
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('!!! Ошибка получения текущего пользователя:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении данных пользователя'
      });
    }
  }

  /**
   * Обновление профиля текущего пользователя
   */
  static async updateCurrentUser(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      const updateData = { ...req.body };

      // Удаляем password_hash из updateData, если оно есть
      if (updateData.password) {
        updateData.password_hash = updateData.password;
        delete updateData.password;
      }

      // Проверка на уникальность email
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: updateData.email }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: 'Пользователь с таким email уже существует'
          });
        }
      }

      // Обновление пользователя
      await user.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Профиль успешно обновлен',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active
          }
        }
      });
    } catch (error) {
      console.error('!!! Ошибка обновления профиля:', error);

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
        error: 'Ошибка при обновлении профиля'
      });
    }
  }
}

module.exports = UserController;
