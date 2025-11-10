import { MessengerService, BotEvent } from '~/types';
type ServiceRegistry = Map<string, MessengerService>;
export declare class ServiceManager {
    private services;
    registerService(service: MessengerService): this;
    getService(name: string): MessengerService;
    getServices(): ServiceRegistry;
    registerEvent(serviceName: string, botName: string, event: BotEvent): this;
    handleEvent(serviceName: string, botName: string | null, eventName: string, payload: unknown): Promise<void>;
    handleWebhook(serviceName: string, botName: string, update: any): Promise<void>;
}
export {};
