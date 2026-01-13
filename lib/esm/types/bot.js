import { pregMatchAll, stripTags } from '../lib/strings.js';
import { getFileType } from '../lib/files.js';
export class Bot {
    constructor(name, config, events = [], service) {
        this.events = new Map();
        this.defaultParseMode = 'html';
        this.name = name;
        if (service) {
            this.serviceName = service.getName();
        }
        this.config = config;
        this.instance = this.createInstance(config.token);
        events.forEach((event) => {
            this.registerEvent(event);
        });
    }
    getName() {
        return this.name;
    }
    getServiceName() {
        return this.serviceName;
    }
    getConfig() {
        return this.config;
    }
    getInstance() {
        return this.instance;
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
            return stripTags(text, ['p', 'br', 'a', 'b', 'i', 'u', 's', 'strong', 'strike', 'em', 'del', 'code', 'pre'])
                .replace(/<(p|br)\s?\/?>/gi, '\n')
                .replace(/<\/p>/gi, '');
        }
        return text;
    }
    appendTag(text, tag) {
        const matches = pregMatchAll(/#(.+?)[<br\s]/, text);
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
        return data;
    }
    getEvents() {
        return Array.from(this.events.keys());
    }
    registerEvent(event) {
        event.bot = this;
        this.events.set(event.getName(), event);
        return this;
    }
    async handleEvent(eventName, payload) {
        const event = this.events.get(eventName);
        if (!event) {
            throw new Error(`Event handler for '${eventName}' not registered for bot '${this.name}'`);
        }
        try {
            await event.handle(payload);
        }
        catch (err) {
            throw new Error(`Handle event '${eventName}' error for bot '${this.name}': ${err.message}`);
        }
    }
    registerWebhook(webhook) {
        this.webhook = webhook;
        this.webhook.bot = this;
        return this;
    }
    async handleWebhook(update) {
        if (!this.webhook) {
            return;
        }
        try {
            const payload = this.convertWebhookUpdate(update);
            const handler = this.webhook.getHandler(payload);
            if (handler) {
                await handler(payload);
            }
            else {
                const unknownHandler = this.webhook.handleUnknown;
                if (typeof unknownHandler === 'function') {
                    await unknownHandler.call(this.webhook, payload);
                }
            }
        }
        catch (err) {
            throw new Error(`Handle webhook error for bot '${this.name}': ${err.message}`);
        }
    }
    getMediaType(fileName) {
        return getFileType(fileName);
    }
    start(webhook) {
        this.registerWebhook(webhook);
        if (!this.webhook) {
            return;
        }
        try {
            this.onStart();
        }
        catch (err) {
            throw new Error(`Webhook start error for bot '${this.name}': ${err.message}`);
        }
    }
}
