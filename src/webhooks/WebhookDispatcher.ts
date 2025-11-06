import { BotWebhook } from '~/webhooks/types'
import { MessengerService, ServiceName } from '~/services/types'

export class WebhookDispatcher {
    private webhooks: Map<string, BotWebhook> = new Map()

    register(serviceName: ServiceName, botName: string, webhook: BotWebhook) {
        const key = `${serviceName}/${botName}`
        this.webhooks.set(key, webhook)
    }

    async dispatch(service: MessengerService, botName: string, update: any) {
        const key = `${service.getName()}/${botName}`
        const webhook = this.webhooks.get(key)

        if (!webhook) return

        const bot = service.getBot(botName)

        await bot.handleWebhook(webhook, update)
    }
}
