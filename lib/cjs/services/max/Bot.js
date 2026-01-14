"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxBot = void 0;
const max_bot_api_1 = require("@maxhub/max-bot-api");
const types_1 = require("../../types/index.js");
const strings_1 = require("../../lib/strings.js");
const files_1 = require("../../lib/files.js");
const fs = __importStar(require("fs"));
class MaxBot extends types_1.Bot {
    createInstance(token) {
        return new max_bot_api_1.Bot(token);
    }
    async sendMessage(chatId, text, options) {
        const bot = this.instance;
        const extra = {};
        extra.format = options?.parseMode || this.defaultParseMode;
        extra.notify = !options?.disableNotification;
        if (options?.buttons && options.buttons.length > 0) {
            const keyboard = this.prepareKeyboard(options.buttons);
            keyboard && Object.assign(extra, { attachments: [keyboard] });
        }
        const isGroup = typeof chatId === 'string' && chatId.startsWith('-');
        text = this.prepareMessageText(text, extra.format);
        isGroup
            ? await bot.api.sendMessageToChat(Number(chatId), text, extra)
            : await bot.api.sendMessageToUser(Number(chatId), text, extra);
        return true;
    }
    async sendFile(chatId, file, caption, options) {
        const bot = this.instance;
        const extra = {};
        const fileName = typeof file === 'string' ? file : file.filename;
        if (!fileName) {
            return false;
        }
        const fileType = this.getMediaType(fileName);
        const isUrl = typeof file === 'string' && /^https?:\/\//i.test(file);
        let attachment = null;
        let tempPath = null;
        try {
            if (fileType && ['image', 'photo'].includes(fileType) && isUrl) {
                attachment = await bot.api.uploadImage({ url: file });
            }
            else {
                const sourcePath = isUrl ? await (0, files_1.downloadToTemp)(file) : file;
                tempPath = isUrl ? sourcePath : null;
                if (fileType === 'audio') {
                    attachment = await bot.api.uploadAudio({ source: sourcePath });
                }
                else if (fileType === 'video') {
                    attachment = await bot.api.uploadVideo({ source: sourcePath });
                }
                else {
                    attachment = await bot.api.uploadFile({ source: sourcePath });
                }
            }
        }
        catch (err) {
            throw err;
        }
        finally {
            if (tempPath) {
                fs.promises.unlink(tempPath).catch(() => { });
            }
        }
        if (!attachment) {
            return false;
        }
        extra.format = options?.parseMode || this.defaultParseMode;
        extra.notify = !options?.disableNotification;
        extra.attachments = [attachment.toJson()];
        if (options?.buttons && options.buttons.length > 0) {
            const keyboard = this.prepareKeyboard(options.buttons);
            // @ts-ignore
            keyboard && extra.attachments.push(keyboard);
        }
        const isGroup = typeof chatId === 'string' && chatId.startsWith('-');
        caption = this.prepareMessageText(caption || '', extra.format);
        isGroup
            ? await bot.api.sendMessageToChat(Number(chatId), caption, extra)
            : await bot.api.sendMessageToUser(Number(chatId), caption, extra);
        return true;
    }
    async editMessage(chatId, messageId, text, options) {
        const bot = this.instance;
        const extra = {};
        const message = await bot.api.getMessage(messageId);
        extra.format = options?.parseMode || this.defaultParseMode;
        extra.notify = options?.disableNotification;
        extra.text = this.prepareMessageText(text, extra.format);
        extra.attachments = message.body.attachments
            ? message.body.attachments.filter(attachment => attachment.type !== 'inline_keyboard')
            : [];
        const response = await bot.api.editMessage(messageId, extra);
        return response.success;
    }
    async editCaption(chatId, messageId, caption, options) {
        return await this.editMessage(chatId, messageId, caption, options);
    }
    async getUpdate(options) {
        // Max Bot API может иметь метод getUpdates
        // Если нет, используем альтернативный подход через API
        if (typeof this.instance.api.getUpdates === 'function') {
            const params = {};
            if (options?.offset !== undefined)
                params.offset = options.offset;
            if (options?.limit !== undefined)
                params.limit = options.limit;
            if (options?.timeout !== undefined)
                params.timeout = options.timeout;
            if (options?.allowedUpdates)
                params.allowed_updates = options.allowedUpdates;
            return this.instance.api.getUpdates(params);
        }
        // Если метод недоступен, возвращаем ошибку или пустой массив
        throw new Error('getUpdates method is not available in Max Bot API. Max bot uses webhook-based updates.');
    }
    prepareKeyboard(buttons) {
        const inlineKeyboardButtons = [];
        buttons.forEach((btn) => {
            if (btn?.type) {
                switch (btn.type) {
                    case 'request_contact':
                        inlineKeyboardButtons.push(max_bot_api_1.Keyboard.button.requestContact(btn.text));
                        break;
                    case 'link':
                        const url = btn?.payload?.url;
                        if (typeof url === 'string' && url.length > 0) {
                            inlineKeyboardButtons.push(max_bot_api_1.Keyboard.button.link(btn.text, url));
                        }
                        break;
                    case 'location':
                        inlineKeyboardButtons.push(max_bot_api_1.Keyboard.button.requestGeoLocation(btn.text));
                        break;
                    default:
                        const callbackData = this.toCallbackData(btn?.payload, btn.text);
                        inlineKeyboardButtons.push(max_bot_api_1.Keyboard.button.callback(btn.text, callbackData));
                }
            }
        });
        if (inlineKeyboardButtons.length) {
            return max_bot_api_1.Keyboard.inlineKeyboard([inlineKeyboardButtons]);
        }
        return null;
    }
    onStart() {
        this.instance.on('bot_started', async (ctx) => {
            await this.handleWebhook(ctx.update);
        });
        this.instance.on('message_created', async (ctx) => {
            console.log('message_created');
            await this.handleWebhook(ctx.update);
        });
        this.instance.on('message_callback', async (ctx) => {
            await this.handleWebhook(ctx.update);
        });
        this.instance.start();
    }
    convertWebhookUpdate(data) {
        let type = 'text';
        let commandData = undefined;
        let callbackData = undefined;
        let contact = undefined;
        let location = undefined;
        let sender = data?.message?.sender;
        if (data?.update_type === 'message_callback') {
            type = 'callback';
            sender = data.callback.user;
            callbackData = data.callback.payload.startsWith('{') ? JSON.parse(data.callback.payload) : data.callback.payload;
        }
        else if (data?.update_type === 'bot_started') {
            type = 'command';
            sender = data.user;
            commandData = {
                name: 'start',
                value: data.payload,
            };
        }
        else if (data.message?.body.text && data.message.body.text.startsWith('/')) {
            type = 'command';
            const commandParts = data.message.body.text.includes('=')
                ? (0, strings_1.splitFirst)(data.message.body.text, '=')
                : [data.message.body.text, null];
            commandData = {
                name: commandParts[0].replace('/', ''),
                value: commandParts[1],
            };
        }
        else if (data.message.body?.attachments) {
            data.message.body.attachments.forEach((attachment) => {
                switch (attachment.type) {
                    case 'contact':
                        type = 'contact';
                        contact = {
                            phone: (0, strings_1.vcfExtractPhone)(attachment.payload.vcf_info),
                            sender: attachment.payload.max_info.user_id === data.message.sender.user_id,
                        };
                        break;
                    case 'location':
                        type = 'location';
                        location = {
                            latitude: attachment.latitude,
                            longitude: attachment.longitude,
                        };
                        break;
                }
            });
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
        };
    }
}
exports.MaxBot = MaxBot;
