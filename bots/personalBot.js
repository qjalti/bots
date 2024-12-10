import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

const bot = new Telegraf('7848218846:AAENqhrKuVqPC1RRR8B0RO-W2NGb3AUrlFE')
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.on("business_message").filter(
  async (ctx) => {
    const conn = await ctx.getBusinessConnection();
    return ctx.from.id !== conn.user.id;
  },
  async (ctx) => {
    // Automatically respond to all customer questions.
    if (ctx.msg.text.endsWith("?")) {
      await ctx.reply("Soon.");
    }
  },
);
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
