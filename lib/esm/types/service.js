export class MessengerService {
    constructor() {
        this.bots = new Map();
    }
    registerBot(bot, config, events) {
        let botName;
        let botObj;
        if (typeof bot === 'string') {
            botName = bot;
        }
        else {
            botName = bot.getName();
        }
        if (this.bots.has(botName)) {
            throw new Error(`Bot with name ${botName} already registered`);
        }
        if (typeof bot === 'string') {
            if (!config) {
                throw new Error(`Config required`);
            }
            botObj = this.createBot(botName, config, events);
        }
        else {
            botObj = bot;
        }
        this.bots.set(botName, botObj);
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
