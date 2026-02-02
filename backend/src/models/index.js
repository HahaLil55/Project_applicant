const sequelize = require('../../config/database');
const User = require('./User');
const AbiturientProfile = require('./AbiturientProfile');

// Определение связей
User.hasOne(AbiturientProfile, {
  foreignKey: 'user_id',
  as: 'profile',
  onDelete: 'CASCADE'
});

AbiturientProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = {
  sequelize,
  User,
  AbiturientProfile
};
