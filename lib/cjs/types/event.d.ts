import { Bot } from './bot';
export interface BotEventContext {
    payload: unknown;
}
export declare abstract class BotEvent {
    private _bot?;
    protected readonly name: string;
    protected readonly chatId: string | number;
    protected constructor(chatId: string | number, name?: string);
    /**
     * @final
     * Do not override this method in subclasses
     */
    getName(): string;
    abstract handle(payload: unknown): Promise<void>;
    private generateEventName;
    get bot(): Readonly<Bot>;
    set bot(bot: Bot);
}
