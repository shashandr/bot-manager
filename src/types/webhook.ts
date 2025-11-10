import { Bot } from './bot'

export interface BotWebhookUpdate {
    type: 'command' | 'callback' | 'text' | 'contact' | 'location'
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
        data: any
    }
    raw: any
}

export interface BotWebhookContext {
    payload: BotWebhookUpdate
}

// Декораторы для композиционного подхода
export function Command(name: string): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const constructor = target.constructor
        if (!constructor._decoratedCommands) {
            constructor._decoratedCommands = new Map()
        }
        constructor._decoratedCommands.set(name.toLowerCase(), propertyKey)
    }
}

export function Action(pattern: string | RegExp): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const constructor = target.constructor
        if (!constructor._decoratedActions) {
            constructor._decoratedActions = new Map()
        }
        constructor._decoratedActions.set(pattern, propertyKey)
    }
}

export function Text(pattern: string | RegExp): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const constructor = target.constructor
        if (!constructor._decoratedTextHandlers) {
            constructor._decoratedTextHandlers = new Map()
        }
        constructor._decoratedTextHandlers.set(pattern, propertyKey)
    }
}

export function Contact(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const constructor = target.constructor
        constructor._decoratedContactHandler = propertyKey
    }
}

export function Location(): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const constructor = target.constructor
        constructor._decoratedLocationHandler = propertyKey
    }
}

// Класс регистрации обработчиков
export class HandlerRegistry {
    private _commands: Map<string, Function> = new Map()
    private _actions: Map<string | RegExp, Function> = new Map()
    private _textHandlers: Map<string | RegExp, Function> = new Map()
    private _contactHandler?: Function
    private _locationHandler?: Function

    registerCommand(command: string, handler: Function) {
        this._commands.set(command.toLowerCase(), handler)
    }

    registerAction(pattern: string | RegExp, handler: Function) {
        this._actions.set(pattern, handler)
    }

    registerText(pattern: string | RegExp, handler: Function) {
        this._textHandlers.set(pattern, handler)
    }

    registerContact(handler: Function) {
        this._contactHandler = handler
    }

    registerLocation(handler: Function) {
        this._locationHandler = handler
    }

    getHandler(update: BotWebhookUpdate): Function | undefined {
        switch (update.type) {
            case 'callback':
                return this.getActionHandler(update)
            case 'command':
                return this.getCommandHandler(update)
            case 'contact':
                return this._contactHandler
            case 'location':
                return this._locationHandler
            case 'text':
                return this.getTextHandler(update)
            default:
                return undefined
        }
    }

    private getCommandHandler(update: BotWebhookUpdate): Function | undefined {
        if (!update.message.text) return undefined

        const commandMatch = update.message.text.match(/^\/([a-zA-Z0-9_]+)/)
        if (!commandMatch) return undefined

        const commandName = commandMatch[1].toLowerCase()
        return this._commands.get(commandName)
    }

    private getActionHandler(update: BotWebhookUpdate): Function | undefined {
        if (!update.callback?.data) return undefined

        const actionName = update.callback.data?.action

        // Проверяем точное совпадение
        const exactHandler = this._actions.get(actionName)
        if (exactHandler) return exactHandler

        // Проверяем регулярные выражения
        for (const [pattern, handler] of this._actions.entries()) {
            if (pattern instanceof RegExp && pattern.test(actionName)) {
                // Сохраняем результат match для обработчика
                update.raw = { ...update.raw, match: actionName.match(pattern) }
                return handler
            }
        }

        return undefined
    }

    private getTextHandler(update: BotWebhookUpdate): Function | undefined {
        if (!update.message.text) return undefined

        const text = update.message.text

        // Проверяем точное совпадение
        const exactHandler = this._textHandlers.get(text.toLowerCase())
        if (exactHandler) return exactHandler

        // Проверяем регулярные выражения
        for (const [pattern, handler] of this._textHandlers.entries()) {
            if (pattern instanceof RegExp && pattern.test(text)) {
                // Сохраняем результат match для обработчика
                update.raw = { ...update.raw, match: text.match(pattern) }
                return handler
            }
        }

        return undefined
    }
}

// Базовый класс вебхука с композицией и поддержкой декораторов
export abstract class BotWebhook {
    protected registry: HandlerRegistry

    constructor() {
        this.registry = new HandlerRegistry()
        this.setupFromDecorators()
        this.registerHandlers()
    }

    /**
     * Автоматическая регистрация обработчиков из декораторов
     */
    private setupFromDecorators() {
        const constructor = this.constructor as any

        // Регистрируем команды из декораторов
        if (constructor._decoratedCommands) {
            for (const [command, methodName] of constructor._decoratedCommands.entries()) {
                const method = (this as any)[methodName]
                if (typeof method === 'function') {
                    this.registry.registerCommand(command, method.bind(this))
                }
            }
        }

        // Регистрируем действия из декораторов
        if (constructor._decoratedActions) {
            for (const [pattern, methodName] of constructor._decoratedActions.entries()) {
                const method = (this as any)[methodName]
                if (typeof method === 'function') {
                    this.registry.registerAction(pattern, method.bind(this))
                }
            }
        }

        // Регистрируем текстовые обработчики из декораторов
        if (constructor._decoratedTextHandlers) {
            for (const [pattern, methodName] of constructor._decoratedTextHandlers.entries()) {
                const method = (this as any)[methodName]
                if (typeof method === 'function') {
                    this.registry.registerText(pattern, method.bind(this))
                }
            }
        }

        // Регистрируем обработчик контактов из декоратора
        if (constructor._decoratedContactHandler) {
            const method = (this as any)[constructor._decoratedContactHandler]
            if (typeof method === 'function') {
                this.registry.registerContact(method.bind(this))
            }
        }

        // Регистрируем обработчик локаций из декоратора
        if (constructor._decoratedLocationHandler) {
            const method = (this as any)[constructor._decoratedLocationHandler]
            if (typeof method === 'function') {
                this.registry.registerLocation(method.bind(this))
            }
        }
    }

    /**
     * Абстрактный метод для ручной регистрации обработчиков (альтернатива декораторам)
     */
    protected registerHandlers(): void {}

    /**
     * Получить обработчик для входящего обновления
     */
    getHandler(update: BotWebhookUpdate): Function | undefined {
        return this.registry.getHandler(update)
    }

    /**
     * Вспомогательные методы для ручной регистрации
     */
    protected registerCommandHandler(command: string, handler: (bot: Bot, payload: BotWebhookUpdate) => void) {
        this.registry.registerCommand(command, handler)
    }

    protected registerActionHandler(pattern: string | RegExp, handler: (bot: Bot, payload: BotWebhookUpdate) => void) {
        this.registry.registerAction(pattern, handler)
    }

    protected registerTextHandler(pattern: string | RegExp, handler: (bot: Bot, payload: BotWebhookUpdate) => void) {
        this.registry.registerText(pattern, handler)
    }

    protected registerContactHandler(handler: (bot: Bot, payload: BotWebhookUpdate) => void) {
        this.registry.registerContact(handler)
    }

    protected registerLocationHandler(handler: (bot: Bot, payload: BotWebhookUpdate) => void) {
        this.registry.registerLocation(handler)
    }
}
