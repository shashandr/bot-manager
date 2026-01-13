import {
    MessengerService,
    BotConfig,
    Bot, BotEvent,
} from '~/types'
import { TelegramBot } from './Bot'

export class Service extends MessengerService {
    getName(): string {
        return 'tg'
    }

    createBot(name: string, config: BotConfig, events: BotEvent[] = []): Bot {
        return new TelegramBot(name, config, events, this)
    }
}
