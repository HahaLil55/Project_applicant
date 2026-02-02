# Общие принципы:

## Формат запросов:

- Все POST/PUT запросы должны иметь Content-Type: application/json
- Для аутентифицированных запросов обязателен заголовок Authorization: Bearer <token>

## Формат ответов:

- Успешный ответ: { "success": true, ... }
- Ошибка: { "success": false, "error": "...", "details": "..." }

## Валидация:

- Все входящие данные проходят валидацию через Joi
- Бизнес-правила проверяются в контроллерах
- Уникальность проверяется в базе данных

## Безопасность:

- Пароли хешируются через bcrypt
- JWT токены с сроком действия 7 дней
- Ролевая модель доступа (abiturient, specialist, admin)
- Проверка прав доступа к ресурсам

# Системные эндпоинты

## 1. Проверка здоровья сервера (GET /api/health)

**Flow:**

- Роутер (/health)
- Ответ клиенту

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Сервер работает нормально",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

**Коды ответа:**

- 200 OK: Сервер работает

## 2. Получение информации о сервере (GET /api)

**Flow:**

- Роутер (/)
- Ответ клиенту

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Добро пожаловать в UniVerse API УГНТУ",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "health": "/api/health"
  }
}
```

**Коды ответа:**

- 200 OK: Сервер работает

# Аутентификация и регистрация

## 3. Регистрация абитуриента (POST /api/auth/register)

**Flow:**

- Роутер (/auth/register)
- Валидация Middleware (validateRegistration)
- AuthController.register
- User.create() → PostgreSQL (users)
- AbiturientProfile.create() → PostgreSQL (abiturient_profiles)
- Генерация JWT
- Ответ клиенту

**Ожидаемые данные (Request Body):**

```json
{
  "email": "student@example.com",
  "phone": "+79123456789",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Пользователь успешно зарегистрирован",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "phone": "+79123456789",
      "role": "abiturient",
      "is_active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "7d"
  }
}
```

**Коды ответа:**

- 201 Created: Успешная регистрация
- 400 Bad Request: Ошибка валидации данных
- 409 Conflict: Пользователь с таким email уже существует

## 4. Вход в систему (POST /api/auth/login)

**Flow:**

- Роутер (/auth/login)
- Валидация Middleware (validateLogin)
- AuthController.login
- User.findOne() → PostgreSQL (users)
- Проверка пароля (bcrypt.compare)
- Обновление last_login
- Генерация JWT
- Ответ клиенту

**Ожидаемые данные (Request Body):**

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Вход выполнен успешно",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "phone": "+79123456789",
      "role": "abiturient",
      "is_active": true,
      "last_login": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "7d"
  }
}
```

**Коды ответа:**

- 200 OK: Успешный вход
- 400 Bad Request: Ошибка валидации данных
- 401 Unauthorized: Неверный email или пароль
- 403 Forbidden: Аккаунт деактивирован

## 5. Проверка токена (GET /api/auth/verify)

**Flow:**

- Роутер (/auth/verify)
- Аутентификация Middleware (authenticate)
- AuthController.verifyToken
- Проверка JWT
- User.findByPk() → PostgreSQL (users)
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Токен действителен",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "phone": "+79123456789",
      "role": "abiturient",
      "is_active": true,
      "last_login": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Коды ответа:**

- 200 OK: Токен действителен
- 401 Unauthorized: Токен не предоставлен или недействителен
- 403 Forbidden: Аккаунт деактивирован

## 6. Выход из системы (POST /api/auth/logout)

**Flow:**

- Роутер (/auth/logout)
- Аутентификация Middleware (authenticate)
- AuthController.logout
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Выход выполнен успешно"
}
```

**Коды ответа:**

- 200 OK: Успешный выход

## 7. Обновление токена (POST /api/auth/refresh)

**Flow:**

- Роутер (/auth/refresh)
- Аутентификация Middleware (authenticate)
- AuthController.refreshToken
- Генерация нового JWT
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Токен обновлен",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "7d"
  }
}
```

**Коды ответа:**

- 200 OK: Токен успешно обновлен
- 401 Unauthorized: Текущий токен недействителен

