import { Bot } from './bot'

export interface BotEventContext {
    payload: unknown
}

export abstract class BotEvent {
    protected readonly name: string
    protected readonly chatId: string | number

    protected constructor(chatId: string | number, name?: string) {
        this.chatId = chatId
        this.name = name || this.generateEventName()
    }

    /**
     * @final
     * Do not override this method in subclasses
     */
    getName(): string {
        return this.name!
    }

    abstract handle(bot: Bot, payload: unknown): Promise<void>

    private generateEventName(): string {
        const className = this.constructor.name
        const baseName = className.replace(/Event$/, '')

        return baseName
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .toLowerCase()
    }
}
