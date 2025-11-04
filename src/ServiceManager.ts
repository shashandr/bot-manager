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

    registerEvent(serviceName: ServiceName, event: BotEvent): this {
        this.eventDispatcher.registerEvent(serviceName, event)

        return this
    }

    registerWebhook(webhook: BotWebhook): this {
        this.webhookDispatcher.register(webhook)

        return this
    }

    async handleEvent(
        name: ServiceName,
        params: {
            event: string
            botName?: string
            chatId?: string | number
            payload: unknown
        }
    ) {
        const service = this.getService(name)
        await this.eventDispatcher.emit(service, params)
    }

    async handleWebhook(name: ServiceName, botName: string, update: any) {
        const service = this.getService(name)
        await this.webhookDispatcher.dispatch(service, botName, update)
    }
}
