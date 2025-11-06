import { BotEvent } from './types'
import { MessengerService, ServiceName } from '~/services/types'

export class EventDispatcher {
    private handlers: Map<string, BotEvent> = new Map()

    constructor() {}

    register(serviceName: ServiceName, botName: string, event: BotEvent) {
        const key = `${serviceName}/${botName}/${event.name}`
        this.handlers.set(key, event)
    }

    async emit(
        service: MessengerService,
        botName: string,
        eventName: string,
        payload: unknown,
    ) {
        const key = `${service.getName()}/${botName}/${eventName}`
        const event = this.handlers.get(key)

        if (!event) {
            throw new Error(
                `Event handler for '${eventName}' not registered for service '${service.getName()}'`
            )
        }

        await event.handle(service.getBot(botName), payload)
    }
}
