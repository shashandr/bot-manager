import {
    MessengerService,
    BotConfig,
    Bot,
} from '~/types'
import { TelegramBot } from './Bot'

export class Service extends MessengerService {
    getName(): string {
        return 'tg'
    }

    createBot(name: string, config: BotConfig): Bot {
        return new TelegramBot(name, config)
    }
}
