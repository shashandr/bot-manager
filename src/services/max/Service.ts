import {
    MessengerService,
    ServiceName,
    BotConfig,
    Bot,
} from '../types'
import { MaxBot } from './Bot'

export class Service extends MessengerService {
    getName(): ServiceName {
        return 'max'
    }

    createBot(name: string, config: BotConfig): Bot {
        return new MaxBot(name, config)
    }
}
