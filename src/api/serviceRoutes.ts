import { Router, Request, Response } from 'express'
import { MessengerService } from '~/types/messenger'
import { EventDispatcher } from "~/events/EventDispatcher"
import { WebhookDispatcher } from "~/webhooks/WebhookDispatcher"
import { logger } from '~/lib/logger'

export function routerFactory(
    service: MessengerService,
    eventDispatcher?: EventDispatcher,
    webhookDispatcher?: WebhookDispatcher
) {
    const router = Router()
    const basePath = `/${service.getName()}`

    router.post(basePath + '/bots/:botName/send', async (req: Request, res: Response) => {
        const { botName } = req.params
        const { chatId, text, options } = req.body
        try {
            const result = await service.sendMessage(botName, chatId, text, options)
            res.send(result)
        } catch (err) {
            logger.error('route_error', {
                route: `${basePath}/bots/:botName/send`,
                botName,
                chatId,
                error: (err as Error)?.message,
            })
            res.status(400).send({ error: (err as Error).message })
        }
    })

    router.post(basePath + '/bots/:botName/sendDocument', async (req: Request, res: Response) => {
        const { botName } = req.params
        const { chatId, file, caption } = req.body
        try {
            const result = await service.sendDocument(botName, chatId, file, caption)
            res.send(result)
        } catch (err) {
            logger.error('route_error', {
                route: `${basePath}/bots/:botName/sendDocument`,
                botName,
                chatId,
                error: (err as Error)?.message,
            })
            res.status(400).send({ error: (err as Error).message })
        }
    })

    router.post(basePath + '/bots/:botName/sendPhoto', async (req: Request, res: Response) => {
        const { botName } = req.params
        const { chatId, photo, caption } = req.body
        try {
            const result = await service.sendPhoto(botName, chatId, photo, caption)
            res.send(result)
        } catch (err) {
            logger.error('route_error', {
                route: `${basePath}/bots/:botName/sendPhoto`,
                botName,
                chatId,
                error: (err as Error)?.message,
            })
            res.status(400).send({ error: (err as Error).message })
        }
    })

    router.post(basePath + '/event', async (req: Request, res: Response) => {
        const { event, botName, chatId, payload } = req.body as {
            event: string
            botName?: string
            chatId?: string | number
            payload: unknown
        }
        try {
            if (eventDispatcher) await eventDispatcher.emit(service, { event, botName, chatId, payload })
            res.send({ status: 'ok' })
        } catch (err) {
            logger.error('route_error', {
                route: `${basePath}/event`,
                event,
                botName,
                chatId,
                error: (err as Error)?.message,
            })
            res.status(400).send({ error: (err as Error).message })
        }
    })

    router.post(basePath + '/bots/:botName/webhook', async (req, res) => {
        const { botName } = req.params
        try {
            if (webhookDispatcher) await webhookDispatcher.dispatch(service, botName, req.body)
        } catch (err) {
            logger.error('route_error', {
                route: `${basePath}/bots/:botName/webhook`,
                botName,
                error: (err as Error)?.message,
            })
            res.status(500).send({ error: (err as Error).message })
        }
    })

    return router
}
