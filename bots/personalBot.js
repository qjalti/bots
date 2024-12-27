import {Telegraf} from 'telegraf';
// import {message} from 'telegraf/filters';

const bot = new Telegraf('7848218846:AAENqhrKuVqPC1RRR8B0RO-W2NGb3AUrlFE');

/* bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on(message('sticker'), (ctx) => ctx.reply('👍'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));*/

bot.on('business_message', async (context) => {
  const TEXT = context.update.business_message.text;
  const USER_ID = context.update.business_message.from.id;
  if (TEXT === '/my_id') {
    await context.telegram.sendMessage(
        context.update.business_message.chat.id,
        `Ваш ID: <code>${USER_ID}</code>`,
        {
          business_connection_id: context.update.business_message.business_connection_id,
          parse_mode: 'HTML',
        },
    );
  }
});

bot.launch(() => false);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
