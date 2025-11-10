"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceManager = void 0;
class ServiceManager {
    constructor() {
        this.services = new Map();
    }
    registerService(service) {
        const name = service.getName();
        if (this.services.has(name))
            throw new Error(`Service '${name}' already registered`);
        this.services.set(name, service);
        return this;
    }
    getService(name) {
        const svc = this.services.get(name);
        if (!svc)
            throw new Error(`Service '${name}' not found`);
        return svc;
    }
    getServices() {
        return this.services;
    }
    registerEvent(serviceName, botName, event) {
        const bot = this.getService(serviceName).getBot(botName);
        bot.registerEvent(event);
        return this;
    }
    async handleEvent(serviceName, botName, eventName, payload) {
        const service = this.getService(serviceName);
        if (!botName) {
            botName = service.getBots().find((name) => service.getBot(name).getEvents().includes(eventName)) || null;
        }
        if (!botName) {
            return;
        }
        const bot = service.getBot(botName);
        await bot.handleEvent(eventName, payload);
    }
    async handleWebhook(serviceName, botName, update) {
        const bot = this.getService(serviceName).getBot(botName);
        await bot.handleWebhook(update);
    }
}
exports.ServiceManager = ServiceManager;
