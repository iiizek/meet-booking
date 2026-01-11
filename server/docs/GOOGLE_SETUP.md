# Тестирование Google OAuth и Calendar API

## Шаг 1: Создание проекта в Google Cloud Console

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Нажмите **Select a project** → **New Project**
3. Введите название (например, "Meeting Room Booking")
4. Нажмите **Create**

## Шаг 2: Включение Google Calendar API

1. В левом меню: **APIs & Services** → **Library**
2. Найдите **Google Calendar API**
3. Нажмите на него, затем **Enable**

## Шаг 3: Настройка OAuth Consent Screen

1. **APIs & Services** → **OAuth consent screen**
2. Выберите **External** (для тестирования)
3. Заполните обязательные поля:
   - App name: "Meeting Room Booking"
   - User support email: ваш email
   - Developer contact: ваш email
4. Нажмите **Save and Continue**

### Scopes

На следующем экране добавьте scopes:
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`
- `.../auth/calendar`
- `.../auth/calendar.events`

### Test Users

Добавьте тестовых пользователей (свой Google аккаунт):
- Нажмите **Add Users**
- Введите email вашего Google аккаунта

## Шаг 4: Создание OAuth 2.0 Credentials

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth Client ID**
3. Application type: **Web application**
4. Name: "Meeting Room Booking Web"
5. Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
7. Нажмите **Create**

## Шаг 5: Копирование credentials

Скопируйте:
- **Client ID** (выглядит как `123456789-abc...apps.googleusercontent.com`)
- **Client Secret** (выглядит как `GOCSPX-...`)

Вставьте их в `.env`:

```env
GOOGLE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

## Шаг 6: Тестирование OAuth

### 6.1 Запустите сервер

```bash
npm run dev
```

### 6.2 Откройте URL в браузере

```
http://localhost:3000/api/auth/google
```

### 6.3 Авторизуйтесь через Google

1. Выберите свой Google аккаунт
2. Разрешите доступ к календарю
3. Вы будете перенаправлены на `http://localhost:5173/auth/callback?token=...`

**Примечание**: Поскольку фронтенд ещё не готов, вы увидите ошибку 404, но в URL будет токен.
Скопируйте токен из URL для тестирования.

## Шаг 7: Тестирование Calendar API

### 7.1 Создайте бронирование

```bash
TOKEN="ваш_токен_из_url"

curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "roomId": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "title": "Тестовая встреча с Calendar",
    "description": "Проверка интеграции",
    "startTime": "2025-01-20T14:00:00Z",
    "endTime": "2025-01-20T15:00:00Z"
  }'
```

### 7.2 Проверьте Google Calendar

Откройте [Google Calendar](https://calendar.google.com/) — там должно появиться новое событие!

### 7.3 Получите события из календаря

```bash
curl "http://localhost:3000/api/calendar/events?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

### 7.4 Проверьте статус подключения Google

```bash
curl http://localhost:3000/api/auth/google/status \
  -H "Authorization: Bearer $TOKEN"
```

Ожидаемый ответ:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "hasAccessToken": true,
    "hasRefreshToken": true
  }
}
```

## Частые проблемы

### "Access blocked: This app's request is invalid"

**Причина**: Неправильный redirect URI

**Решение**: Убедитесь, что в Google Console добавлен точный URI:
```
http://localhost:3000/api/auth/google/callback
```

### "Error 403: access_denied"

**Причина**: Пользователь не добавлен в Test Users

**Решение**: 
1. OAuth consent screen → Test users
2. Добавьте свой Google email

### "invalid_grant"

**Причина**: Refresh token истёк или был отозван

**Решение**: Пройдите авторизацию заново

### Событие не создаётся в календаре

**Причина**: Недостаточно прав или отсутствует токен

**Решение**:
1. Проверьте scopes в OAuth consent screen
2. Убедитесь, что `googleAccessToken` сохранён в БД

## Полезные команды

```bash
# Проверить данные пользователя в БД
npm run prisma:studio

# Посмотреть логи авторизации
npm run dev

# Проверить переменные окружения
cat .env | grep GOOGLE
```

## Режим Production

Для production:
1. OAuth consent screen → Publish App
2. Пройдите верификацию Google
3. Используйте HTTPS для redirect URI
