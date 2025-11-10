import { MessengerService, } from '../../types/index.js';
import { TelegramBot } from './Bot.js';
export class Service extends MessengerService {
    getName() {
        return 'tg';
    }
    createBot(name, config, events = []) {
        return new TelegramBot(name, config, events);
    }
}
