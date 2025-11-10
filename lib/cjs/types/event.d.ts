import { Bot } from './bot';
export interface BotEventContext {
    payload: unknown;
}
export declare abstract class BotEvent {
    protected abstract readonly name: string;
    protected readonly chatId: string | number;
    protected constructor(chatId: string | number);
    getName(): string;
    abstract handle(bot: Bot, payload: unknown): Promise<void>;
}
