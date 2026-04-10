import { Context, Telegraf } from "telegraf";
import { InputFile } from "telegraf/types";
import { Bot as BaseBot, BotMessageOptions, GetUpdateOptions, BotWebhookUpdate, BotInstanceConfig } from "~/types";
export declare class TelegramBot extends BaseBot {
    protected createInstance(token: string, config?: BotInstanceConfig): Telegraf<Context>;
    sendMessage(chatId: number | string, text: string, options?: BotMessageOptions): Promise<boolean>;
    sendFile(chatId: number | string, file: InputFile | string, caption?: string, options?: BotMessageOptions): Promise<boolean>;
    editMessage(chatId: number | string, messageId: number, text: string, options?: BotMessageOptions): Promise<boolean>;
    editCaption(chatId: number | string, messageId: number, caption: string, options?: BotMessageOptions): Promise<boolean>;
    getUpdate(options?: GetUpdateOptions): Promise<any>;
    protected onStart(): void;
    protected onSubscribe(url: string, types?: string[]): Promise<boolean>;
    protected verifySecret(headers: Record<string, string | string[] | undefined>): boolean;
    protected convertWebhookUpdate(data: any): BotWebhookUpdate;
    private prepareKeyboard;
}
