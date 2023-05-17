import {Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import config from 'config';
import {OGG} from '../src/ogg.js';
import {OPEN_AI} from '../src/openai.js';

const BOT = new Telegraf(config.get('TELEGRAM_TOKEN'));

const AUTHOR_TELEGRAM_ID = config.get('AUTHOR_TELEGRAM_ID');
const LOGS_CHAT_ID = config.get('LOGS_CHAT_ID');

BOT.on(message('voice'), async (ctx) => {
  try {
    const LINK = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const USER_ID = String(ctx.message.from.id);
    const OGG_PATH = await OGG.create(LINK.href, USER_ID);
    const MP3_PATH = await OGG.toMP3(OGG_PATH, USER_ID);
    const TEXT = await OPEN_AI.transcription(MP3_PATH);
    // const RESPONSE = await OPEN_AI.chat(TEXT);

    if (!TEXT.ok) {
      await ctx.reply(config.get('ERROR_MESSAGE'));
      await ctx.telegram.sendMessage(
          AUTHOR_TELEGRAM_ID,
          `У одного из пользователей произошла ошибка. Смотри логи`,
      );
      await ctx.telegram.sendMessage(
          LOGS_CHAT_ID,
          JSON.stringify(TEXT.data, null, 2),
      );
    } else {
      await ctx.reply(TEXT);
    }
  } catch (err) {
    console.log('Error while voice message sent. ', err.message);
  }
});

BOT.command('start', async (ctx) => {
  // await ctx.reply(JSON.stringify(ctx.message, null, 2));
});

BOT.command('examples', async (ctx) => {
  await ctx.reply(config.get('CHAT_GPT_EXAMPLES'));
});

BOT.launch();

process.once('SIGINT', () => {
  BOT.stop('SIGINT');
});
process.once('SIGTERM', () => {
  BOT.stop('SIGTERM');
});
