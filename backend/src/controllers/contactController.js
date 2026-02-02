const { AbiturientProfile, User } = require('../models');

/**
 * Контроллер для управления контактной информацией абитуриента
 */
class ContactController {
  /**
   * Получение контактной информации
   */
  static async getContactInfo(req, res) {
    try {
      const user = req.user;

      const profile = await AbiturientProfile.findOne({
        where: { user_id: user.id },
        attributes: ['id', 'user_id', 'messengers'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'phone']
          }
        ]
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Профиль абитуриента не найден'
        });
      }

      // Форматирование ответа
      const contactInfo = {
        email: profile.user.email,
        phone: profile.user.phone,
        messengers: profile.messengers || {}
      };

      res.status(200).json({
        success: true,
        data: { contact: contactInfo }
      });
    } catch (error) {
      console.error('!!! Ошибка получения контактной информации:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении контактной информации'
      });
    }
  }

  /**
   * Обновление контактной информации
   */
  static async updateContactInfo(req, res) {
    try {
      const user = req.user;
      const { phone, email, messengers } = req.body;

      // Поиск пользователя
      const userRecord = await User.findByPk(user.id);
      if (!userRecord) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }

      // Поиск профиля
      const profile = await AbiturientProfile.findOne({
        where: { user_id: user.id }
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Профиль абитуриента не найден'
        });
      }

      // Обновление данных пользователя (email и phone)
      if (email || phone) {
        const updateData = {};

        if (email) {
          // Проверка уникальности email
          if (email !== userRecord.email) {
            const existingUser = await User.findOne({
              where: { email }
            });

            if (existingUser) {
              return res.status(409).json({
                success: false,
                error: 'Пользователь с таким email уже существует'
              });
            }
          }
          updateData.email = email;
        }

        if (phone) {
          updateData.phone = phone;
        }

        await userRecord.update(updateData);
      }

      // Обновление мессенджеров в профиле
      if (messengers !== undefined) {
        await profile.update({ messengers });
      }

      // Получение обновленных данных
      const updatedUser = await User.findByPk(user.id, {
        attributes: ['email', 'phone']
      });

      const updatedProfile = await AbiturientProfile.findByPk(profile.id, {
        attributes: ['messengers']
      });

      const contactInfo = {
        email: updatedUser.email,
        phone: updatedUser.phone,
        messengers: updatedProfile.messengers || {}
      };

      res.status(200).json({
        success: true,
        message: 'Контактная информация успешно обновлена',
        data: { contact: contactInfo }
      });
    } catch (error) {
      console.error('!!! Ошибка обновления контактной информации:', error);

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
          error: 'Пользователь с таким email уже существует'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении контактной информации'
      });
    }
  }
}

module.exports = ContactController;
