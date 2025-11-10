import { Bot as MaxBotApi } from '@maxhub/max-bot-api'
import { Bot as BaseBot, BotMessageOptions, GetUpdateOptions, BotWebhookUpdate } from "~/types"

export class MaxBot extends BaseBot {
    protected createInstance(token: string): MaxBotApi {
        return new MaxBotApi(token)
    }

    async sendMessage(chatId: number | string, text: string, options?: BotMessageOptions): Promise<boolean> {
        const bot = this.instance as MaxBotApi
        const extra: Record<string, unknown> = {}

        if (options?.parseMode) extra.parse_mode = options.parseMode
        if (options?.buttons) {
            Object.assign(extra, {
                type: 'inline_keyboard',
                payload: { buttons: [options.buttons] },
            })
        }

        const isChat = typeof chatId === 'string' && chatId.startsWith('-')

        isChat
            ? await bot.api.sendMessageToChat(Number(chatId), text, extra)
            : await bot.api.sendMessageToUser(Number(chatId), text, extra)

        return true
    }

    async sendFile(chatId: number | string, file: any, caption?: string): Promise<boolean> {
        const bot = this.instance as MaxBotApi
        const fileName = typeof file === 'string' ? file : file.filename
        if (!fileName) {
            return false
        }
        const fileType = this.getMediaType(fileName)
        let attachment

        if (fileType === 'image') {
            attachment = await bot.api.uploadImage({ file } as any)
        } else {
            attachment = await bot.api.uploadFile({ file } as any)
        }

        await bot.api.sendMessageToChat(Number(chatId), caption || '', {
            attachments: [attachment as any],
        } as any)

        return true
    }

    editCaption(chatId: number | string, messageId: number, caption: string, options?: BotMessageOptions): Promise<boolean> {
        return Promise.resolve(false);
    }

    editMessage(chatId: number | string, messageId: number, text: string, options?: BotMessageOptions): Promise<boolean> {
        return Promise.resolve(false);
    }

    async getUpdate(options?: GetUpdateOptions): Promise<any> {
        const bot = this.instance as MaxBotApi

        // Max Bot API может иметь метод getUpdates
        // Если нет, используем альтернативный подход через API
        if (typeof (bot.api as any).getUpdates === 'function') {
            const params: Record<string, unknown> = {}

            if (options?.offset !== undefined) params.offset = options.offset
            if (options?.limit !== undefined) params.limit = options.limit
            if (options?.timeout !== undefined) params.timeout = options.timeout
            if (options?.allowedUpdates) params.allowed_updates = options.allowedUpdates

            return (bot.api as any).getUpdates(params)
        }

        // Если метод недоступен, возвращаем ошибку или пустой массив
        throw new Error(
            'getUpdates method is not available in Max Bot API. Max bot uses webhook-based updates.'
        )
    }

    onStart() {

    }

    convertWebhookUpdate(data: any): BotWebhookUpdate {
        let type: BotWebhookUpdate['type'] = 'text'
        let callbackData: undefined

        if (data?.data) {
            callbackData = JSON.parse(data.data)
            if (callbackData) {
                type = 'callback'
            }
        } else if (data.message?.text && data.message.text.startsWith('/')) {
            type = 'command'
        } else if (data.message?.contact) {
            type = 'contact'
        } else if (data.message?.location) {
            type = 'location'
        }

        return {
            type,
            message: {
                id: data.message.message_id,
                sender: {
                    id: data.message.sender.user_id,
                    firstName: data.message.sender.first_name,
                    lastName: data.message.sender.last_name,
                    username: data.message.sender.username,
                    isBot: data.message.sender.is_bot,
                },
                chat: {
                    id: data.message.chat.id,
                },
                text: data.message.text,
                timestamp: data.message.date,
            },
            callback: callbackData ? { data: callbackData } : undefined,
            raw: data,
        }
    }
}