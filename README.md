# Messenger bot manager

- Telegram
- Max

## Example
```js
import { ServiceManager, TelegramService, MaxService, BotEvent } from '../dist/index.js'

const manager = new ServiceManager()

// Register services
const tg = new TelegramService()
const max = new MaxService()

// Register bots
tg.registerBot('main', 'token')
max.registerBot('main', 'token')

manager
    .registerService(tg)
    .registerService(max)

// Register events (separately for each service)
manager
    .registerEvent('tg', 'main', new HelloEvent(process.env.TELEGRAM_CHAT_ID))
    .registerEvent('max', 'main', new HelloEvent(process.env.MAX_CHAT_ID))

// Register webhooks
manager
    .registerWebhook('tg', 'main', new SampleWebhook())

manager.handleEvent('tg', 'main', 'hello')
manager.handleEvent('max', 'main', 'hello')

const updateData = {} // Data from bot update
manager.handleWebhook('max', 'main', updateData)
```


