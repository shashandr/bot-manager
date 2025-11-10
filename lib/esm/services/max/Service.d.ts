import { MessengerService, BotConfig, Bot, BotEvent } from '~/types';
export declare class Service extends MessengerService {
    getName(): string;
    createBot(name: string, config: BotConfig, events?: BotEvent[]): Bot;
}
