"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotEvent = void 0;
class BotEvent {
    constructor(chatId) {
        this.chatId = chatId;
    }
    getName() {
        return this.name;
    }
}
exports.BotEvent = BotEvent;
