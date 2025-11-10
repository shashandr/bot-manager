"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBot = void 0;
const telegraf_1 = require("telegraf");
const types_1 = require("../../types/index.js");
class TelegramBot extends types_1.Bot {
    createInstance(token) {
        return new telegraf_1.Telegraf(token);
    }
    async sendMessage(chatId, text, options) {
        const bot = this.instance;
        const extra = {};
        extra.parse_mode = options?.parseMode || 'html';
        if (options?.buttons && options.buttons.length > 0) {
            const keyboards = this.prepareKeyboard(options.buttons);
            keyboards && Object.assign(extra, keyboards);
        }
        await bot.telegram.sendMessage(chatId, this.prepareMessageText(text, extra.parse_mode), extra);
        return true;
    }
    async sendFile(chatId, file, caption, options) {
        const extra = {};
        const bot = this.instance;
        const fileName = typeof file === 'string' ? file : file.filename;
        if (!fileName) {
            return false;
        }
        const fileType = this.getMediaType(fileName);
        extra.parse_mode = options?.parseMode || 'html';
        if (fileType === 'image') {
            await bot.telegram.sendPhoto(chatId, file, { caption: this.prepareMessageText(caption || '', extra.parse_mode) });
        }
        else {
            await bot.telegram.sendDocument(chatId, file, { caption: this.prepareMessageText(caption || '', extra.parse_mode) });
        }
        return true;
    }
    async editMessage(chatId, messageId, text, options) {
        const bot = this.instance;
        const extra = {};
        extra.parse_mode = options?.parseMode || 'html';
        await bot.telegram.editMessageText(chatId, messageId, undefined, this.prepareMessageText(text || '', extra.parse_mode));
        return true;
    }
    async editCaption(chatId, messageId, caption, options) {
        const bot = this.instance;
        const extra = {};
        extra.parse_mode = options?.parseMode || 'html';
        await bot.telegram.editMessageCaption(chatId, messageId, undefined, this.prepareMessageText(caption || '', extra.parse_mode));
        return true;
    }
    async getUpdate(options) {
        const bot = this.instance;
        // Используем прямой вызов Telegram Bot API через callApi
        const params = {};
        if (options?.offset !== undefined)
            params.offset = options.offset;
        if (options?.limit !== undefined)
            params.limit = options.limit;
        if (options?.timeout !== undefined)
            params.timeout = options.timeout;
        if (options?.allowedUpdates)
            params.allowed_updates = options.allowedUpdates;
        return bot.telegram.callApi('getUpdates', params);
    }
    onStart() {
        this.instance.on('message', async (ctx) => {
            await this.handleWebhook(ctx.update);
        });
        this.instance.on('callback_query', async (ctx) => {
            await this.handleWebhook(ctx.callbackQuery);
        });
        this.instance.launch();
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
                contact: data.message?.contact ? { phone: data.message.contact.phone_number } : undefined,
                location: data.message?.location ? data.message.location : undefined,
                text: data.message.text,
                timestamp: data.message.date,
            },
            callback: callbackData ? { data: callbackData } : undefined,
            raw: data,
        };
    }
    prepareKeyboard(buttons) {
        const result = {};
        const keyboardButtons = [];
        const inlineKeyboardButtons = [];
        buttons.forEach((btn) => {
            if (btn?.type) {
                switch (btn.type) {
                    case 'request_contact':
                        keyboardButtons.push(telegraf_1.Markup.button.contactRequest(btn.text));
                        break;
                    case 'link':
                        const url = btn?.payload?.url;
                        if (typeof url === 'string' && url.length > 0) {
                            inlineKeyboardButtons.push(telegraf_1.Markup.button.url(btn.text, url));
                        }
                        break;
                    case 'location':
                        keyboardButtons.push(telegraf_1.Markup.button.locationRequest(btn.text));
                        break;
                    default:
                        const callbackData = this.toCallbackData(btn?.payload, btn.text);
                        inlineKeyboardButtons.push(telegraf_1.Markup.button.callback(btn.text, callbackData));
                }
            }
        });
        if (keyboardButtons.length) {
            const keyboard = telegraf_1.Markup
                .keyboard(keyboardButtons)
                .resize(true)
                .oneTime(true);
            Object.assign(result, keyboard);
        }
        if (inlineKeyboardButtons.length) {
            const inlineKeyboard = telegraf_1.Markup.inlineKeyboard([inlineKeyboardButtons]);
            Object.assign(result, inlineKeyboard);
        }
        return result;
    }
    toCallbackData(value, fallback) {
        let data;
        if (typeof value === 'string')
            data = value;
        else if (typeof value === 'number' || typeof value === 'boolean')
            data = String(value);
        else if (value != null)
            data = JSON.stringify(value);
        else
            data = fallback;
        // Telegram limit for callback_data is 1-64 bytes; keep it simple with char limit
        if (data.length > 64)
            data = data.slice(0, 64);
        return data;
    }
}
exports.TelegramBot = TelegramBot;
