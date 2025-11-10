"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxBot = void 0;
const max_bot_api_1 = require("@maxhub/max-bot-api");
const types_1 = require("../../types/index.js");
class MaxBot extends types_1.Bot {
    createInstance(token) {
        return new max_bot_api_1.Bot(token);
    }
    async sendMessage(chatId, text, options) {
        const bot = this.instance;
        const extra = {};
        if (options?.parseMode)
            extra.parse_mode = options.parseMode;
        if (options?.buttons) {
            Object.assign(extra, {
                type: 'inline_keyboard',
                payload: { buttons: [options.buttons] },
            });
        }
        const isChat = typeof chatId === 'string' && chatId.startsWith('-');
        isChat
            ? await bot.api.sendMessageToChat(Number(chatId), text, extra)
            : await bot.api.sendMessageToUser(Number(chatId), text, extra);
        return true;
    }
    async sendFile(chatId, file, caption) {
        const bot = this.instance;
        const fileName = typeof file === 'string' ? file : file.filename;
        if (!fileName) {
            return false;
        }
        const fileType = this.getMediaType(fileName);
        let attachment;
        if (fileType === 'image') {
            attachment = await bot.api.uploadImage({ file });
        }
        else {
            attachment = await bot.api.uploadFile({ file });
        }
        await bot.api.sendMessageToChat(Number(chatId), caption || '', {
            attachments: [attachment],
        });
        return true;
    }
    editCaption(chatId, messageId, caption, options) {
        return Promise.resolve(false);
    }
    editMessage(chatId, messageId, text, options) {
        return Promise.resolve(false);
    }
    async getUpdate(options) {
        const bot = this.instance;
        // Max Bot API может иметь метод getUpdates
        // Если нет, используем альтернативный подход через API
        if (typeof bot.api.getUpdates === 'function') {
            const params = {};
            if (options?.offset !== undefined)
                params.offset = options.offset;
            if (options?.limit !== undefined)
                params.limit = options.limit;
            if (options?.timeout !== undefined)
                params.timeout = options.timeout;
            if (options?.allowedUpdates)
                params.allowed_updates = options.allowedUpdates;
            return bot.api.getUpdates(params);
        }
        // Если метод недоступен, возвращаем ошибку или пустой массив
        throw new Error('getUpdates method is not available in Max Bot API. Max bot uses webhook-based updates.');
    }
    onStart() {
    }
    convertWebhookUpdate(data) {
        let type = 'text';
        let callbackData;
        if (data?.data) {
            callbackData = JSON.parse(data.data);
            if (callbackData) {
                type = 'callback';
            }
        }
        else if (data.message?.text && data.message.text.startsWith('/')) {
            type = 'command';
        }
        else if (data.message?.contact) {
            type = 'contact';
        }
        else if (data.message?.location) {
            type = 'location';
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
        };
    }
}
exports.MaxBot = MaxBot;
