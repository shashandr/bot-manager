import { Bot } from './bot'

export interface BotEventContext {
    payload: unknown
}

export abstract class BotEvent {
    protected abstract readonly name: string
    protected readonly chatId: string | number

    protected constructor(chatId: string | number) {
        this.chatId = chatId
    }

    getName() {
        return this.name
    }

    abstract handle(bot: Bot, payload: unknown): Promise<void>
}