# Управление пользователями (Админ)

## 8. Получение списка пользователей (GET /api/users)

**Flow:**

- Роутер (/users)
- Аутентификация Middleware (authenticate)
- Авторизация Middleware (authorize('admin'))
- UserController.getAllUsers
- User.findAndCountAll() → PostgreSQL (users + abiturient_profiles)
- Пагинация
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ожидаемые данные (Query Parameters):**

```http
GET /api/users?page=1&limit=10&role=abiturient&is_active=true
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "student@example.com",
        "phone": "+79123456789",
        "role": "abiturient",
        "is_active": true,
        "profile": {
          "id": 1,
          "last_name": "Иванов",
          "first_name": "Иван"
        }
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

**Коды ответа:**

- 200 OK: Успешное получение списка
- 401 Unauthorized: Пользователь не аутентифицирован
- 403 Forbidden: Недостаточно прав (требуется роль admin)

## 9. Получение текущего пользователя (GET /api/users/me)

**Flow:**

- Роутер (/users/me)
- Аутентификация Middleware (authenticate)
- UserController.getCurrentUser
- User.findByPk() → PostgreSQL (users + abiturient_profiles)
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "phone": "+79123456789",
      "role": "abiturient",
      "is_active": true,
      "profile": {
        "id": 1,
        "last_name": "Иванов",
        "first_name": "Иван",
        "middle_name": "Иванович",
        "birth_date": "2005-06-15",
        "gender": "male",
        "messengers": {
          "telegram": "@ivanov"
        },
        "consent_personal_data": true
      }
    }
  }
}
```

**Коды ответа:**

- 200 OK: Успешное получение данных
- 401 Unauthorized: Пользователь не аутентифицирован

## 10. Получение пользователя по ID (GET /api/users/:id)

**Flow:**

