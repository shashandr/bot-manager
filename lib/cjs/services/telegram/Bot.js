"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBot = void 0;
const telegraf_1 = require("telegraf");
const types_1 = require("../../types/index.js");
class TelegramBot extends types_1.Bot {
    createInstance(token, config) {
        let instanceConfig;
        if (config?.proxy) {
            instanceConfig = {
                telegram: {
                    apiRoot: config.proxy.url,
                },
            };
        }
        return new telegraf_1.Telegraf(token, instanceConfig);
    }
    async sendMessage(chatId, text, options) {
        const bot = this.instance;
        const extra = {};
        extra.parse_mode = options?.parseMode || this.defaultParseMode;
        extra.disable_notification = options?.disableNotification || false;
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
        extra.parse_mode = options?.parseMode || this.defaultParseMode;
        extra.caption = this.prepareMessageText(caption || '', extra.parse_mode);
        extra.disable_notification = options?.disableNotification || false;
        if (options?.buttons && options.buttons.length > 0) {
            const keyboards = this.prepareKeyboard(options.buttons);
            keyboards && Object.assign(extra, keyboards);
        }
        if (fileType && ['image', 'photo'].includes(fileType)) {
            await bot.telegram.sendPhoto(chatId, file, extra);
        }
        else {
            await bot.telegram.sendDocument(chatId, file, extra);
        }
        return true;
    }
    async editMessage(chatId, messageId, text, options) {
        const bot = this.instance;
        const extra = {};
        extra.parse_mode = options?.parseMode || this.defaultParseMode;
        extra.disable_notification = options?.disableNotification || true;
        await bot.telegram.editMessageText(chatId, messageId, undefined, this.prepareMessageText(text || '', extra.parse_mode), extra);
        return true;
    }
    async editCaption(chatId, messageId, caption, options) {
        const bot = this.instance;
        const extra = {};
        extra.parse_mode = options?.parseMode || this.defaultParseMode;
        extra.disable_notification = options?.disableNotification || true;
        await bot.telegram.editMessageCaption(chatId, messageId, undefined, this.prepareMessageText(caption || '', extra.parse_mode), extra);
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
    async onSubscribe(url, types) {
        const bot = this.instance;
        const result = await bot.telegram.callApi('setWebhook', {
            url,
            allowed_updates: types || ['message', 'callback_query'],
            ...(this.config.secret ? { secret_token: this.config.secret } : {}),
        });
        if (typeof result === 'boolean') {
            return result;
        }
        if (result && typeof result.ok === 'boolean') {
            return result.ok;
        }
        return false;
    }
    verifySecret(headers) {
        const expected = this.config.secret;
        if (!expected) {
            return true;
        }
        const header = headers['x-telegram-bot-api-secret-token'] || headers['X-Telegram-Bot-Api-Secret-Token'];
        if (Array.isArray(header)) {
            return header.includes(expected);
        }
        return header === expected;
    }
    convertWebhookUpdate(data) {
        if (data?.callback_query) {
            data = data.callback_query;
        }
        let type = 'text';
        let commandData = undefined;
        let callbackData = undefined;
        if (data?.data) {
            callbackData = JSON.parse(data.data);
            if (callbackData) {
                type = 'callback';
            }
        }
        else if (data.message?.text && data.message.text.startsWith('/')) {
            type = 'command';
            const commandParts = data.message.text.includes(' ')
                ? data.message.text.split(' ')
                : [data.message.text, null];
            commandData = {
                name: commandParts[0].replace('/', ''),
                value: commandParts[1],
            };
        }
        else if (data.message?.contact) {
            type = 'contact';
        }
        else if (data.message?.location) {
            type = 'location';
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
}
exports.TelegramBot = TelegramBot;
