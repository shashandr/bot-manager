import { BotWebhook, BotWebhookUpdate } from './webhook'
import { BotEvent } from './event'
import { pregMatchAll, stripTags } from '~/lib/strings'
import { getFileType } from '~/lib/files'
import { MessengerService } from "~/types/service";

export interface BotInstanceConfig {
    proxy?: {
        url: string
    }
}

export interface BotConfig {
    token: string
    secret?: string
    instance?: BotInstanceConfig
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

export interface BotSubscriptionOptions {
    url: string
    types?: string[]
}


export abstract class Bot {
    protected readonly name: string
    protected readonly serviceName?: string
    protected readonly config: BotConfig
    protected readonly instance: any
    protected events: Map<string, BotEvent> = new Map()
    protected webhook?: BotWebhook
    protected defaultParseMode = 'html'
    protected pollingMode = false

    constructor(name: string, config: BotConfig, events: BotEvent[] = [], service?: MessengerService) {
        this.name = name
        if (service) {
            this.serviceName = service.getName()
        }
        this.config = config
        this.instance = this.createInstance(config.token, config?.instance)

        events.forEach((event: BotEvent) => {
            this.registerEvent(event)
        })
    }

    protected abstract createInstance(token: string, config?: BotInstanceConfig): any

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

    protected abstract onSubscribe(url: string, types?: string[]): Promise<boolean>

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected verifySecret(headers: Record<string, string | string[] | undefined>): boolean {
        return true
    }

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

    async handleWebhook(body: any, headers: Record<string, string | string[] | undefined> = {}): Promise<void> {
        if (!this.webhook) {
            return
        }

        try {
            if (!this.verifySecret(headers)) {
                throw new Error('Invalid webhook secret')
            }

            const payload = this.convertWebhookUpdate(body)
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
            const errorMsg = `Handle webhook error for bot '${this.serviceName}:${this.name}': ${(err as Error).message}`
            if (this.pollingMode) {
                console.error(errorMsg)
            } else {
                throw new Error(errorMsg)
            }
        }
    }

    getMediaType(fileName: string): string | null {
        return getFileType(fileName)
    }

    async start(webhook: BotWebhook, subscriptionOptions?: BotSubscriptionOptions): Promise<void> {
        this.registerWebhook(webhook)

        if (!this.webhook) {
            return
        }

        try {
            if (subscriptionOptions) {
                const ok = await this.onSubscribe(subscriptionOptions.url, subscriptionOptions.types)
                if (!ok) {
                    throw new Error('Subscription was not confirmed by messenger API')
                }
            } else {
                this.pollingMode = true
                this.onStart()
            }
        } catch (err) {
            throw new Error(`Webhook start error for bot '${this.serviceName}:${this.name}': ${(err as Error).message}`)
        }
    }
}