- Роутер (/users/:id)
- Аутентификация Middleware (authenticate)
- Проверка прав доступа (authorizeResource)
- UserController.getUserById
- User.findByPk() → PostgreSQL (users + abiturient_profiles)
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "phone": "+79123456789",
      "role": "abiturient",
      "is_active": true,
      "profile": {
        "id": 1,
        "last_name": "Иванов",
        "first_name": "Иван"
      }
    }
  }
}
```

**Коды ответа:**

- 200 OK: Успешное получение данных
- 401 Unauthorized: Пользователь не аутентифицирован
- 403 Forbidden: Доступ запрещен (не владелец и не admin)
- 404 Not Found: Пользователь не найден

## 11. Создание пользователя (POST /api/users) - Админ

**Flow:**

- Роутер (/users)
- Аутентификация Middleware (authenticate)
- Авторизация Middleware (authorize('admin'))
- Валидация Middleware (validateUserCreation)
- UserController.createUser
- User.create() → PostgreSQL (users)
- AbiturientProfile.create() → PostgreSQL (abiturient_profiles)
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ожидаемые данные (Request Body):**

```json
{
  "email": "newuser@example.com",
  "phone": "+79876543210",
  "password": "password123",
  "role": "specialist",
  "is_active": true
}
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Пользователь успешно создан",
  "data": {
    "user": {
      "id": 2,
      "email": "newuser@example.com",
      "phone": "+79876543210",
      "role": "specialist",
      "is_active": true
    }
  }
}
```

**Коды ответа:**

- 201 Created: Пользователь успешно создан
- 400 Bad Request: Ошибка валидации данных
- 401 Unauthorized: Пользователь не аутентифицирован
- 403 Forbidden: Недостаточно прав (требуется роль admin)
- 409 Conflict: Пользователь с таким email уже существует

## 12. Обновление текущего пользователя (PUT /api/users/me)

**Flow:**

- Роутер (/users/me)
- Аутентификация Middleware (authenticate)
- Валидация Middleware (validateUserUpdate)
- UserController.updateCurrentUser
- User.findByPk()
- Проверка уникальности email
- User.update() → PostgreSQL (users)
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ожидаемые данные (Request Body):**

```json
{
  "phone": "+79991234567",
  "email": "newemail@example.com"
}
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Профиль успешно обновлен",
  "data": {
    "user": {
      "id": 1,
      "email": "newemail@example.com",
      "phone": "+79991234567",
      "role": "abiturient",
      "is_active": true
    }
  }
}
```

**Коды ответа:**

- 200 OK: Профиль успешно обновлен
- 400 Bad Request: Ошибка валидации данных
- 401 Unauthorized: Пользователь не аутентифицирован
- 409 Conflict: Пользователь с таким email уже существует

## 13. Обновление пользователя по ID (PUT /api/users/:id) - Админ

**Flow:**

- Роутер (/users/:id)
- Аутентификация Middleware (authenticate)
- Авторизация Middleware (authorize('admin'))
- Валидация Middleware (validateUserUpdate)
- UserController.updateUser
- User.findByPk()
- Проверка уникальности email
- User.update() → PostgreSQL (users)
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ожидаемые данные (Request Body):**

```json
{
  "role": "specialist",
  "is_active": false
}
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Пользователь успешно обновлен",
  "data": {
    "user": {
      "id": 2,
      "email": "user@example.com",
      "phone": "+79123456789",
      "role": "specialist",
      "is_active": false,
      "last_login": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Коды ответа:**

- 200 OK: Пользователь успешно обновлен
- 400 Bad Request: Ошибка валидации данных
- 401 Unauthorized: Пользователь не аутентифицирован
- 403 Forbidden: Недостаточно прав (требуется роль admin)
- 404 Not Found: Пользователь не найден
- 409 Conflict: Пользователь с таким email уже существует

## 14. Удаление пользователя (DELETE /api/users/:id) - Админ

**Flow:**

- Роутер (/users/:id)
- Аутентификация Middleware (authenticate)
- Авторизация Middleware (authorize('admin'))
- UserController.deleteUser
- User.findByPk()
- Проверка нельзя удалить себя
- User.update({is_active: false}) → PostgreSQL (users)
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Аккаунт пользователя деактивирован"
}
```

**Коды ответа:**

- 200 OK: Аккаунт успешно деактивирован
- 400 Bad Request: Нельзя удалить свой собственный аккаунт
- 401 Unauthorized: Пользователь не аутентифицирован
- 403 Forbidden: Недостаточно прав (требуется роль admin)
- 404 Not Found: Пользователь не найден

# Профиль абитуриента

## 15. Получение профиля абитуриента (GET /api/abiturient/profile)

**Flow:**

- Роутер (/abiturient/profile)
- Аутентификация Middleware (authenticate)
- Проверка роли (validateAbiturientRole)
- AbiturientController.getProfile
- AbiturientProfile.findOne() → PostgreSQL (abiturient_profiles + users)
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "data": {
    "profile": {
      "id": 1,
      "user_id": 1,
      "last_name": "",
      "first_name": "",
      "middle_name": null,
      "birth_date": null,
      "gender": null,
      "messengers": {},
      "consent_personal_data": false,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "user": {
        "email": "student@example.com",
        "phone": "+79123456789",
        "role": "abiturient"
      }
    }
  }
}
```

**Коды ответа:**

- 200 OK: Успешное получение профиля
- 401 Unauthorized: Пользователь не аутентифицирован
- 403 Forbidden: Пользователь не является абитуриентом
- 404 Not Found: Профиль не найден

## 16. Обновление персональных данных (PUT /api/abiturient/profile/personal)

**Flow:**

- Роутер (/abiturient/profile/personal)
- Аутентификация Middleware (authenticate)
- Проверка роли (validateAbiturientRole)
- Валидация Middleware (validatePersonalData)
- AbiturientController.updatePersonalData
- AbiturientProfile.findOne() → PostgreSQL (abiturient_profiles)
- AbiturientProfile.update() → PostgreSQL (abiturient_profiles)
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Ожидаемые данные (Request Body):**

```json
{
  "last_name": "Иванов",
  "first_name": "Иван",
  "middle_name": "Иванович",
  "birth_date": "2005-06-15",
  "gender": "male",
  "consent_personal_data": true
}
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Персональные данные успешно обновлены",
  "data": {
    "profile": {
      "id": 1,
      "user_id": 1,
      "last_name": "Иванов",
      "first_name": "Иван",
      "middle_name": "Иванович",
      "birth_date": "2005-06-15",
      "gender": "male",
      "consent_personal_data": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T11:30:00.000Z"
    }
  }
}
```

**Коды ответа:**

- 200 OK: Данные успешно обновлены
- 400 Bad Request: Ошибка валидации данных
- 401 Unauthorized: Пользователь не аутентифицирован
- 403 Forbidden: Пользователь не является абитуриентом
- 404 Not Found: Профиль не найден

## 17. Получение контактной информации (GET /api/abiturient/contact)

**Flow:**

- Роутер (/abiturient/contact)
- Аутентификация Middleware (authenticate)
- Проверка роли (validateAbiturientRole)
- ContactController.getContactInfo
- AbiturientProfile.findOne() → PostgreSQL (abiturient_profiles + users)
- Форматирование ответа
- Ответ клиенту

**Ожидаемые данные (Headers):**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "data": {
    "contact": {
      "email": "student@example.com",
      "phone": "+79123456789",
      "messengers": {
        "telegram": "@ivanov",
        "vkontakte": "id123456789",
        "whatsapp": "+79123456789",
        "other": "Skype: ivan.ivanov"
      }
    }
  }
}
```

**Коды ответа:**

- 200 OK: Успешное получение данных
- 401 Unauthorized: Пользователь не аутентифицирован
- 403 Forbidden: Пользователь не является абитуриентом
- 404 Not Found: Профиль не найден

## 18. Обновление контактной информации (PUT /api/abiturient/contact)

**Flow:**

- Роутер (/abiturient/contact)
- Аутентификация Middleware (authenticate)
- Проверка роли (validateAbiturientRole)
- Валидация Middleware (validateContactInfo)
- ContactController.updateContactInfo
- User.findByPk() + AbiturientProfile.findOne() → PostgreSQL (users + abiturient_profiles)
- Проверка уникальности email
- User.update() + AbiturientProfile.update() → PostgreSQL (users + abiturient_profiles)
- Ответ клиенту

**Ожидаемые данные (Headers):**

````http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/```json
````

