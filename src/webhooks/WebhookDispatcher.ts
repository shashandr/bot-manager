import { BotWebhook, BotWebhookContext } from '~/webhooks/types'
import { MessengerService } from '~/services/types'

export class WebhookDispatcher {
    private webhooks: Map<string, BotWebhook> = new Map()

    register(webhook: BotWebhook) {
        this.webhooks.set(webhook.name, webhook)
    }

    async dispatch(service: MessengerService, botName: string, update: any) {
        const data = update?.type
        if (typeof data !== 'string') return

        const [hookName, actionName] = data.split('/')
        if (!hookName || !actionName) return

        const hook = this.webhooks.get(hookName)
        const action = hook?.getAction(actionName)
        if (!action) return

        const ctx: BotWebhookContext = { service, botName, update }
        await action(ctx)
    }
}
