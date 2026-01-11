# Meeting Room Booking API

API сервер для системы бронирования переговорных комнат.

## Технологии

- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT авторизация
- Google OAuth 2.0
- Google Calendar API

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Скопируйте `.env.example` в `.env` и заполните переменные:

```bash
cp .env.example .env
```

Обязательные переменные:
- `DATABASE_URL` — строка подключения к PostgreSQL
- `GOOGLE_CLIENT_ID` — Client ID из Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — Client Secret из Google Cloud Console

### 3. Настройка Google Cloud

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **Google Calendar API**:
   - APIs & Services → Library → Google Calendar API → Enable
4. Создайте OAuth 2.0 credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Скопируйте Client ID и Client Secret в `.env`

### 4. Обновление базы данных

Выполните SQL-миграцию для добавления полей Google токенов:

```bash
# В Beekeeper Studio выполните:
prisma/migrations/add_google_tokens.sql
```

### 5. Генерация Prisma клиента

```bash
npm run prisma:generate
```

### 6. Запуск в режиме разработки

```bash
npm run dev
```

Сервер запустится на http://localhost:3000

## API Endpoints

### Аутентификация

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET | /api/auth/me | Текущий пользователь |
| PATCH | /api/auth/me | Обновить профиль |
| GET | /api/auth/users | Пользователи организации |
| GET | /api/auth/google | Начать OAuth через Google |
| GET | /api/auth/google/callback | Callback для Google OAuth |
| GET | /api/auth/google/status | Статус подключения Google |
| POST | /api/auth/google/disconnect | Отключить Google аккаунт |

### Комнаты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/rooms | Список комнат |
| GET | /api/rooms/:id | Комната по ID |
| GET | /api/rooms/:id/availability | Доступность комнаты |
| POST | /api/rooms | Создать комнату (admin) |
| PATCH | /api/rooms/:id | Обновить комнату (admin) |
| DELETE | /api/rooms/:id | Удалить комнату (admin) |

### Бронирования

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/bookings | Бронирования организации |
| GET | /api/bookings/my | Мои бронирования |
| GET | /api/bookings/:id | Бронирование по ID |
| POST | /api/bookings | Создать бронирование |
| PATCH | /api/bookings/:id | Обновить бронирование |
| POST | /api/bookings/:id/cancel | Отменить бронирование |
| DELETE | /api/bookings/:id | Удалить (admin) |

### Google Calendar

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/calendar/events | Получить события из Google Calendar |
| POST | /api/calendar/sync/:bookingId | Синхронизировать бронирование |
| POST | /api/calendar/sync-all | Синхронизировать все бронирования |
| DELETE | /api/calendar/unlink/:bookingId | Отвязать от Google Calendar |

## Google Calendar интеграция

### Как это работает

1. Пользователь авторизуется через Google OAuth
2. При создании бронирования автоматически создаётся событие в Google Calendar
3. Участники получают приглашения на email
4. При отмене бронирования событие отменяется в календаре

### Scope разрешения

Приложение запрашивает следующие разрешения:
- `profile` — базовая информация профиля
- `email` — email пользователя
- `https://www.googleapis.com/auth/calendar` — полный доступ к календарю
- `https://www.googleapis.com/auth/calendar.events` — управление событиями

## Примеры запросов

### Авторизация через Google

Откройте в браузере:
```
http://localhost:3000/api/auth/google
```

После успешной авторизации вы будете перенаправлены на клиент с токеном.

### Получить события из календаря

```bash
curl "http://localhost:3000/api/calendar/events?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Синхронизировать бронирование

```bash
curl -X POST http://localhost:3000/api/calendar/sync/BOOKING_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка проекта |
| `npm start` | Запуск production сборки |
| `npm run prisma:generate` | Генерация Prisma клиента |
| `npm run prisma:studio` | Открыть Prisma Studio |

## Структура проекта

```
server/
├── prisma/
│   ├── schema.prisma          # Схема базы данных
│   └── migrations/            # SQL миграции
├── src/
│   ├── config/
│   │   ├── index.ts           # Конфигурация
│   │   └── passport.ts        # Google OAuth стратегия
│   ├── lib/prisma.ts          # Prisma клиент
│   ├── types/index.ts         # TypeScript типы
│   ├── services/
│   │   └── googleCalendar.service.ts  # Google Calendar API
│   ├── middleware/
│   │   ├── auth.ts            # JWT авторизация
│   │   └── errorHandler.ts    # Обработка ошибок
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── rooms.controller.ts
│   │   ├── bookings.controller.ts
│   │   └── calendar.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── rooms.routes.ts
│   │   ├── bookings.routes.ts
│   │   └── calendar.routes.ts
│   ├── app.ts
│   └── index.ts
├── .env.example
├── package.json
└── tsconfig.json
```