**Ожидаемые данные (Request Body):**
_все поля опциональны, но хотя бы одно должно быть_

```json
{
  "phone": "+79991234567",
  "email": "newemail@example.com",
  "messengers": {
    "telegram": "@newusername",
    "vkontakte": "id987654321",
    "whatsapp": "+79991234567",
    "other": "Skype: new.skype"
  }
}
```

**Возвращаемые данные (Response):**

```json
{
  "success": true,
  "message": "Контактная информация успешно обновлена",
  "data": {
    "contact": {
      "email": "newemail@example.com",
      "phone": "+79991234567",
      "messengers": {
        "telegram": "@newusername",
        "vkontakte": "id987654321",
        "whatsapp": "+79991234567",
        "other": "Skype: new.skype"
      }
    }
  }
}
```

**Коды ответа:**

- 200 OK: Данные успешно обновлены
- 400 Bad Request: Ошибка валидации данных
- 401 Unauthorized: Пользователь не аутентифицирован
- 403 Forbidden: Пользователь не является абитуриентом
- 404 Not Found: Профиль не найден
- 409 Conflict: Пользователь с таким email уже существует

# Примечания

## Процесс работы абитуриента:

- Регистрация: Создается аккаунт с пустым профилем
- Вход в систему: Получение JWT токена
- Заполнение персональных данных: Обязательные поля: фамилия, имя, дата рождения, пол, согласие
- Заполнение контактной информации: Email, телефон, мессенджеры

## Тестовые пользователи:

- Администратор: admin@ugntu.ru / admin123
- Специалист: specialist@ugntu.ru / specialist123
- Абитуриент 1: abiturient1@example.com / password123

## Особенности реализации:

- При регистрации создается пустой профиль с валидацией отключенной
- Полная валидация включается при обновлении профиля через специальные эндпоинты
- Email должен быть уникальным в системе
- Телефон должен соответствовать формату +7XXXXXXXXXX
- Согласие на обработку данных обязательно для заполнения профиля
