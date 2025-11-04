import { MessengerService } from '~/services/types'

export interface BotWebhookContext {
    service: MessengerService
    botName: string
    update: any
}

export interface BotWebhook {
    readonly name: string

    getAction(action: string): ((ctx: BotWebhookContext) => Promise<void>) | undefined
}
