# Meeting Room Booking API

API сервер для системы бронирования переговорных комнат.

## Технологии

- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT авторизация

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

### 3. Генерация Prisma клиента

```bash
npm run prisma:generate
```

### 4. Запуск в режиме разработки

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

## Примеры запросов

### Логин

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

### Получить комнаты

```bash
curl http://localhost:3000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Создать бронирование

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "roomId": "room-uuid",
    "title": "Планёрка",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T11:00:00Z"
  }'
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
│   └── schema.prisma      # Схема базы данных
├── src/
│   ├── config/            # Конфигурация
│   ├── controllers/       # Контроллеры
│   ├── lib/               # Библиотеки (Prisma)
│   ├── middleware/        # Middleware
│   ├── routes/            # Маршруты
│   ├── types/             # TypeScript типы
│   ├── app.ts             # Express приложение
│   └── index.ts           # Точка входа
├── .env.example
├── package.json
└── tsconfig.json
```
