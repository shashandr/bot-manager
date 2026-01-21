# Messenger bot manager

- Telegram
- Max

## Example
```js
import { ServiceManager, TelegramService, MaxService, BotEvent } from 'messenger-bot-manager'

const manager = new ServiceManager()

// Register services
const tg = new TelegramService()
const max = new MaxService()

// Register bots
tg.registerBot('main', 'token', [new HelloEvent('chatId')])
max.registerBot('main', 'token')

manager
    .registerService(tg)
    .registerService(max)

// Register event
manager.registerEvent('max', 'main', new HelloEvent('chatId'))

// Register webhook
manager.registerWebhook('tg', 'main', new SampleWebhook())

manager.handleEvent('tg', 'main', 'hello')

const updateData = {} // Data from bot update
manager.handleWebhook('max', 'main', updateData)
```


