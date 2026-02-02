const { AbiturientProfile, User } = require('../models');

/**
 * Контроллер для управления профилем абитуриента
 */
class AbiturientController {
  /**
   * Получение профиля абитуриента
   */
  static async getProfile(req, res) {
    try {
      const user = req.user;

      const profile = await AbiturientProfile.findOne({
        where: { user_id: user.id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'phone', 'role']
          }
        ]
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Профиль абитуриента не найден'
        });
      }

      res.status(200).json({
        success: true,
        data: { profile }
      });
    } catch (error) {
      console.error('!!! Ошибка получения профиля:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении профиля'
      });
    }
  }

  /**
   * Обновление персональных данных
   */
  static async updatePersonalData(req, res) {
    try {
      const user = req.user;
      const { last_name, first_name, middle_name, birth_date, gender, consent_personal_data } =
        req.body;

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

      // Обновление профиля с включенной валидацией
      await profile.update({
        last_name,
        first_name,
        middle_name,
        birth_date,
        gender,
        consent_personal_data
      });

      // Получаем обновленный профиль
      const updatedProfile = await AbiturientProfile.findByPk(profile.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'phone', 'role']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Персональные данные успешно обновлены',
        data: { profile: updatedProfile }
      });
    } catch (error) {
      console.error('!!! Ошибка обновления персональных данных:', error);

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
        error: 'Ошибка при обновлении персональных данных'
      });
    }
  }
}

module.exports = AbiturientController;
