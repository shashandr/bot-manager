import {
    MessengerService,
    BotConfig,
    Bot, BotEvent,
} from '~/types'
import { MaxBot } from './Bot'

export class Service extends MessengerService {
    getName(): string {
        return 'max'
    }

    createBot(name: string, config: BotConfig, events: BotEvent[] = []): Bot {
        return new MaxBot(name, config, events)
    }
}
