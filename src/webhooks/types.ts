import { Bot } from '~/services/types'

export interface BotWebhookUpdate {
    type: 'command' | 'callback' | 'text' | 'contact' | 'location' | 'photo' | 'document'
    message: {
        id: string | number
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
        text?: string
        contact?: {
            phone: string
        }
        location?: {
            latitude: number
            longitude: number
        }
        timestamp: number
    }
    callback?: {
        data: string
        messageId: string | number
    }
    raw: any
}

export interface BotWebhookContext {
    payload: BotWebhookUpdate
}

// Декораторы для пометки методов как обработчиков
export function Command(name: string) {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._commands) {
            target.constructor._commands = new Map()
        }
        target.constructor._commands.set(name.toLowerCase(), propertyKey)
    }
}

export function Action(pattern: string | RegExp) {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._actions) {
            target.constructor._actions = new Map()
        }
        target.constructor._actions.set(pattern, propertyKey)
    }
}

export function Text(pattern: string | RegExp) {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._textHandlers) {
            target.constructor._textHandlers = new Map()
        }
        target.constructor._textHandlers.set(pattern, propertyKey)
    }
}

export function Contact() {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._contactHandler) {
            target.constructor._contactHandler = propertyKey
        }
    }
}

export function Location() {
    return function (target: any, propertyKey: string) {
        if (!target.constructor._locationHandler) {
            target.constructor._locationHandler = propertyKey
        }
    }
}

export abstract class BotWebhook {
    private static _commands: Map<string, string> = new Map()
    private static _actions: Map<string | RegExp, string> = new Map()
    private static _textHandlers: Map<string | RegExp, string> = new Map()
    private static _contactHandler?: string
    private static _locationHandler?: string

    /**
     * Получить обработчик для входящего обновления
     */
    getHandler(update: BotWebhookUpdate): ((bot: Bot, payload: BotWebhookUpdate) => Promise<void>) | undefined {
        const constructor = this.constructor as typeof BotWebhook

        switch (update.type) {
            case 'command':
                return this.getCommandHandler(update, constructor)
            case 'callback':
                return this.getActionHandler(update, constructor)
            case 'text':
                return this.getTextHandler(update, constructor)
            case 'contact':
                return this.getContactHandler(constructor)
            case 'location':
                return this.getLocationHandler(constructor)
            default:
                return undefined
        }
    }

    /**
     * Обработчик команд
     */
    private getCommandHandler(update: BotWebhookUpdate, constructor: typeof BotWebhook): ((bot: Bot, payload: BotWebhookUpdate) => Promise<void>) | undefined {
        if (!update.message.text) return undefined

        // Извлекаем команду из текста (формат: /command или /command@botname)
        const commandMatch = update.message.text.match(/^\/([a-zA-Z0-9_]+)(@\w+)?\s?(.*)$/)
        if (!commandMatch) return undefined

        const commandName = commandMatch[1].toLowerCase()
        const methodName = constructor._commands?.get(commandName)

        if (methodName && typeof (this as any)[methodName] === 'function') {
            return (this as any)[methodName].bind(this)
        }

        return undefined
    }

    /**
     * Обработчик callback действий
     */
    private getActionHandler(update: BotWebhookUpdate, constructor: typeof BotWebhook): ((bot: Bot, payload: BotWebhookUpdate) => Promise<void>) | undefined {
        if (!update.callback?.data) return undefined

        const callbackData = update.callback.data

        for (const [pattern, methodName] of constructor._actions?.entries() || []) {
            if (typeof pattern === 'string' && pattern === callbackData) {
                if (typeof (this as any)[methodName] === 'function') {
                    return (this as any)[methodName].bind(this)
                }
            } else if (pattern instanceof RegExp && pattern.test(callbackData)) {
                if (typeof (this as any)[methodName] === 'function') {
                    // Добавляем match в payload для доступа к группам регулярного выражения
                    const match = callbackData.match(pattern)
                    update.raw = { ...update.raw, match }
                    return (this as any)[methodName].bind(this)
                }
            }
        }

        return undefined
    }

    /**
     * Обработчик текстовых сообщений
     */
    private getTextHandler(update: BotWebhookUpdate, constructor: typeof BotWebhook): ((bot: Bot, payload: BotWebhookUpdate) => Promise<void>) | undefined {
        if (!update.message.text) return undefined

        const text = update.message.text

        for (const [pattern, methodName] of constructor._textHandlers?.entries() || []) {
            if (typeof pattern === 'string' && pattern.toLowerCase() === text.toLowerCase()) {
                if (typeof (this as any)[methodName] === 'function') {
                    return (this as any)[methodName].bind(this)
                }
            } else if (pattern instanceof RegExp && pattern.test(text)) {
                if (typeof (this as any)[methodName] === 'function') {
                    // Добавляем match в payload для доступа к группам регулярного выражения
                    const match = text.match(pattern)
                    update.raw = { ...update.raw, match }
                    return (this as any)[methodName].bind(this)
                }
            }
        }

        return undefined
    }

    /**
     * Обработчик контактов
     */
    private getContactHandler(constructor: typeof BotWebhook): ((bot: Bot, payload: BotWebhookUpdate) => Promise<void>) | undefined {
        if (constructor._contactHandler && typeof (this as any)[constructor._contactHandler] === 'function') {
            return (this as any)[constructor._contactHandler].bind(this)
        }
        return undefined
    }

    /**
     * Обработчик локаций
     */
    private getLocationHandler(constructor: typeof BotWebhook): ((bot: Bot, payload: BotWebhookUpdate) => Promise<void>) | undefined {
        if (constructor._locationHandler && typeof (this as any)[constructor._locationHandler] === 'function') {
            return (this as any)[constructor._locationHandler].bind(this)
        }
        return undefined
    }
}


export class MyBotWebhook extends BotWebhook {

    @Command('start')
    handleStart(bot: Bot, payload: BotWebhookUpdate) {
        console.log('MyBotWebhook', { bot, payload })
    }
}