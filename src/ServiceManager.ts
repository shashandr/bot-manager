import { BotEvent } from './events/types'
import { BotWebhook } from './webhooks/types'
import { MessengerService, ServiceName } from './services/types'
import { EventDispatcher } from './events/EventDispatcher'
import { WebhookDispatcher } from './webhooks/WebhookDispatcher'

type ServiceRegistry = Map<ServiceName, MessengerService>

export class ServiceManager {
    private services: ServiceRegistry = new Map()

    registerService(service: MessengerService) {
        const name = service.getName()
        if (this.services.has(name)) throw new Error(`Service '${name}' already registered`)
        this.services.set(name, service)

        return this
    }

    getService(name: ServiceName) {
        const svc = this.services.get(name)
        if (!svc) throw new Error(`Service '${name}' not found`)

        return svc
    }

    getServices() {
        return this.services
    }

    registerEvent(serviceName: ServiceName, botName: string, event: BotEvent): this {
        const bot = this.getService(serviceName).getBot(botName)
        bot.registerEvent(event)

        return this
    }

    async handleEvent(
        name: ServiceName,
        botName: string,
        eventName: string,
        payload: unknown,
    ) {
        const bot = this.getService(name).getBot(botName)
        await bot.handleEvent(eventName, payload)
    }

    async handleWebhook(name: ServiceName, botName: string, webhook: BotWebhook, update: any) {
        const bot = this.getService(name).getBot(botName)
        await bot.handleWebhook(webhook, update)
    }
}
