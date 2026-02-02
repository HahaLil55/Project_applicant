require('dotenv').config();
const { User, AbiturientProfile } = require('../src/models');

async function initTestData() {
  try {
    console.log('Создание тестовых данных...\n');

    // Проверка существующих пользователей
    const existingUsers = await User.count();

    if (existingUsers > 0) {
      console.log('В базе данных уже есть пользователи. Пропускаем создание тестовых данных.');
      process.exit(0);
    }

    // 1. Создание администратора
    console.log('1. Создание администратора...');
    const admin = await User.create({
      email: 'admin@ugntu.ru',
      phone: '+79111111111',
      password_hash: 'admin123',
      role: 'admin',
      is_active: true
    });
    console.log(` Администратор создан: ${admin.email} / admin123\n`);

    // 2. Создание специалиста
    console.log('2. Создание специалиста...');
    const specialist = await User.create({
      email: 'specialist@ugntu.ru',
      phone: '+79222222222',
      password_hash: 'specialist123',
      role: 'specialist',
      is_active: true
    });
    console.log(` Специалист создан: ${specialist.email} / specialist123\n`);

    // 3. Создание абитуриентов
    console.log('3. Создание абитуриентов...');

    const abiturients = [
      {
        email: 'abiturient1@example.com',
        phone: '+79333333333',
        password: 'password123',
        profile: {
          last_name: 'Иванов',
          first_name: 'Иван',
          middle_name: 'Иванович',
          birth_date: '2005-06-15',
          gender: 'male',
          messengers: {
            telegram: '@ivanov',
            vkontakte: 'id123456789',
            max: '+79333333333'
          },
          consent_personal_data: true
        }
      },
      {
        email: 'abiturient2@example.com',
        phone: '+79444444444',
        password: 'password456',
        profile: {
          last_name: 'Петрова',
          first_name: 'Анна',
          middle_name: 'Сергеевна',
          birth_date: '2006-03-22',
          gender: 'female',
          messengers: {
            telegram: '@anna_petrova',
            vkontakte: 'anna_petrova',
            max: '+79444444444'
          },
          consent_personal_data: true
        }
      },
      {
        email: 'abiturient3@example.com',
        phone: '+79555555555',
        password: 'password789',
        profile: {
          last_name: 'Сидоров',
          first_name: 'Алексей',
          middle_name: null,
          birth_date: '2005-11-30',
          gender: 'male',
          messengers: {
            telegram: '@alex_sidorov',
            vkontakte: 'id987654321',
            other: 'Skype: alex.sidorov'
          },
          consent_personal_data: true
        }
      }
    ];

    for (const [index, data] of abiturients.entries()) {
      const user = await User.create({
        email: data.email,
        phone: data.phone,
        password_hash: data.password,
        role: 'abiturient',
        is_active: true
      });

      await AbiturientProfile.create({
        user_id: user.id,
        ...data.profile
      });

      console.log(` Абитуриент ${index + 1}: ${user.email} / ${data.password}`);
    }

    // 4. Создание неактивного пользователя
    console.log('\n4. Создание неактивного пользователя...');
    const inactiveUser = await User.create({
      email: 'inactive@example.com',
      phone: '+79666666666',
      password_hash: 'inactive123',
      role: 'abiturient',
      is_active: false
    });

    await AbiturientProfile.create({
      user_id: inactiveUser.id,
      last_name: 'Неактивный',
      first_name: 'Пользователь',
      birth_date: '2004-08-10',
      gender: 'male',
      consent_personal_data: true
    });

    console.log(` Неактивный пользователь: ${inactiveUser.email} / inactive123`);

    console.log('\nТестовые данные успешно созданы!\n');

    console.log('\nТестовые учетные записи:');
    console.log('Администратор:');
    console.log('  Email: admin@ugntu.ru');
    console.log('  Пароль: admin123');
    console.log('  Роль: admin\n');

    console.log('Специалист:');
    console.log('  Email: specialist@ugntu.ru');
    console.log('  Пароль: specialist123');
    console.log('  Роль: specialist\n');

    console.log('Абитуриенты:');
    console.log('  1. abiturient1@example.com / password123');
    console.log('  2. abiturient2@example.com / password456');
    console.log('  3. abiturient3@example.com / password789\n');

    console.log('Неактивный пользователь:');
    console.log('  Email: inactive@example.com');
    console.log('  Пароль: inactive123');
    console.log('  Статус: неактивный\n');

    process.exit(0);
  } catch (error) {
    console.error('!!! Ошибка создания тестовых данных:', error);
    process.exit(1);
  }
}

initTestData();
