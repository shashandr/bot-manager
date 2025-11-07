import { MessengerService, BotEvent, Bot } from '~/types'

type ServiceRegistry = Map<string, MessengerService>

export class ServiceManager {
    private services: ServiceRegistry = new Map()

    registerService(service: MessengerService) {
        const name = service.getName()
        if (this.services.has(name)) throw new Error(`Service '${name}' already registered`)
        this.services.set(name, service)

        return this
    }

    getService(name: string) {
        const svc = this.services.get(name)
        if (!svc) throw new Error(`Service '${name}' not found`)

        return svc
    }

    getServices() {
        return this.services
    }

    registerEvent(serviceName: string, botName: string, event: BotEvent): this {
        const bot = this.getService(serviceName).getBot(botName)
        bot.registerEvent(event)

        return this
    }

    async handleEvent(
        serviceName: string,
        botName: string | null,
        eventName: string,
        payload: unknown,
    ) {
        const service = this.getService(serviceName)

        if (!botName) {
            botName = service.getBots().find((name: string) => service.getBot(name).getEvents().includes(eventName)) || null
        }

        if (!botName) {
            return
        }

        const bot = service.getBot(botName)

        await bot.handleEvent(eventName, payload)
    }

    async handleWebhook(serviceName: string, botName: string, update: any) {
        const bot = this.getService(serviceName).getBot(botName)
        await bot.handleWebhook(update)
    }
}
