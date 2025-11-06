import { BotEvent } from './events/types'
import { BotWebhook } from './webhooks/types'
import { MessengerService, ServiceName } from './services/types'
import { EventDispatcher } from './events/EventDispatcher'
import { WebhookDispatcher } from './webhooks/WebhookDispatcher'

type ServiceRegistry = Map<ServiceName, MessengerService>

export class ServiceManager {
    private services: ServiceRegistry = new Map()
    private eventDispatcher = new EventDispatcher()
    private webhookDispatcher = new WebhookDispatcher()

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

    getEventDispatcher() {
        return this.eventDispatcher
    }

    getWebhookDispatcher() {
        return this.webhookDispatcher
    }

    registerEvent(service: ServiceName | MessengerService, botName: string, event: BotEvent): this {
        const serviceName = typeof service === 'string' ? service : service.getName()

        if (!this.services.has(serviceName)) {
            throw new Error(`Service ${serviceName} not found`)
        }

        this.eventDispatcher.register(serviceName, botName, event)

        return this
    }

    registerWebhook(service: ServiceName | MessengerService, botName: string, webhook: BotWebhook): this {
        const serviceName = typeof service === 'string' ? service : service.getName()

        if (!this.services.has(serviceName)) {
            throw new Error(`Service ${serviceName} not found`)
        }

        this.webhookDispatcher.register(serviceName, botName, webhook)

        return this
    }

    async handleEvent(
        name: ServiceName,
        botName: string,
        eventName: string,
        payload: unknown,
    ) {
        const service = this.getService(name)
        await this.eventDispatcher.emit(service, botName, eventName, payload)
    }

    async handleWebhook(name: ServiceName, botName: string, update: any) {
        const service = this.getService(name)
        await this.webhookDispatcher.dispatch(service, botName, update)
    }
}
