export class MessengerService {
    constructor() {
        this.bots = new Map();
    }
    registerBot(name, token, events) {
        if (this.bots.has(name)) {
            throw new Error(`Bot with name ${name} already registered`);
        }
        const bot = this.createBot(name, { token }, events);
        this.bots.set(name, bot);
        return this;
    }
    getBots() {
        return Array.from(this.bots.keys());
    }
    getBot(name) {
        const bot = this.bots.get(name);
        if (!bot) {
            throw new Error(`Bot ${name} not found`);
        }
        return bot;
    }
}
