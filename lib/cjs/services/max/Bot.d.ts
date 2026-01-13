import { Bot as MaxBotApi } from '@maxhub/max-bot-api';
import { Bot as BaseBot, BotMessageOptions, GetUpdateOptions, BotWebhookUpdate } from '~/types';
export declare class MaxBot extends BaseBot {
    protected createInstance(token: string): MaxBotApi;
    sendMessage(chatId: number | string, text: string, options?: BotMessageOptions): Promise<boolean>;
    sendFile(chatId: number | string, file: any, caption?: string, options?: BotMessageOptions): Promise<boolean>;
    editMessage(chatId: number | string, messageId: string, text: string, options?: BotMessageOptions): Promise<boolean>;
    editCaption(chatId: number | string, messageId: string, caption: string, options?: BotMessageOptions): Promise<boolean>;
    getUpdate(options?: GetUpdateOptions): Promise<any>;
    private prepareKeyboard;
    protected onStart(): void;
    protected convertWebhookUpdate(data: any): BotWebhookUpdate;
}
