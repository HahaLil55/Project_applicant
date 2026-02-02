# Документация сервера UniVerse API

## Технические спецификации

### Стек технологий

| Компонент  | Версия | Назначение              |
| ---------- | ------ | ----------------------- |
| Node.js    | v18+   | JavaScript runtime      |
| Express.js | v4.18+ | Веб-фреймворк           |
| PostgreSQL | v14+   | Реляционная база данных |
| Sequelize  | v6+    | ORM для PostgreSQL      |
| JWT        | v9+    | Аутентификация          |
| bcrypt     | v5+    | Хеширование паролей     |

### Переменные окружения (`.env`)

```env
# Общие настройки
NODE_ENV=development
PORT=3001

# База данных
DATABASE_URL=postgresql://username:password@localhost:5432/universe_db

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Зависимости проекта

**Основные зависимости:**

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1", // Хеширование паролей
    "cors": "^2.8.5", // Междоменные запросы
    "dotenv": "^16.3.1", // Переменные окружения
    "express": "^4.18.2", // Веб-фреймворк
    "helmet": "^7.0.0", // Заголовки безопасности
    "joi": "^17.11.0", // Валидация данных
    "jsonwebtoken": "^9.0.2", // JWT токены
    "morgan": "^1.10.0", // Логирование запросов
    "pg": "^8.11.3", // PostgreSQL клиент
    "pg-hstore": "^2.3.4", // Сериализация данных
    "sequelize": "^6.35.2" // ORM
  }
}
```

**Dev-зависимости:**

```json
{
  "devDependencies": {
    "eslint": "^8.57.0", // Линтинг кода
    "nodemon": "^3.0.2", // Автоперезагрузка
    "prettier": "^3.2.5" // Форматирование кода
  }
}
```

## Архитектура проекта

### Структура каталогов

```
backend/
├── config/                   # Конфигурационные файлы
│   └── database.js           # Конфигурация БД
│
├── src/                      # Исходный код
│   ├── controllers/          # Контроллеры (обработчики запросов)
│   ├── models/               # Модели БД (Sequelize)
│   ├── routes/               # Маршруты API
│   ├── middleware/           # Промежуточное ПО
│   ├── services/             # Бизнес-логика
│   └── utils/                # Вспомогательные утилиты
│
├── scripts/                  # Скрипты
│   ├── init-db.js            # Инициализация БД
│   └── init-test-data.js     # Тестовые данные
│
├── docs/                     # Документация
│
├── .env                      # Переменные окружения
├── .env.example              # Шаблон .env
├── .gitignore                # Игнорируемые файлы
├── package.json              # Зависимости проекта
├── server.js                 # Точка входа сервера
└── app.js                    # Конфигурация Express
```

## База данных

### Схема базы данных

```sql
-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('abiturient', 'specialist', 'admin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица профилей абитуриентов
CREATE TABLE abiturient_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    messengers JSONB DEFAULT '{}',
    consent_personal_data BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Модели Sequelize

**User (Пользователь):**

```javascript
{
  id: INTEGER,           // Уникальный идентификатор
  email: STRING,         // Email (уникальный)
  phone: STRING,         // Телефон (+7XXXXXXXXXX)
  password_hash: STRING, // Хешированный пароль
  role: ENUM,            // Роль: abiturient|specialist|admin
  is_active: BOOLEAN,    // Активность аккаунта
  last_login: DATE       // Дата последнего входа
}
```

**AbiturientProfile (Профиль абитуриента):**

```javascript
{
  id: INTEGER,           // Уникальный идентификатор
  user_id: INTEGER,      // Ссылка на пользователя
  last_name: STRING,     // Фамилия (обязательно)
  first_name: STRING,    // Имя (обязательно)
  middle_name: STRING,   // Отчество (необязательно)
  birth_date: DATE,      // Дата рождения (обязательно)
  gender: ENUM,          // Пол: male|female
  messengers: JSONB,     // Мессенджеры для связи
  consent_personal_data: BOOLEAN // Согласие на обработку
}
```

### Валидация данных

**Пользователь:**

- Email: валидный формат, уникальный
- Телефон: формат +7XXXXXXXXXX
- Роль: строго из списка ['abiturient', 'specialist', 'admin']
- Пароль: минимальная длина 6 символов (хешируется)

**Абитуриент:**

- Фамилия: обязательное, 1-100 символов
- Имя: обязательное, 1-100 символов
- Отчество: необязательное, 0-100 символов
- Дата рождения: обязательная, не в будущем
- Пол: строго 'male' или 'female'
- Согласие на обработку данных: обязательно true

## API Документация

### Базовый URL

```
http://localhost:3001/api
```

### Формат ответа

**Успешный ответ:**

```json
{
  "success": true,
  "data": {},
  "message": "Опциональное сообщение"
}
```

**Ошибка:**

```json
{
  "success": false,
  "error": "Описание ошибки",
  "details": "Детали ошибки"
}
```

### Коды состояния HTTP

| Код | Описание              | Использование    |
| --- | --------------------- | ---------------- |
| 200 | OK                    | Успешный запрос  |
| 201 | Created               | Ресурс создан    |
| 400 | Bad Request           | Ошибка валидации |
| 401 | Unauthorized          | Не авторизован   |
| 403 | Forbidden             | Доступ запрещен  |
| 404 | Not Found             | Ресурс не найден |
| 409 | Conflict              | Конфликт данных  |
| 500 | Internal Server Error | Ошибка сервера   |

## Процесс разработки

### Команды для разработки

```bash
# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env
# Редактируйте .env файл

