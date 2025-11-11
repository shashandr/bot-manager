import { Bot, BotConfig } from './bot'
import { BotEvent } from "~/types/event";

export abstract class MessengerService {
    protected bots: Map<string, Bot> = new Map()

    abstract getName(): string

    abstract createBot(name: string, config: BotConfig, events?: BotEvent[]): Bot

    registerBot(bot: Bot): this;
    registerBot(bot: string, token: string, events?: BotEvent[]): this;
    registerBot(bot: string | Bot, token?: string, events?: BotEvent[]): this {
        let botName: string
        let botObj: Bot

        if (typeof bot === 'string') {
            botName = bot
        } else {
            botName = bot.getName()
        }

        if (this.bots.has(botName)) {
            throw new Error(`Bot with name ${botName} already registered`)
        }

        if (typeof bot === 'string') {
            if (!token) {
                throw new Error(`Token required`)
            }
            botObj = this.createBot(botName, { token }, events)
        } else {
            botObj = bot
        }

        this.bots.set(botName, botObj)

        return this
    }

    getBots(): string[] {
        return Array.from(this.bots.keys())
    }

    getBot(name: string): Bot {
        const bot = this.bots.get(name)
        if (!bot) {
            throw new Error(`Bot ${name} not found`)
        }

        return bot
    }
}
