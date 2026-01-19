import { BotWebhook, BotWebhookUpdate } from './webhook'
import { BotEvent } from './event'
import { pregMatchAll, stripTags } from '~/lib/strings'
import { getFileType } from '~/lib/files'
import { MessengerService } from "~/types/service";

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
    disableNotification?: boolean
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
    protected readonly name: string
    protected readonly serviceName?: string
    protected readonly config: BotConfig
    protected readonly instance: any
    protected events: Map<string, BotEvent> = new Map()
    protected webhook?: BotWebhook
    protected defaultParseMode = 'html'

    constructor(name: string, config: BotConfig, events: BotEvent[] = [], service?: MessengerService) {
        this.name = name
        if (service) {
            this.serviceName = service.getName()
        }
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

    getServiceName(): string | undefined {
        return this.serviceName
    }

    getConfig(): BotConfig {
        return this.config
    }

    getInstance() {
        return this.instance
    }

    abstract sendMessage(chatId: number | string, text: string, options?: BotMessageOptions): Promise<boolean>

    abstract sendFile(chatId: number | string, file: any, caption?: string, options?: BotMessageOptions): Promise<boolean>

    abstract editMessage(chatId: number | string, messageId: number | string, text: string, options?: BotMessageOptions): Promise<boolean>

    abstract editCaption(chatId: number | string, messageId: number | string, caption: string, options?: BotMessageOptions): Promise<boolean>

    abstract getUpdate(options?: GetUpdateOptions): Promise<any>

    protected abstract onStart(): void

    protected abstract convertWebhookUpdate(update: any): BotWebhookUpdate

    async addMessageTag(chatId: number | string, messageId: number | string, text: string, tag: string, options?: BotMessageOptions): Promise<boolean> {
        text = this.appendTag(text, tag)

        return await this.editMessage(chatId, messageId, text, options)
    }

    async addFileTag(chatId: number | string, messageId: number | string, caption: string, tag: string, options?: BotMessageOptions): Promise<boolean> {
        caption = this.appendTag(caption, tag)

        return await this.editCaption(chatId, messageId, caption, options)
    }

    protected prepareMessageText(text: string, parseMode: string): string {
        if (parseMode === 'html') {
            return stripTags(text, ['p', 'br', 'a', 'b', 'i', 'u', 's', 'strong', 'strike', 'em', 'del', 'code', 'pre'])
                .replace(/<(p|br)\s?\/?>/gi, '\n')
                .replace(/<\/p>/gi, '')
        }

        return text
    }

    protected appendTag(text: string, tag: string): string {
        const matches = pregMatchAll(/#(.+?)[<br\s]/, text)
        if (matches.length) {
            const existTags = matches[1]
            if (!existTags?.length) {
                text = `#${tag}<br/><br/>${text}`
            } else if (!existTags.includes(tag)) {
                const lastTag = existTags[existTags.length - 1];
                text = text.replace(`#${lastTag}`, `#${lastTag} #${tag}`)
            }
        }

        return text
    }

    protected toCallbackData(value: unknown, fallback: string): string {
        let data: string
        if (typeof value === 'string') data = value
        else if (typeof value === 'number' || typeof value === 'boolean') data = String(value)
        else if (value != null) data = JSON.stringify(value)
        else data = fallback

        return data
    }

    getEvents(): string[] {
        return Array.from(this.events.keys())
    }

    registerEvent(event: BotEvent): this {
        event.bot = this
        this.events.set(event.getName(), event)

        return this
    }

    async handleEvent(eventName: string, payload: unknown): Promise<void> {
        const event = this.events.get(eventName)

        if (!event) {
            throw new Error(`Event handler for '${eventName}' not registered for bot '${this.serviceName}:${this.name}'`)
        }

        try {
            await event.handle(payload)
        } catch (err) {
            throw new Error(`Handle event '${eventName}' error for bot '${this.serviceName}:${this.name}': ${(err as Error).message}`)
        }
    }

    registerWebhook(webhook: BotWebhook): this {
        this.webhook = webhook
        this.webhook.bot = this

        return this
    }

    async handleWebhook(update: any): Promise<void> {
        if (!this.webhook) {
            return
        }

        try {
            const payload = this.convertWebhookUpdate(update)
            const handler = this.webhook.getHandler(payload)

            if (handler) {
                await handler(payload)
            } else {
                const unknownHandler = (this.webhook as any).handleUnknown
                if (typeof unknownHandler === 'function') {
                    await unknownHandler.call(this.webhook, payload)
                }
            }
        } catch (err) {
            throw new Error(`Handle webhook error for bot '${this.serviceName}:${this.name}': ${(err as Error).message}`)
        }
    }

    getMediaType(fileName: string): string | null {
        return getFileType(fileName)
    }

    start(webhook: BotWebhook): void {
        this.registerWebhook(webhook)

        if (!this.webhook) {
            return
        }

        try {
            this.onStart()
        } catch (err) {
            throw new Error(`Webhook start error for bot '${this.serviceName}:${this.name}': ${(err as Error).message}`)
        }
    }
}