export class BotEvent {
    constructor(chatId) {
        this.chatId = chatId;
        if (!this.name) {
            this.name = this.generateEventName();
        }
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
}
