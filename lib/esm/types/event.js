export class BotEvent {
    constructor(chatId, name) {
        this.chatId = chatId;
        this.name = name || this.generateEventName();
    }
    /**
     * @final
     * Do not override this method in subclasses
     */
    getName() {
        return this.name;
    }
    generateEventName() {
        const className = this.constructor.name;
        const baseName = className.replace(/Event$/, '');
        return baseName
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .toLowerCase();
    }
    get bot() {
        if (!this._bot) {
            throw new Error('Bot is not initialized. Set bot property first or use start() method.');
        }
        return this._bot;
    }
    set bot(bot) {
        // Проверка на переопределение бота
        if (this._bot) {
            throw new Error('Bot is already set and cannot be redefined.');
        }
        // Создаем readonly proxy для бота, чтобы предотвратить изменения свойств бота
        this._bot = new Proxy(bot, {
            set: () => {
                throw new Error('Bot is readonly. Cannot modify bot properties.');
            },
            defineProperty: () => {
                throw new Error('Bot is readonly. Cannot define new properties.');
            },
            deleteProperty: () => {
                throw new Error('Bot is readonly. Cannot delete properties.');
            },
        });
    }
}
