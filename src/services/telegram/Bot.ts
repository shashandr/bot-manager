import { Context, Markup, Telegraf } from "telegraf"
import { InputFile } from "telegraf/types"
import {
    Bot as BaseBot,
    BotMessageButton,
    BotMessageOptions,
    GetUpdateOptions,
    BotWebhookUpdate,
} from "~/types"

export class TelegramBot extends BaseBot {
    protected createInstance(token: string): Telegraf<Context> {
        return new Telegraf(token)
    }

    async sendMessage(chatId: number | string, text: string, options?: BotMessageOptions): Promise<boolean> {
        const bot = this.instance as Telegraf<Context>
        const extra: Record<string, unknown> = {}

        extra.parse_mode = options?.parseMode || this.defaultParseMode
        extra.disable_notification = options?.disableNotification || false

        if (options?.buttons && options.buttons.length > 0) {
            const keyboards = this.prepareKeyboard(options.buttons)
            keyboards && Object.assign(extra, keyboards)
        }

        await bot.telegram.sendMessage(chatId, this.prepareMessageText(text, extra.parse_mode as string), extra)

        return true
    }

    async sendFile(chatId: number | string, file: InputFile | string, caption?: string, options?: BotMessageOptions): Promise<boolean> {
        const extra: Record<string, unknown> = {}
        const bot = this.instance as Telegraf<Context>
        const fileName = typeof file === 'string' ? file : file.filename

        if (!fileName) {
            return false
        }

        const fileType = this.getMediaType(fileName)

        extra.parse_mode = options?.parseMode || this.defaultParseMode
        extra.caption = this.prepareMessageText(caption || '', extra.parse_mode as string)
        extra.disable_notification = options?.disableNotification || false

        if (options?.buttons && options.buttons.length > 0) {
            const keyboards = this.prepareKeyboard(options.buttons)
            keyboards && Object.assign(extra, keyboards)
        }

        if (fileType && ['image', 'photo'].includes(fileType)) {
            await bot.telegram.sendPhoto(chatId, file, extra)
        } else {
            await bot.telegram.sendDocument(chatId, file, extra)
        }

        return true
    }

    async editMessage(chatId: number | string, messageId: number, text: string, options?: BotMessageOptions): Promise<boolean> {
        const bot = this.instance as Telegraf<Context>

        const extra: Record<string, unknown> = {}
        extra.parse_mode = options?.parseMode || this.defaultParseMode
        extra.disable_notification = options?.disableNotification || true

        await bot.telegram.editMessageText(chatId, messageId, undefined, this.prepareMessageText(text || '', extra.parse_mode as string), extra)

        return true
    }

    async editCaption(chatId: number | string, messageId: number, caption: string, options?: BotMessageOptions): Promise<boolean> {
        const bot = this.instance as Telegraf<Context>

        const extra: Record<string, unknown> = {}
        extra.parse_mode = options?.parseMode || this.defaultParseMode
        extra.disable_notification = options?.disableNotification || true

        await bot.telegram.editMessageCaption(chatId, messageId, undefined, this.prepareMessageText(caption || '', extra.parse_mode as string), extra)

        return true
    }

    async getUpdate(options?: GetUpdateOptions): Promise<any> {
        const bot = this.instance as Telegraf<Context>

        // Используем прямой вызов Telegram Bot API через callApi
        const params: Record<string, unknown> = {}

        if (options?.offset !== undefined) params.offset = options.offset
        if (options?.limit !== undefined) params.limit = options.limit
        if (options?.timeout !== undefined) params.timeout = options.timeout
        if (options?.allowedUpdates) params.allowed_updates = options.allowedUpdates

        return (bot.telegram as any).callApi('getUpdates', params)
    }

    protected onStart() {
        this.instance.on('message', async (ctx: any) => {
            await this.handleWebhook(ctx.update)
        })
        this.instance.on('callback_query', async (ctx: any) => {
            await this.handleWebhook(ctx.callbackQuery)
        })
        this.instance.launch()
    }

    protected convertWebhookUpdate(data: any): BotWebhookUpdate {
        let type: BotWebhookUpdate['type'] = 'text'
        let commandData: any = undefined
        let callbackData: any = undefined

        if (data?.data) {
            callbackData = JSON.parse(data.data)
            if (callbackData) {
                type = 'callback'
            }
        } else if (data.message?.text && data.message.text.startsWith('/')) {
            type = 'command'

            const commandParts = data.message.text.includes(' ')
                ? data.message.text.split(' ')
                : [data.message.text, null]

            commandData = {
                name: commandParts[0].replace('/', ''),
                value: commandParts[1],
            }
        } else if (data.message?.contact) {
            type = 'contact'
        } else if (data.message?.location) {
            type = 'location'
        }

        return {
            type,
            sender: {
                id: data.message.from.id,
                firstName: data.message.from.first_name,
                lastName: data.message.from.last_name,
                username: data.message.from.username,
                isBot: data.message.from.is_bot,
            },
            chat: {
                id: data.message.chat.id,
                type: data.message.chat.type,
            },
            message: {
                id: data.message.message_id,
                timestamp: data.message.date,
                text: data.message.text || data.message.caption,
            },
            contact: data.message?.contact
                ? {
                    phone: data.message.contact.phone_number,
                    sender: data.message.contact.user_id === data.message.from.id,
                }
                : undefined,
            location: data.message?.location ? data.message.location : undefined,
            command: commandData,
            callback: callbackData ? { data: callbackData } : undefined,
        }
    }

    private prepareKeyboard(buttons: BotMessageButton[]): any {
        const result: any = {}
        const keyboardButtons: any = []
        const inlineKeyboardButtons: any = []

        buttons.forEach((btn: BotMessageButton) => {
            if (btn?.type) {
                switch (btn.type) {
                    case 'request_contact':
                        keyboardButtons.push(Markup.button.contactRequest(btn.text))
                        break
                    case 'link':
                        const url = (btn as any)?.payload?.url
                        if (typeof url === 'string' && url.length > 0) {
                            inlineKeyboardButtons.push(Markup.button.url(btn.text, url))
                        }
                        break
                    case 'location':
                        keyboardButtons.push(Markup.button.locationRequest(btn.text))
                        break
                    default:
                        const callbackData = this.toCallbackData((btn as any)?.payload, btn.text)
                        inlineKeyboardButtons.push(Markup.button.callback(btn.text, callbackData))
                }
            }
        })

        if (keyboardButtons.length) {
            const keyboard = Markup
                .keyboard(keyboardButtons)
                .resize(true)
                .oneTime(true)
            Object.assign(result, keyboard)
        }
        if (inlineKeyboardButtons.length) {
            const inlineKeyboard = Markup.inlineKeyboard([inlineKeyboardButtons])
            Object.assign(result, inlineKeyboard)
        }

        return result
    }
}