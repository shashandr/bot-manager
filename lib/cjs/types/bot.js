"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const strings_1 = require("../lib/strings.js");
const files_1 = require("../lib/files.js");
class Bot {
    constructor(name, config, events = []) {
        this.events = new Map();
        this.name = name;
        this.config = config;
        this.instance = this.createInstance(config.token);
        events.forEach((event) => {
            this.registerEvent(event);
        });
    }
    getName() {
        return this.name;
    }
    getInstance() {
        return this.instance;
    }
    getConfig() {
        return this.config;
    }
    async addMessageTag(chatId, messageId, text, tag, options) {
        text = this.appendTag(text, tag);
        return await this.editMessage(chatId, messageId, text, options);
    }
    async addFileTag(chatId, messageId, caption, tag, options) {
        caption = this.appendTag(caption, tag);
        return await this.editCaption(chatId, messageId, caption, options);
    }
    prepareMessageText(text, parseMode) {
        if (parseMode === 'html') {
            return (0, strings_1.stripTags)(text, ['p', 'br', 'a', 'b', 'i', 'u', 's', 'strong', 'strike', 'em', 'del', 'code', 'pre'])
                .replace(/<(p|br)\s?\/?>/gi, '\n')
                .replace(/<\/p>/gi, '');
        }
        return text;
    }
    appendTag(text, tag) {
        const matches = (0, strings_1.pregMatchAll)(/#(.+?)[<br\s]/, text);
        if (matches.length) {
            const existTags = matches[1];
            if (!existTags?.length) {
                text = `#${tag}<br/><br/>${text}`;
            }
            else if (!existTags.includes(tag)) {
                const lastTag = existTags[existTags.length - 1];
                text = text.replace(`#${lastTag}`, `#${lastTag} #${tag}`);
            }
        }
        return text;
    }
    getEvents() {
        return Array.from(this.events.keys());
    }
    registerEvent(event) {
        this.events.set(event.getName(), event);
        return this;
    }
    async handleEvent(eventName, payload) {
        const event = this.events.get(eventName);
        if (!event) {
            throw new Error(`Event handler for '${eventName}' not registered for bot '${this.name}'`);
        }
        await event.handle(this, payload);
    }
    registerWebhook(webhook) {
        this.webhook = webhook;
        return this;
    }
    async handleWebhook(update) {
        if (!this.webhook) {
            return;
        }
        const payload = this.convertWebhookUpdate(update);
        const handler = this.webhook.getHandler(payload);
        if (handler) {
            await handler(this, payload);
        }
        else {
            const unknownHandler = this.webhook.handleUnknown;
            if (typeof unknownHandler === 'function') {
                await unknownHandler.call(this.webhook, this, payload);
            }
        }
    }
    getMediaType(fileName) {
        return (0, files_1.getFileType)(fileName);
    }
    start(webhook) {
        this.registerWebhook(webhook);
        if (this.webhook) {
            this.onStart();
        }
    }
}
exports.Bot = Bot;
