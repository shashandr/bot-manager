import { Bot, BotConfig } from './bot';
import { BotEvent } from "~/types/event";
export declare abstract class MessengerService {
    protected bots: Map<string, Bot>;
    abstract getName(): string;
    abstract createBot(name: string, config: BotConfig, events?: BotEvent[]): Bot;
    registerBot(bot: Bot): this;
    registerBot(bot: string, token: string, events?: BotEvent[]): this;
    getBots(): string[];
    getBot(name: string): Bot;
}
