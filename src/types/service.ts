import { Bot, BotConfig } from './bot'

export abstract class MessengerService {
    protected bots: Map<string, Bot> = new Map()

    abstract getName(): string

    abstract createBot(name: string, config: BotConfig): Bot

    registerBot(name: string, token: string, config?: Partial<BotConfig>): this {
        if (this.bots.has(name)) {
            throw new Error(`Bot with name ${name} already registered`)
        }

        const fullConfig: BotConfig = {
            token,
            ...config,
        } as BotConfig

        const bot = this.createBot(name, fullConfig)
        this.bots.set(name, bot)

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
