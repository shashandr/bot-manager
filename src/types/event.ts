import { Bot } from './bot'

export interface BotEventContext {
    payload: unknown
}

export abstract class BotEvent {
    private _bot?: Bot
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

    abstract handle(payload: unknown): Promise<void>

    private generateEventName(): string {
        const className = this.constructor.name
        const baseName = className.replace(/Event$/, '')

        return baseName
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .toLowerCase()
    }

    get bot(): Readonly<Bot> {
        if (!this._bot) {
            throw new Error('Bot is not initialized. Set bot property first or use start() method.')
        }
        return this._bot as Readonly<Bot>
    }

    set bot(bot: Bot) {
        // Проверка на переопределение бота
        if (this._bot) {
            throw new Error('Bot is already set and cannot be redefined.')
        }

        // Создаем readonly proxy для бота, чтобы предотвратить изменения свойств бота
        this._bot = new Proxy(bot, {
            set: () => {
                throw new Error('Bot is readonly. Cannot modify bot properties.')
            },
            defineProperty: () => {
                throw new Error('Bot is readonly. Cannot define new properties.')
            },
            deleteProperty: () => {
                throw new Error('Bot is readonly. Cannot delete properties.')
            },
        }) as Bot
    }
}
