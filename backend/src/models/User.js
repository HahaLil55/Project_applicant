const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Некорректный формат email'
        },
        notEmpty: {
          msg: 'Email обязателен для заполнения'
        }
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: /^\+7\d{10}$/,
          msg: 'Телефон должен быть в формате +7XXXXXXXXXX'
        },
        notEmpty: {
          msg: 'Телефон обязателен для заполнения'
        }
      }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('abiturient', 'specialist', 'admin'),
      defaultValue: 'abiturient',
      allowNull: false,
      validate: {
        isIn: {
          args: [['abiturient', 'specialist', 'admin']],
          msg: 'Недопустимая роль пользователя'
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async user => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
      beforeUpdate: async user => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      }
    }
  }
);

// Метод для проверки пароля
User.prototype.checkPassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Метод для обновления времени последнего входа
User.prototype.updateLastLogin = async function () {
  this.last_login = new Date();
  await this.save();
};

module.exports = User;
