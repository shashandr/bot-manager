import { Bot } from '~/services/types'

export interface BotEventContext {
    payload: unknown
}

export abstract class BotEvent {
    abstract readonly name: string
    readonly chatId: string | number

    protected constructor(chatId: string | number) {
        this.chatId = chatId
    }

    abstract handle(bot: Bot, payload: unknown): Promise<void>
}
