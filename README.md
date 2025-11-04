# Messenger bot

## Local start
```
Запуск всех контейнеров
docker compose -f ./docker/local/docker-compose.yml --env-file .env up -d
```

## Backend API для управления Telegram-ботами (на Telegraf + Express)

### Основные endpoint-ы:

- **POST /bots/:botName/send** — отправить сообщение, body:
```json
{
  "chatId": 123456,
  "text": "Привет!",
  "options": {
    "parseMode": "Markdown",
    "replyMarkupButtons": [
      [ { "text": "Кнопка", "callbackData": "btn1" } ]
    ]
  }
}
```
- **POST /webhook/:botName** — endpoint для Telegram webhook (указывать этот URL в настройках Telegram). Все типы апдейтов, поддержка inline-кнопок и callback_query.

### Пример подключения webhook для Telegram:
```
curl "https://api.telegram.org/bot<token>/setWebhook?url=https://<your_domain>/webhook/<botName>"
```

### Пример вызова кнопки:
```json
{
  "chatId": 123456,
  "text": "Тест кнопки",
  "options": {
    "replyMarkupButtons": [
      [ { "text": "Click me!", "callbackData": "press1" } ]
    ]
  }
}
```
