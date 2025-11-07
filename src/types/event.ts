import { Bot } from './bot'

export interface BotEventContext {
    payload: unknown
}

export abstract class BotEvent {
    abstract readonly name: string
    readonly chatId: string | number

    constructor(chatId: string | number) {
        this.chatId = chatId
    }

    abstract handle(bot: Bot, payload: unknown): Promise<void>
}
