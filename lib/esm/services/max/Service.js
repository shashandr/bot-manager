import { MessengerService, } from '../../types/index.js';
import { MaxBot } from './Bot.js';
export class Service extends MessengerService {
    getName() {
        return 'max';
    }
    createBot(name, config, events = []) {
        return new MaxBot(name, config, events);
    }
}
