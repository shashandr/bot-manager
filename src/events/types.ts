import { Bot } from '~/services/types'

export interface BotEventContext {
    chatId: string | number
    payload: unknown
}

export abstract class BotEvent {
    abstract readonly name: string
    readonly chatId: string | number

    protected constructor(chatId: string | number) {
        this.chatId = chatId
    }

    abstract handle(bot: Bot, ctx: BotEventContext): Promise<void>
}
