# Bot manager

A TypeScript library for managing multiple messenger bots (Telegram, Max) through a unified interface.

## Features

- Unified API across Telegram and Max platforms
- Centralized `ServiceManager` to orchestrate multiple services and bots
- Event-driven architecture with custom `BotEvent` handlers
- Webhook handler registration via **decorators** or **manual registration**
- Supports webhook mode and polling mode
- Proxy support for restricted environments
- Dual ESM / CommonJS output

## Installation

```bash
npm install messenger-bot-manager
```

## Quick Start

```js
import { ServiceManager, TelegramService, MaxService } from 'messenger-bot-manager'

const manager = new ServiceManager()

const tg = new TelegramService()
manager.registerService(tg)

tg.registerBot('main', { token: 'YOUR_BOT_TOKEN' })

// Trigger a custom event
await manager.handleEvent('tg', 'main', 'hello', null)

// Handle an incoming webhook update
await manager.handleWebhook('tg', 'main', updateBody, headers)
```

## Core Concepts

### ServiceManager

Central orchestrator. Holds references to all registered services and routes events/webhooks.

```ts
const manager = new ServiceManager()

manager.registerService(tg)           // register a service
manager.getService('tg')              // retrieve a service
manager.getServices()                 // all services (Map)

// Events
manager.registerEvent('tg', 'main', event)
await manager.handleEvent('tg', 'main', 'eventName', payload)

// Webhooks
await manager.handleWebhook('tg', 'main', body, headers)
```

### Services

Services manage bot instances of a specific platform.

```ts
import { TelegramService, MaxService } from 'messenger-bot-manager'

const tg = new TelegramService()   // service name: 'tg'
const max = new MaxService()       // service name: 'max'

// Register a bot
tg.registerBot('main', { token: 'TOKEN' })
tg.registerBot('support', { token: 'TOKEN2', secret: 'WEBHOOK_SECRET' })

tg.getBot('main')    // retrieve bot instance
tg.getBots()         // ['main', 'support']
```

**Bot config options:**

| Option | Type | Description |
|---|---|---|
| `token` | `string` | Bot API token |
| `secret` | `string` | Secret for verifying webhook requests |
| `instance.proxy.url` | `string` | HTTP proxy URL (Telegram only) |

### Bot Events

`BotEvent` encapsulates logic that is triggered programmatically (not from a user message). The event name is derived from the class name by default (`HelloEvent` → `hello`), or set explicitly via the `name` property.

```ts
import { BotEvent } from 'messenger-bot-manager'

class HelloEvent extends BotEvent {
    name = 'hello'

    async handle(payload) {
        await this.bot.sendMessage(this.chatId, 'Hello! <b>Welcome</b>', {
            buttons: [
                { type: 'callback', text: 'Click me', payload: { action: 'doSomething' } },
            ],
        })
    }
}
```

Register events when creating a bot, or later via the manager:

```ts
// At registration time
tg.registerBot('main', { token: 'TOKEN' }, [new HelloEvent('123456789')])

// Later, via manager
manager.registerEvent('tg', 'main', new HelloEvent('123456789'))

// Trigger
await manager.handleEvent('tg', 'main', 'hello', null)
```

### Bot Webhooks

`BotWebhook` handles incoming updates from users. Register handlers using **decorators** or the **manual registration** method.

#### Option A — Decorators (TypeScript)

```ts
import { BotWebhook, Command, Action, Text, Contact, Location, BotWebhookUpdate } from 'messenger-bot-manager'

class MyWebhook extends BotWebhook {
    @Command('start')
    async handleStart(payload: BotWebhookUpdate) {
        await this.bot.sendMessage(payload.sender.id, 'Welcome!')
    }

    @Action('doSomething')
    async handleAction(payload: BotWebhookUpdate) {
        await this.bot.editMessage(payload.chat.id, payload.message.id, 'Done!')
    }

    @Text(/hello/i)
    async handleHello(payload: BotWebhookUpdate) {
        await this.bot.sendMessage(payload.sender.id, 'Hi there!')
    }

    @Contact()
    async handleContact(payload: BotWebhookUpdate) {
        const phone = payload.contact?.phone
        await this.bot.sendMessage(payload.sender.id, `Got your number: ${phone}`)
    }

    @Location()
    async handleLocation(payload: BotWebhookUpdate) {
        const { latitude, longitude } = payload.location!
        await this.bot.sendMessage(payload.sender.id, `Location: ${latitude}, ${longitude}`)
    }
}
```

> Requires `experimentalDecorators: true` in `tsconfig.json`.

#### Option B — Manual registration

```js
class MyWebhook extends BotWebhook {
    registerHandlers() {
        this.registerCommandHandler('start', this.handleStart.bind(this))
        this.registerCommandHandler('help', this.handleHelp.bind(this))
        this.registerActionHandler('doSomething', this.handleAction.bind(this))
        this.registerActionHandler(/^edit_/, this.handleEdit.bind(this))
        this.registerTextHandler(/order/i, this.handleOrder.bind(this))
        this.registerContactHandler(this.handleContact.bind(this))
        this.registerLocationHandler(this.handleLocation.bind(this))
    }

    handleStart(payload) {
        this.bot.sendMessage(payload.sender.id, 'Hello!')
    }

    // Optional: catches updates with no matching handler
    handleUnknown(payload) {
        console.log('Unhandled update', payload)
    }
}
```

