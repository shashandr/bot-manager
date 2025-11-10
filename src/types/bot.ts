import { BotWebhook, BotWebhookUpdate } from './webhook'
import { BotEvent } from './event'
import { pregMatchAll, stripTags } from '~/lib/strings'
import { getFileType } from '~/lib/files'

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

    getInstance() {
        return this.instance
    }

    getConfig(): BotConfig {
        return this.config
    }

    abstract sendMessage(chatId: number | string, text: string, options?: BotMessageOptions): Promise<boolean>

    abstract sendFile(chatId: number | string, file: any, caption?: string, options?: BotMessageOptions): Promise<boolean>

    abstract editMessage(chatId: number | string, messageId: number, text: string, options?: BotMessageOptions): Promise<boolean>

    abstract editCaption(chatId: number | string, messageId: number, caption: string, options?: BotMessageOptions): Promise<boolean>

    abstract getUpdate(options?: GetUpdateOptions): Promise<any>

    abstract onStart(): void

    abstract convertWebhookUpdate(update: any): BotWebhookUpdate

    async addMessageTag(chatId: number | string, messageId: number, text: string, tag: string, options?: BotMessageOptions): Promise<boolean> {
        text = this.appendTag(text, tag)

        return await this.editMessage(chatId, messageId, text, options)
    }

    async addFileTag(chatId: number | string, messageId: number, caption: string, tag: string, options?: BotMessageOptions): Promise<boolean> {
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

    getMediaType(fileName: string): string | null {
        return getFileType(fileName)
    }

    start(webhook: BotWebhook): void {
        this.registerWebhook(webhook)
        if (this.webhook) {
            this.onStart()
        }
    }
}