import { BotWebhook, BotWebhookUpdate } from './webhook'
import { BotEvent } from './event'

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

export interface GetUpdateOptions {
    offset?: number
    limit?: number
    timeout?: number
    allowedUpdates?: string[]
}

export abstract class Bot {
    protected name: string
    protected config: BotConfig
    protected events: Map<string, BotEvent> = new Map()
    protected webhook?: BotWebhook
    protected instance: any

    constructor(name: string, config: BotConfig, events: BotEvent[] = []) {
        this.name = name
        this.config = config
        this.instance = this.createInstance(config.token)

        events.forEach((event: BotEvent) => {
            this.registerEvent(event)
        })
    }

    protected abstract createInstance(token: string): any

    getName() {
        return this.name
    }

    abstract sendMessage(
        chatId: number | string,
        text: string,
        options?: BotMessageOptions
    ): Promise<any>

    abstract sendFile(chatId: number | string, file: any, caption?: string): Promise<any>

    abstract getUpdate(options?: GetUpdateOptions): Promise<any>

    abstract onStart(): void

    abstract convertWebhookUpdate(update: any): BotWebhookUpdate

    getInstance() {
        return this.instance
    }

    getConfig(): BotConfig {
        return this.config
    }

    getEvents(): string[] {
        return Array.from(this.events.keys())
    }

    registerEvent(event: BotEvent): this {
        this.events.set(event.getName(), event)

        return this
    }

    async handleEvent(eventName: string, payload: unknown): Promise<void> {
        const event = this.events.get(eventName)

        if (!event) {
            throw new Error(
                `Event handler for '${eventName}' not registered for bot '${this.name}'`
            )
        }

        await event.handle(this, payload)
    }

    registerWebhook(webhook: BotWebhook): this {
        this.webhook = webhook

        return this
    }

    async handleWebhook(update: any): Promise<void> {
        if (!this.webhook) {
            return
        }

        const payload = this.convertWebhookUpdate(update)
        const handler = this.webhook.getHandler(payload)

        if (handler) {
            await handler(this, payload)
        } else {
            const unknownHandler = (this.webhook as any).handleUnknown
            if (typeof unknownHandler === 'function') {
                await unknownHandler.call(this.webhook, this, payload)
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

    start(webhook: BotWebhook): void {
        this.registerWebhook(webhook)
        if (this.webhook) {
            this.onStart()
        }
    }
}