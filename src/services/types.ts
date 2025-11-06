import { BotWebhook, BotWebhookUpdate } from "~/webhooks/types"
import * as console from "node:console";

export interface BotConfig {
    token: string
}

export interface BotMessageButton {
    type: 'callback' | 'link' | 'request_contact' | 'location'
    text: string
    payload?: any
}

export interface BotMessageOptions {
    parseMode?: 'html' | 'markdown'
    buttons?: Array<BotMessageButton>
}

export interface BotUpdateHandler {
    onText?: (ctx: any) => void | Promise<void>
    onCallbackQuery?: (ctx: any) => void | Promise<void>
    onAnyMessage?: (ctx: any) => void | Promise<void>
}

export type ServiceName = 'tg' | 'max'

export interface GetUpdateOptions {
    offset?: number
    limit?: number
    timeout?: number
    allowedUpdates?: string[]
}

export abstract class Bot {
    protected instance: any
    public name: string
    public config: BotConfig

    constructor(name: string, config: BotConfig) {
        this.name = name
        this.config = config
        this.instance = this.createInstance(config.token)
    }

    protected abstract createInstance(token: string): any

    abstract sendMessage(
        chatId: number | string,
        text: string,
        options?: BotMessageOptions
    ): Promise<any>

    abstract sendFile(chatId: number | string, file: any, caption?: string): Promise<any>

    abstract getUpdate(options?: GetUpdateOptions): Promise<any>

    abstract start(webhook: BotWebhook): void

    abstract convertWebhookUpdate(update: any): BotWebhookUpdate

    getInstance() {
        return this.instance
    }

    getConfig(): BotConfig {
        return this.config
    }

    async handleWebhook(webhook: BotWebhook, update: any): Promise<void> {
        const payload = this.convertWebhookUpdate(update)
        const handler = webhook.getHandler(payload)

        if (handler) {
            await handler(this, payload)
        } else {
            const unknownHandler = (webhook as any).handleUnknown
            if (typeof unknownHandler === 'function') {
                await unknownHandler.call(webhook, this, payload)
            }
        }
    }

    getMediaType(extension: string) {
        const types = {
            photo: ['jpeg', 'jpg', 'bmp', 'gif', 'png', 'webp', 'wbmp', 'heic'],
            video: ['mpg', 'mp4', 'avi', 'mov', 'mkv', 'flv', 'webm'],
            audio: ['m4a', 'mp3', 'wav', 'wma', 'ogg', 'aac'],
            document: ['txt', 'doc', 'docx', 'xls', 'xlsx', 'pdf', 'tiff'],
        }
        for (const type in types) {
            // @ts-ignore
            if (types[type].includes(extension)) {
                return type
            }
        }

        return null
    }
}

export abstract class MessengerService {
    protected bots: Map<string, Bot> = new Map()

    abstract getName(): ServiceName

    abstract createBot(name: string, config: BotConfig): Bot

    registerBot(name: string, token: string, config?: Partial<BotConfig>): this {
        if (this.bots.has(name)) {
            throw new Error(`Bot with name ${name} already registered`)
        }

        const fullConfig: BotConfig = {
            token,
            ...config,
        } as BotConfig

        const bot = this.createBot(name, fullConfig)
        this.bots.set(name, bot)

        return this
    }

    getBots(): string[] {
        return Array.from(this.bots.keys())
    }

    getBot(name: string): Bot {
        const bot = this.bots.get(name)
        if (!bot) {
            throw new Error(`Bot ${name} not found`)
        }

        return bot
    }
}
