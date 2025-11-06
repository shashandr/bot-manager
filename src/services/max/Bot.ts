import { Bot as MaxBotApi } from '@maxhub/max-bot-api'
import { Bot as BaseBot, BotMessageOptions, GetUpdateOptions } from "~/services/types"
import { BotWebhookUpdate } from "~/webhooks/types"
import { getFileType } from "~/lib/strings"

export class MaxBot extends BaseBot {
    protected createInstance(token: string): MaxBotApi {
        return new MaxBotApi(token)
    }

    async sendMessage(
        chatId: number | string,
        text: string,
        options?: BotMessageOptions
    ): Promise<any> {
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

        return isChat
            ? bot.api.sendMessageToChat(Number(chatId), text, extra)
            : bot.api.sendMessageToUser(Number(chatId), text, extra)
    }

    async sendFile(chatId: number | string, file: any, caption?: string): Promise<any> {
        const bot = this.instance as MaxBotApi
        const fileType = getFileType(file)
        let attachment

        if (fileType === 'image') {
            attachment = await bot.api.uploadImage({ file } as any)
        } else {
            attachment = await bot.api.uploadFile({ file } as any)
        }

        return bot.api.sendMessageToChat(Number(chatId), caption || '', {
            attachments: [attachment as any],
        } as any)
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

    start() {

    }

    convertWebhookUpdate(data: any): BotWebhookUpdate {
        return {
            type: 'command',
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
            raw: data,
        }
    }
}