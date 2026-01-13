import { BotWebhook, BotWebhookUpdate } from './webhook';
import { BotEvent } from './event';
export interface BotConfig {
    token: string;
}
export interface BotMessageButton {
    type: 'callback' | 'link' | 'request_contact' | 'location';
    text: string;
    payload?: any;
}
export interface BotMessageOptions {
    parseMode?: 'html' | 'markdown';
    buttons?: Array<BotMessageButton>;
    disableNotification?: boolean;
}
export interface BotUpdateHandler {
    onText?: (ctx: any) => void | Promise<void>;
    onCallbackQuery?: (ctx: any) => void | Promise<void>;
    onAnyMessage?: (ctx: any) => void | Promise<void>;
}
export interface GetUpdateOptions {
    offset?: number;
    limit?: number;
    timeout?: number;
    allowedUpdates?: string[];
}
export declare abstract class Bot {
    protected name: string;
    protected config: BotConfig;
    protected events: Map<string, BotEvent>;
    protected webhook?: BotWebhook;
    protected instance: any;
    protected defaultParseMode: string;
    constructor(name: string, config: BotConfig, events?: BotEvent[]);
    protected abstract createInstance(token: string): any;
    getName(): string;
    getInstance(): any;
    getConfig(): BotConfig;
    abstract sendMessage(chatId: number | string, text: string, options?: BotMessageOptions): Promise<boolean>;
    abstract sendFile(chatId: number | string, file: any, caption?: string, options?: BotMessageOptions): Promise<boolean>;
    abstract editMessage(chatId: number | string, messageId: number | string, text: string, options?: BotMessageOptions): Promise<boolean>;
    abstract editCaption(chatId: number | string, messageId: number | string, caption: string, options?: BotMessageOptions): Promise<boolean>;
    abstract getUpdate(options?: GetUpdateOptions): Promise<any>;
    protected abstract onStart(): void;
    protected abstract convertWebhookUpdate(update: any): BotWebhookUpdate;
    addMessageTag(chatId: number | string, messageId: number | string, text: string, tag: string, options?: BotMessageOptions): Promise<boolean>;
    addFileTag(chatId: number | string, messageId: number | string, caption: string, tag: string, options?: BotMessageOptions): Promise<boolean>;
    protected prepareMessageText(text: string, parseMode: string): string;
    protected appendTag(text: string, tag: string): string;
    protected toCallbackData(value: unknown, fallback: string): string;
    getEvents(): string[];
    registerEvent(event: BotEvent): this;
    handleEvent(eventName: string, payload: unknown): Promise<void>;
    registerWebhook(webhook: BotWebhook): this;
    handleWebhook(update: any): Promise<void>;
    getMediaType(fileName: string): string | null;
    start(webhook: BotWebhook): void;
}
