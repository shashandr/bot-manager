import { Bot } from './bot';
export interface BotEventContext {
    payload: unknown;
}
export declare abstract class BotEvent {
    protected readonly name?: string;
    protected readonly chatId: string | number;
    protected constructor(chatId: string | number);
    /**
     * @final
     * Do not override this method in subclasses
     */
    getName(): string;
    abstract handle(bot: Bot, payload: unknown): Promise<void>;
    private generateEventName;
}
