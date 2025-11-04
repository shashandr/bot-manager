import { Telegraf, Context, Markup } from 'telegraf'
import { InputFile } from 'telegraf/types'
import {
    MessengerService,
    ServiceName,
    BotConfig,
    BotMessageButton,
    BotMessageOptions,
    Bot,
    GetUpdateOptions,
} from '../types'
import { getFileType } from '~/lib/strings'

class TelegramBot extends Bot {
    protected createInstance(token: string): Telegraf<Context> {
        return new Telegraf(token)
    }

    private toCallbackData(value: unknown, fallback: string): string {
        let data: string
        if (typeof value === 'string') data = value
        else if (typeof value === 'number' || typeof value === 'boolean') data = String(value)
        else if (value != null) data = JSON.stringify(value)
        else data = fallback
        // Telegram limit for callback_data is 1-64 bytes; keep it simple with char limit
        if (data.length > 64) data = data.slice(0, 64)

        return data
    }

    async sendMessage(
        chatId: number | string,
        text: string,
        options?: BotMessageOptions
    ): Promise<any> {
        const bot = this.instance as Telegraf<Context>
        const extra: Record<string, unknown> = {}

        if (options?.parseMode) extra.parse_mode = options.parseMode
        if (options?.buttons && options.buttons.length > 0) {
            const row = options.buttons
                .map((btn: BotMessageButton) => {
                    if (btn?.type === 'link') {
                        const url = (btn as any)?.payload?.url
                        if (typeof url === 'string' && url.length > 0) {
                            return Markup.button.url(btn.text, url)
                        }

                        return null
                    }
                    // default to callback
                    const callbackData = this.toCallbackData((btn as any)?.payload, btn.text)

                    return Markup.button.callback(btn.text, callbackData)
                })
                .filter(Boolean) as any[]
            if (row.length > 0) Object.assign(extra, Markup.inlineKeyboard([row]))
        }

        return bot.telegram.sendMessage(chatId, text, extra)
    }

    async sendFile(
        chatId: number | string,
        file: InputFile | string,
        caption?: string
    ): Promise<any> {
        const bot = this.instance as Telegraf<Context>
        const fileType = getFileType(file)

        if (fileType === 'image') {
            return bot.telegram.sendPhoto(chatId, file, { caption })
        } else {
            return bot.telegram.sendDocument(chatId, file, { caption })
        }
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
}

export class Service extends MessengerService {
    getName(): ServiceName {
        return 'tg'
    }

    createBot(name: string, config: BotConfig): Bot {
        return new TelegramBot(name, config)
    }
}