#### Starting a bot

```js
const bot = manager.getService('tg').getBot('main')

// Webhook mode (requires a public URL)
await bot.start(new MyWebhook(), { url: 'https://example.com/webhook/tg/main' })

// Polling mode (no URL needed — great for local development)
await bot.start(new MyWebhook())
```

## Sending Messages

All bot methods return `Promise<boolean>`.

### sendMessage

```js
await bot.sendMessage(chatId, 'Plain text')

await bot.sendMessage(chatId, 'Hello <b>world</b>!', {
    parseMode: 'html',
    disableNotification: true,
    buttons: [
        { type: 'callback', text: 'OK', payload: { action: 'confirm' } },
        { type: 'link', text: 'Open site', payload: 'https://example.com' },
        { type: 'request_contact', text: 'Share phone' },
        { type: 'location', text: 'Share location' },
    ],
})
```

### sendFile

Accepts a URL or local file path.

```js
// Image
await bot.sendFile(chatId, 'https://example.com/photo.jpg', 'Caption text')

// Video
await bot.sendFile(chatId, 'https://example.com/video.mp4', 'Watch this', {
    buttons: [{ type: 'callback', text: 'Like', payload: { action: 'like' } }],
})
```

### editMessage / editCaption

```js
await bot.editMessage(chatId, messageId, 'Updated text')
await bot.editCaption(chatId, messageId, 'Updated caption')
```

### addMessageTag / addFileTag

Appends `#tag` to an existing message or media caption.

```js
await bot.addMessageTag(chatId, messageId, currentText, 'approved')
await bot.addFileTag(chatId, messageId, currentCaption, 'rejected')
```

## Webhook Update Format

All handlers receive a unified `BotWebhookUpdate` object regardless of the platform:

```ts
interface BotWebhookUpdate {
    type: 'command' | 'callback' | 'text' | 'contact' | 'location'
    sender: {
        id: string | number
        firstName?: string
        lastName?: string
        username?: string
        isBot?: boolean
    }
    chat: {
        id: string | number
        type?: 'private' | 'group' | 'supergroup' | 'channel'
    }
    message: {
        id: string | number
        timestamp: number
        text?: string
    }
    command?: { name: string; value?: string }
    callback?: { data: any }             // callback.data.action is the action key
    contact?: { phone: string; sender: boolean }
    location?: { latitude: number; longitude: number }
}
```

## Full Example

```js
import 'dotenv/config'
import {
    ServiceManager,
    TelegramService,
    MaxService,
    BotEvent,
    BotWebhook,
} from 'messenger-bot-manager'

class WelcomeEvent extends BotEvent {
    name = 'welcome'

    async handle() {
        await this.bot.sendMessage(this.chatId, 'Bot started! Type /start to begin.', {
            disableNotification: true,
        })
    }
}

class MainWebhook extends BotWebhook {
    registerHandlers() {
        this.registerCommandHandler('start', this.onStart.bind(this))
        this.registerActionHandler('approve', this.onApprove.bind(this))
        this.registerContactHandler(this.onContact.bind(this))
    }

    async onStart(payload) {
        await this.bot.sendMessage(payload.sender.id, 'Hello!', {
            buttons: [
                { type: 'request_contact', text: 'Share phone number' },
                { type: 'callback', text: 'Approve something', payload: { action: 'approve', id: 42 } },
            ],
        })
    }

    async onApprove(payload) {
        const id = payload.callback.data.id
        await this.bot.editMessage(payload.chat.id, payload.message.id, `Item ${id} approved ✓`)
    }

    async onContact(payload) {
        await this.bot.sendMessage(payload.sender.id, `Got number: ${payload.contact.phone}`)
    }

    handleUnknown(payload) {
        console.log('Unknown update:', payload.type)
    }
}

async function main() {
    const manager = new ServiceManager()

    const tg = new TelegramService()
    const max = new MaxService()
    manager.registerService(tg).registerService(max)

    // Telegram bot
    if (process.env.TELEGRAM_TOKEN) {
        tg.registerBot(
            'main',
            { token: process.env.TELEGRAM_TOKEN },
            [new WelcomeEvent(process.env.ADMIN_CHAT_ID)]
        )
        const tgBot = tg.getBot('main')
        await tgBot.start(new MainWebhook())   // polling mode
    }

    // Max bot
    if (process.env.MAX_TOKEN) {
        max.registerBot(
            'main',
            { token: process.env.MAX_TOKEN },
            [new WelcomeEvent(process.env.ADMIN_CHAT_ID)]
        )
        const maxBot = max.getBot('main')
        // Webhook mode — the platform will POST updates to this URL
        await maxBot.start(new MainWebhook(), { url: 'https://example.com/webhook/max/main' })
    }

    // Fire a startup event for all bots
    await manager.handleEvent('tg', null, 'welcome', null)
}

main().catch(console.error)
```

## Integrating with an HTTP server

When using webhook mode, wire `manager.handleWebhook` to your HTTP server route:

```js
// Express example
app.post('/webhook/:service/:bot', async (req, res) => {
    try {
        await manager.handleWebhook(req.params.service, req.params.bot, req.body, req.headers)
        res.sendStatus(200)
    } catch (err) {
        res.sendStatus(500)
    }
})
```
