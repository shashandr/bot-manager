import { Context, Telegraf } from "telegraf";
import { InputFile } from "telegraf/types";
import { Bot as BaseBot, BotMessageOptions, GetUpdateOptions, BotWebhookUpdate } from "~/types";
export declare class TelegramBot extends BaseBot {
    protected createInstance(token: string): Telegraf<Context>;
    sendMessage(chatId: number | string, text: string, options?: BotMessageOptions): Promise<boolean>;
    sendFile(chatId: number | string, file: InputFile | string, caption?: string, options?: BotMessageOptions): Promise<boolean>;
    editMessage(chatId: number | string, messageId: number, text: string, options?: BotMessageOptions): Promise<boolean>;
    editCaption(chatId: number | string, messageId: number, caption: string, options?: BotMessageOptions): Promise<boolean>;
    getUpdate(options?: GetUpdateOptions): Promise<any>;
    onStart(): void;
    convertWebhookUpdate(data: any): BotWebhookUpdate;
    private prepareKeyboard;
    private toCallbackData;
}
