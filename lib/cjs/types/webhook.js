"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotWebhook = exports.HandlerRegistry = void 0;
exports.Command = Command;
exports.Action = Action;
exports.Text = Text;
exports.Contact = Contact;
exports.Location = Location;
const strings_1 = require("../lib/strings.js");
// Декораторы для композиционного подхода
function Command(name) {
    return function (target, propertyKey, descriptor) {
        const constructor = target.constructor;
        if (!constructor._decoratedCommands) {
            constructor._decoratedCommands = new Map();
        }
        constructor._decoratedCommands.set(name.toLowerCase(), propertyKey);
    };
}
function Action(pattern) {
    return function (target, propertyKey, descriptor) {
        const constructor = target.constructor;
        if (!constructor._decoratedActions) {
            constructor._decoratedActions = new Map();
        }
        constructor._decoratedActions.set(pattern, propertyKey);
    };
}
function Text(pattern) {
    return function (target, propertyKey, descriptor) {
        const constructor = target.constructor;
        if (!constructor._decoratedTextHandlers) {
            constructor._decoratedTextHandlers = new Map();
        }
        constructor._decoratedTextHandlers.set(pattern, propertyKey);
    };
}
function Contact() {
    return function (target, propertyKey, descriptor) {
        const constructor = target.constructor;
        constructor._decoratedContactHandler = propertyKey;
    };
}
function Location() {
    return function (target, propertyKey, descriptor) {
        const constructor = target.constructor;
        constructor._decoratedLocationHandler = propertyKey;
    };
}
// Класс регистрации обработчиков
class HandlerRegistry {
    constructor() {
        this._commands = new Map();
        this._actions = new Map();
        this._textHandlers = new Map();
    }
    registerCommand(command, handler) {
        this._commands.set(command.toLowerCase(), handler);
    }
    registerAction(pattern, handler) {
        this._actions.set(pattern, handler);
    }
    registerText(pattern, handler) {
        this._textHandlers.set(pattern, handler);
    }
    registerContact(handler) {
        this._contactHandler = handler;
    }
    registerLocation(handler) {
        this._locationHandler = handler;
    }
    getHandler(update) {
        console.log(update);
        switch (update.type) {
            case 'callback':
                return this.getActionHandler(update);
            case 'command':
                return this.getCommandHandler(update);
            case 'contact':
                return this._contactHandler;
            case 'location':
                return this._locationHandler;
            case 'text':
                return this.getTextHandler(update);
            default:
                return undefined;
        }
    }
    getCommandHandler(update) {
        if (!update.command)
            return undefined;
        if (update.command.name === 'start' && update.command.value && update.command.value.includes('=')) {
            const parts = (0, strings_1.splitFirst)(update.command.value, '=');
            update.command.name = parts[0];
            update.command.value = parts[1];
        }
        const commandMatch = update.command.name.match(/^([a-zA-Z0-9_-]+)/);
        if (!commandMatch)
            return undefined;
        const commandName = commandMatch[1].toLowerCase();
        return this._commands.get(commandName);
    }
    getActionHandler(update) {
        if (!update.callback?.data)
            return undefined;
        const actionName = update.callback.data?.action;
        // Проверяем точное совпадение
        const exactHandler = this._actions.get(actionName);
        if (exactHandler)
            return exactHandler;
        // Проверяем регулярные выражения
        for (const [pattern, handler] of this._actions.entries()) {
            if (pattern instanceof RegExp && pattern.test(actionName)) {
                return handler;
            }
        }
        return undefined;
    }
    getTextHandler(update) {
        if (!update.message?.text)
            return undefined;
        const text = update.message.text;
        // Проверяем точное совпадение
        const exactHandler = this._textHandlers.get(text.toLowerCase());
        if (exactHandler)
            return exactHandler;
        // Проверяем регулярные выражения
        for (const [pattern, handler] of this._textHandlers.entries()) {
            if (pattern instanceof RegExp && pattern.test(text)) {
                return handler;
            }
        }
        return undefined;
    }
}
exports.HandlerRegistry = HandlerRegistry;
// Базовый класс вебхука с композицией и поддержкой декораторов
class BotWebhook {
    constructor() {
        this.registry = new HandlerRegistry();
        this.setupFromDecorators();
        this.registerHandlers();
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
    /**
     * Автоматическая регистрация обработчиков из декораторов
     */
    setupFromDecorators() {
        const constructor = this.constructor;
        // Регистрируем команды из декораторов
        if (constructor._decoratedCommands) {
            for (const [command, methodName] of constructor._decoratedCommands.entries()) {
                const method = this[methodName];
                if (typeof method === 'function') {
                    this.registry.registerCommand(command, method.bind(this));
                }
            }
        }
        // Регистрируем действия из декораторов
        if (constructor._decoratedActions) {
            for (const [pattern, methodName] of constructor._decoratedActions.entries()) {
                const method = this[methodName];
                if (typeof method === 'function') {
                    this.registry.registerAction(pattern, method.bind(this));
                }
            }
        }
        // Регистрируем текстовые обработчики из декораторов
        if (constructor._decoratedTextHandlers) {
            for (const [pattern, methodName] of constructor._decoratedTextHandlers.entries()) {
                const method = this[methodName];
                if (typeof method === 'function') {
                    this.registry.registerText(pattern, method.bind(this));
                }
            }
        }
        // Регистрируем обработчик контактов из декоратора
        if (constructor._decoratedContactHandler) {
            const method = this[constructor._decoratedContactHandler];
            if (typeof method === 'function') {
                this.registry.registerContact(method.bind(this));
            }
        }
        // Регистрируем обработчик локаций из декоратора
        if (constructor._decoratedLocationHandler) {
            const method = this[constructor._decoratedLocationHandler];
            if (typeof method === 'function') {
                this.registry.registerLocation(method.bind(this));
            }
        }
    }
    /**
     * Абстрактный метод для ручной регистрации обработчиков (альтернатива декораторам)
     */
    registerHandlers() { }
    onGetHandlerBefore(update) { }
    onGetHandlerAfter(update, handler) { }
    /**
     * Получить обработчик для входящего обновления
     */
    getHandler(update) {
        this.onGetHandlerBefore(update);
        const handler = this.registry.getHandler(update);
        this.onGetHandlerAfter(update, handler);
        return handler;
    }
    /**
     * Вспомогательные методы для ручной регистрации
     */
    registerCommandHandler(command, handler) {
        this.registry.registerCommand(command, handler);
    }
    registerActionHandler(pattern, handler) {
        this.registry.registerAction(pattern, handler);
    }
    registerTextHandler(pattern, handler) {
        this.registry.registerText(pattern, handler);
    }
    registerContactHandler(handler) {
        this.registry.registerContact(handler);
    }
    registerLocationHandler(handler) {
        this.registry.registerLocation(handler);
    }
}
exports.BotWebhook = BotWebhook;
