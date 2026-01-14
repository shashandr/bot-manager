import { Bot as MaxBotApi, Keyboard } from '@maxhub/max-bot-api'
import { Bot as BaseBot, BotMessageOptions, GetUpdateOptions, BotWebhookUpdate, BotMessageButton } from '~/types'
import { ActionResponse, Message } from '@maxhub/max-bot-api/dist/core/network/api'
import { MediaAttachment } from '@maxhub/max-bot-api/dist/core/helpers/attachments'
import { splitFirst, vcfExtractPhone } from '~/lib/strings'
import { downloadToTemp } from '~/lib/files'
import * as fs from 'fs'

export class MaxBot extends BaseBot {
    protected createInstance(token: string): MaxBotApi {
        return new MaxBotApi(token)
    }

    async sendMessage(chatId: number | string, text: string, options?: BotMessageOptions): Promise<boolean> {
        const bot = this.instance as MaxBotApi
        const extra: Record<string, unknown> = {}

        extra.format = options?.parseMode || this.defaultParseMode
        extra.notify = !options?.disableNotification

        if (options?.buttons && options.buttons.length > 0) {
            const keyboard = this.prepareKeyboard(options.buttons)
            keyboard && Object.assign(extra, { attachments: [ keyboard ] })
        }

        const isGroup = typeof chatId === 'string' && chatId.startsWith('-')

        text = this.prepareMessageText(text, extra.format as string)

        isGroup
            ? await bot.api.sendMessageToChat(Number(chatId), text, extra)
            : await bot.api.sendMessageToUser(Number(chatId), text, extra)

        return true
    }

    async sendFile(chatId: number | string, file: any, caption?: string, options?: BotMessageOptions): Promise<boolean> {
        const bot = this.instance as MaxBotApi
        const extra: Record<string, unknown> = {}

        const fileName = typeof file === 'string' ? file : file.filename
        if (!fileName) {
            return false
        }
        const fileType = this.getMediaType(fileName)
        const isUrl = typeof file === 'string' && /^https?:\/\//i.test(file)
        let attachment: MediaAttachment | null = null
        let tempPath: string | null = null

        try {
            if (fileType && ['image', 'photo'].includes(fileType) && isUrl) {
                attachment = await bot.api.uploadImage({ url: file })
            } else {
                const sourcePath = isUrl ? await downloadToTemp(file) : file
                tempPath = isUrl ? sourcePath : null

                if (fileType === 'audio') {
                    attachment = await bot.api.uploadAudio({ source: sourcePath })
                } else if (fileType === 'video') {
                    attachment = await bot.api.uploadVideo({ source: sourcePath })
                } else {
                    attachment = await bot.api.uploadFile({ source: sourcePath })
                }
            }
        } catch (err) {
            throw err
        } finally {
            if (tempPath) {
                fs.promises.unlink(tempPath).catch(() => {})
            }
        }

        if (!attachment) {
            return false
        }

        extra.format = options?.parseMode || this.defaultParseMode
        extra.notify = !options?.disableNotification
        extra.attachments = [attachment.toJson()]

        if (options?.buttons && options.buttons.length > 0) {
            const keyboard = this.prepareKeyboard(options.buttons)
            // @ts-ignore
            keyboard && extra.attachments.push(keyboard)
        }

        const isGroup = typeof chatId === 'string' && chatId.startsWith('-')

        caption = this.prepareMessageText(caption || '', extra.format as string)

        isGroup
            ? await bot.api.sendMessageToChat(Number(chatId), caption, extra)
            : await bot.api.sendMessageToUser(Number(chatId), caption, extra)

        return true
    }

    async editMessage(chatId: number | string, messageId: string, text: string, options?: BotMessageOptions): Promise<boolean> {
        const bot = this.instance as MaxBotApi
        const extra: Record<string, unknown> = {}

        const message: Message = await bot.api.getMessage(messageId)

        extra.format = options?.parseMode || this.defaultParseMode
        extra.notify = options?.disableNotification
        extra.text = this.prepareMessageText(text, extra.format as string)
        extra.attachments = message.body.attachments
            ? message.body.attachments.filter(attachment => attachment.type !== 'inline_keyboard')
            : []

        const response: ActionResponse = await bot.api.editMessage(messageId, extra)

        return response.success
    }

    async editCaption(chatId: number | string, messageId: string, caption: string, options?: BotMessageOptions): Promise<boolean> {
        return await this.editMessage(chatId, messageId, caption, options)
    }