# Инициализация базы данных
npm run init:db

# Запуск в режиме разработки
npm run dev

# Форматирование кода
npm run format

# Проверка стиля кода
npm run lint
```

### Тестирование

1. **Проверка здоровья сервера:**

   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Создание тестовых данных:**

   ```bash
   npm run init:test-data
   ```

3. **Проверка API через Postman:**
   - Импортируйте коллекцию Postman
   - Установите переменную `baseUrl` = `http://localhost:3001`
   - Выполните запросы из коллекции

## Безопасность

### Меры безопасности

1. **Аутентификация:**
   - JWT токены с сроком действия 7 дней
   - Хеширование паролей с bcrypt
   - Проверка токенов через middleware

2. **Авторизация:**
   - Ролевая модель: abiturient, specialist, admin
   - Middleware для проверки прав доступа
   - Валидация ролей на уровне БД

3. **Защита данных:**
   - SQL инъекции предотвращаются через Sequelize
   - XSS защита через helmet
   - CORS политики для контроля доступа
   - Валидация всех входящих данных

### Middleware безопасности

```javascript
// Проверка JWT токена
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

// Проверка роли
const authorize = roles => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
};
```

## Мониторинг и логирование

### Уровни логирования

```javascript
// В development режиме
app.use(morgan('dev')); // Детальные логи

// В production режиме
app.use(morgan('combined')); // Стандартные логи Apache
```

#### Логи сервера включают:

1. **HTTP запросы:**
   - Метод, путь, статус ответа
   - Время выполнения
   - Размер ответа

2. **Ошибки базы данных:**
   - Ошибки подключения
   - Ошибки валидации
   - Ошибки уникальности

3. **Ошибки приложения:**
   - Ошибки JWT
   - Ошибки валидации данных
   - Необработанные исключения

### Резервное копирование и восстановление

#### Скрипты для резервного копирования

```bash
# Резервное копирование базы данных
pg_dump universe_db > backup_$(date +%Y%m%d).sql

# Восстановление базы данных
psql universe_db < backup_20240101.sql
```

#### Рекомендации по развертыванию

1. **Development:**
   - Используйте `npm run dev` с nodemon
   - Включите подробное логирование
   - Используйте локальную БД

2. **Production:**
   - Используйте `npm start` или PM2
   - Настройте переменные окружения
   - Используйте SSL для БД
   - Включите сжатие ответов
   - Настройте балансировщик нагрузки

### Устранение неполадок

#### Частые проблемы и решения

1. **Ошибка подключения к БД:**

   ```
   ❌ Ошибка подключения к базе данных: connect ECONNREFUSED
   ```

   **Решение:** Убедитесь, что PostgreSQL запущен и доступен по указанному адресу.

2. **Ошибка JWT:**

   ```
   ❌ Недействительный токен
   ```

   **Решение:** Проверьте JWT_SECRET в .env файле.

3. **Ошибка CORS:**

   ```
   Access-Control-Allow-Origin header is missing
   ```

   **Решение:** Проверьте CORS_ORIGIN в .env файле.

4. **Ошибка валидации данных:**
   ```
   ❌ Ошибка валидации данных
   ```
   **Решение:** Проверьте формат отправляемых данных согласно документации.

#### Логи для отладки

```bash
# Просмотр логов сервера
tail -f server.log

# Просмотр логов базы данных
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Контакты и поддержка

**Разработчики:**

- Команда UniVerse УГНТУ
- Email: support@universe.ugntu.ru

**Документация:**

- API: http://localhost:3001/api
- Health check: http://localhost:3001/api/health
- Исходный код: [GitHub Repository]
