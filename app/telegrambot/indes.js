import config from 'config';
import TelegramBot from 'node-telegram-bot-api'

export const bot = new TelegramBot(config.get('telegram-api-key'), { polling: false });

// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;
//     console.log(msg);
//     bot.sendMessage(chatId, 'Received your message');
// });

export function sendIssue(message) {
    bot.sendMessage(config.get('telegram-chat-id'), message, { parse_mode: 'Markdown' });
}

console.log(config.get('telegram-api-key'));
