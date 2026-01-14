import { Bot } from './bot';
export interface BotWebhookUpdate {
    type: 'command' | 'callback' | 'text' | 'contact' | 'location';
    sender: {
        id: string | number;
        firstName?: string;
        lastName?: string;
        username?: string;
        isBot?: boolean;
    };
    chat: {
        id: string | number;
        type?: 'private' | 'group' | 'supergroup' | 'channel';
    };
    message: {
        id: string | number;
        timestamp: number;
        text?: string;
    };
    contact?: {
        phone: string;
        sender: boolean;
    };
    location?: {
        latitude: number;
        longitude: number;
    };
    command?: {
        name: string;
        value?: string;
    };
    callback?: {
        data: any;
    };
}
export interface BotWebhookContext {
    payload: BotWebhookUpdate;
}
export declare function Command(name: string): MethodDecorator;
export declare function Action(pattern: string | RegExp): MethodDecorator;
export declare function Text(pattern: string | RegExp): MethodDecorator;
export declare function Contact(): MethodDecorator;
export declare function Location(): MethodDecorator;
export declare class HandlerRegistry {
    private _commands;
    private _actions;
    private _textHandlers;
    private _contactHandler?;
    private _locationHandler?;
    registerCommand(command: string, handler: Function): void;
    registerAction(pattern: string | RegExp, handler: Function): void;
    registerText(pattern: string | RegExp, handler: Function): void;
    registerContact(handler: Function): void;
    registerLocation(handler: Function): void;
    getHandler(update: BotWebhookUpdate): Function | undefined;
    private getCommandHandler;
    private getActionHandler;
    private getTextHandler;
}
export declare abstract class BotWebhook {
    protected readonly registry: HandlerRegistry;
    private _bot?;
    constructor();
    get bot(): Readonly<Bot>;
    set bot(bot: Bot);
    /**
     * Автоматическая регистрация обработчиков из декораторов
     */
    private setupFromDecorators;
    /**
     * Абстрактный метод для ручной регистрации обработчиков (альтернатива декораторам)
     */
    protected registerHandlers(): void;
    protected onGetHandlerBefore(update: BotWebhookUpdate): void;
    protected onGetHandlerAfter(update: BotWebhookUpdate, handler: Function | undefined): void;
    /**
     * Получить обработчик для входящего обновления
     */
    getHandler(update: BotWebhookUpdate): Function | undefined;
    /**
     * Вспомогательные методы для ручной регистрации
     */
    protected registerCommandHandler(command: string, handler: (payload: BotWebhookUpdate) => void): void;
    protected registerActionHandler(pattern: string | RegExp, handler: (payload: BotWebhookUpdate) => void): void;
    protected registerTextHandler(pattern: string | RegExp, handler: (payload: BotWebhookUpdate) => void): void;
    protected registerContactHandler(handler: (payload: BotWebhookUpdate) => void): void;
    protected registerLocationHandler(handler: (payload: BotWebhookUpdate) => void): void;
}
