import { BotEvent } from './types'
import { MessengerService, ServiceName } from '~/services/types'

export class EventDispatcher {
    private handlers: Map<string, Map<ServiceName, BotEvent>> = new Map()

    constructor() {}

    registerEvent(serviceName: ServiceName, handler: BotEvent) {
        if (!this.handlers.has(handler.name)) {
            this.handlers.set(handler.name, new Map())
        }
        this.handlers.get(handler.name)!.set(serviceName, handler)
    }

    async emit(
        service: MessengerService,
        params: {
            event: string
            botName?: string
            chatId?: string | number
            payload: unknown
        }
    ) {
        const serviceHandlers = this.handlers.get(params.event)
        if (!serviceHandlers) {
            throw new Error(`Event handler for '${params.event}' not found`)
        }

        const serviceName = service.getName()
        const handler = serviceHandlers.get(serviceName)
        if (!handler) {
            throw new Error(
                `Event handler for '${params.event}' not registered for service '${serviceName}'`
            )
        }

        const botName = params.botName || 'main'
        const finalChatId = params.chatId ?? handler.chatId

        if (!finalChatId) {
            throw new Error(
                `ChatId not provided and not set in event '${params.event}' for service '${serviceName}'`
            )
        }

        await handler.handle(service.getBot(botName), {
            chatId: finalChatId,
            payload: params.payload,
        })
    }
}
