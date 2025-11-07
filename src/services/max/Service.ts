import {
    MessengerService,
    BotConfig,
    Bot,
} from '~/types'
import { MaxBot } from './Bot'

export class Service extends MessengerService {
    getName(): string {
        return 'max'
    }

    createBot(name: string, config: BotConfig): Bot {
        return new MaxBot(name, config)
    }
}
