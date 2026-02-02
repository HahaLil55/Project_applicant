const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const AbiturientProfile = sequelize.define(
  'AbiturientProfile',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        len: {
          args: [0, 100], // Разрешаем пустую строку при создании
          msg: 'Фамилия не должна превышать 100 символов'
        }
      }
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        len: {
          args: [0, 100], // Разрешаем пустую строку при создании
          msg: 'Имя не должно превышать 100 символов'
        }
      }
    },
    middle_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Отчество не должно превышать 100 символов'
        }
      }
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Некорректная дата рождения'
        },
        notInFuture(value) {
          if (value && new Date(value) > new Date()) {
            throw new Error('Дата рождения не может быть в будущем');
          }
        }
      }
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true,
      validate: {
        isIn: {
          args: [['male', 'female']],
          msg: 'Пол должен быть male или female'
        }
      }
    },
    messengers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    consent_personal_data: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        // Убираем валидацию isTrue, так как при создании профиля согласие еще не дано
        // Валидация будет выполняться только при обновлении данных через соответствующий эндпоинт
      }
    }
  },
  {
    tableName: 'abiturient_profiles',
    timestamps: true,
    hooks: {
      beforeValidate: (profile, options) => {
        // При создании нового профиля отключаем строгую валидацию
        if (profile.isNewRecord) {
          // Разрешаем пустые поля при создании
          return;
        }

        // При обновлении профиля включаем полную валидацию
        // Эта логика будет обрабатываться в контроллере updatePersonalData
      }
    }
  }
);

AbiturientProfile.createEmptyProfile = async function (userId) {
  return await this.create({
    user_id: userId,
    last_name: '',
    first_name: '',
    middle_name: null,
    birth_date: null,
    gender: null,
    messengers: {},
    consent_personal_data: false
  });
};

// Метод для проверки, заполнен ли профиль полностью
AbiturientProfile.prototype.isComplete = function () {
  return (
    this.last_name &&
    this.last_name.trim().length > 0 &&
    this.first_name &&
    this.first_name.trim().length > 0 &&
    this.birth_date &&
    this.gender &&
    this.consent_personal_data === true
  );
};

module.exports = AbiturientProfile;