    async getUpdate(options?: GetUpdateOptions): Promise<any> {
        // Max Bot API может иметь метод getUpdates
        // Если нет, используем альтернативный подход через API
        if (typeof this.instance.api.getUpdates === 'function') {
            const params: Record<string, unknown> = {}

            if (options?.offset !== undefined) params.offset = options.offset
            if (options?.limit !== undefined) params.limit = options.limit
            if (options?.timeout !== undefined) params.timeout = options.timeout
            if (options?.allowedUpdates) params.allowed_updates = options.allowedUpdates

            return this.instance.api.getUpdates(params)
        }

        // Если метод недоступен, возвращаем ошибку или пустой массив
        throw new Error(
            'getUpdates method is not available in Max Bot API. Max bot uses webhook-based updates.'
        )
    }

    private prepareKeyboard(buttons: BotMessageButton[]): any {
        const inlineKeyboardButtons: any = []

        buttons.forEach((btn: BotMessageButton) => {
            if (btn?.type) {
                switch (btn.type) {
                    case 'request_contact':
                        inlineKeyboardButtons.push(Keyboard.button.requestContact(btn.text))
                        break
                    case 'link':
                        const url = (btn as any)?.payload?.url
                        if (typeof url === 'string' && url.length > 0) {
                            inlineKeyboardButtons.push(Keyboard.button.link(btn.text, url))
                        }
                        break
                    case 'location':
                        inlineKeyboardButtons.push(Keyboard.button.requestGeoLocation(btn.text))
                        break
                    default:
                        const callbackData = this.toCallbackData((btn as any)?.payload, btn.text)
                        inlineKeyboardButtons.push(Keyboard.button.callback(btn.text, callbackData))
                }
            }
        })

        if (inlineKeyboardButtons.length) {
            return Keyboard.inlineKeyboard([inlineKeyboardButtons])
        }

        return null
    }

    protected onStart() {
        this.instance.on('bot_started', async (ctx: any) => {
            await this.handleWebhook(ctx.update)
        })
        this.instance.on('message_created', async (ctx: any) => {
            await this.handleWebhook(ctx.update)
        })
        this.instance.on('message_callback', async (ctx: any) => {
            await this.handleWebhook(ctx.update)
        })
        this.instance.start()
    }

    protected convertWebhookUpdate(data: any): BotWebhookUpdate {
        let type: BotWebhookUpdate['type'] = 'text'
        let commandData: any = undefined
        let callbackData: any = undefined
        let contact = undefined
        let location = undefined
        let sender = data?.message?.sender

        if (data?.update_type === 'message_callback') {
            type = 'callback'
            sender = data.callback.user
            callbackData = data.callback.payload.startsWith('{') ? JSON.parse(data.callback.payload) : data.callback.payload
        } else if (data?.update_type === 'bot_started') {
            type = 'command'
            sender = data.user
            commandData = {
                name: 'start',
                value: data.payload,
            }
        } else if (data.message?.body.text && data.message.body.text.startsWith('/')) {
            type = 'command'
            const commandParts = data.message.body.text.includes('=')
                ? splitFirst(data.message.body.text, '=')
                : [data.message.body.text, null]
            commandData = {
                name: commandParts[0].replace('/', ''),
                value: commandParts[1],
            }
        } else if (data.message.body?.attachments) {
            data.message.body.attachments.forEach((attachment: any) => {
                switch (attachment.type) {
                    case 'contact':
                        type = 'contact'
                        contact = {
                            phone: vcfExtractPhone(attachment.payload.vcf_info),
                            sender: attachment.payload.max_info.user_id === data.message.sender.user_id,
                        }
                        break
                    case 'location':
                        type = 'location'
                        location = {
                            latitude: attachment.latitude,
                            longitude: attachment.longitude,
                        }
                        break
                }
            })
        }

        return {
            type,
            sender: {
                id: sender.user_id,
                firstName: sender.first_name,
                lastName: sender.last_name,
                username: sender?.username,
                isBot: sender.is_bot,
            },
            chat: {
                id: data?.message?.recipient.chat_id || data.chat_id,
            },
            message: data?.message?.body
                ? {
                    id: data.message.body.mid,
                    text: data.message.body.text,
                    timestamp: data.message.timestamp,
                }
                : undefined,
            contact,
            location,
            command: commandData,
            callback: callbackData ? { data: callbackData } : undefined,
        }
    }
}