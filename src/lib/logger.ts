import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

const loggerInstance = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDev
        ? {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' }
          }
        : undefined
})

export const logger = {
    info(message: string, fields?: Record<string, unknown>) {
        fields ? loggerInstance.info(fields, message) : loggerInstance.info(message)
    },
    error(message: string, fields?: Record<string, unknown>) {
        fields ? loggerInstance.error(fields, message) : loggerInstance.error(message)
    },
}
