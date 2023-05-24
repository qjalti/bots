import {Telegraf, session} from 'telegraf';
import {message} from 'telegraf/filters';
import {OGG} from '../src/ogg.js';
import {OPEN_AI} from '../src/openai.js';
import {
  CHAT_GPT_EXAMPLES,
  ERROR_MESSAGE,
  ANIMATED_STICKERS,
} from '../src/constants.js';
import * as dotenv from 'dotenv';

dotenv.config();

const INITIAL_SESSION = {
  messages: [],
};

const BOT = new Telegraf(process.env.TELEGRAM_TOKEN);
BOT.use(session());

const AUTHOR_TELEGRAM_ID = process.env.AUTHOR_TELEGRAM_ID;
const LOGS_CHAT_ID = process.env.LOGS_CHAT_ID;

BOT.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION;
});

BOT.command('new', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('История переписки сброшена');
});

BOT.command('examples', async (ctx) => {
  await ctx.reply(CHAT_GPT_EXAMPLES);
});

/**
 * Блок обработки войсов
 */
BOT.on(message('voice'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  await ctx.telegram.sendChatAction(ctx.chat.id, 'choose_sticker');
  let stickerMessageId = null;
  setTimeout(async () => {
    await ctx.replyWithAnimation(
        ANIMATED_STICKERS[Math.floor(
            Math.random() * ANIMATED_STICKERS.length,
        )], {
          disable_notification: true,
        }).then((res) => {
      stickerMessageId = res.message_id;
    });
  }, 1000);
  try {
    const LINK = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const USER_ID = String(ctx.message.from.id);
    const OGG_PATH = await OGG.create(LINK.href, USER_ID);
    const MP3_PATH = await OGG.toMP3(OGG_PATH, USER_ID);
    const TEXT = await OPEN_AI.transcription(MP3_PATH);
    await ctx.reply(`Я так понял Вы сказали:\n"${TEXT.data}"`);
    ctx.session.messages.push(
        {
          role: OPEN_AI.roles.USER, content: TEXT.data,
        },
    );
    const RESPONSE = await OPEN_AI.chat(ctx.session.messages);

    ctx.session.messages.push(
        {
          role: OPEN_AI.roles.ASSISTANT, content: RESPONSE.content,
        },
    );


    if (!TEXT.success) {
      await ctx.reply(ERROR_MESSAGE);
      await ctx.telegram.sendMessage(
          AUTHOR_TELEGRAM_ID,
          `У одного из пользователей произошла ошибка. Смотри логи`,
      );
      await ctx.telegram.sendMessage(
          LOGS_CHAT_ID,
          JSON.stringify(TEXT, null, 2),
      );
    } else {
      await ctx.reply(RESPONSE.content);
    }
    ctx.telegram.deleteMessage(ctx.chat.id, stickerMessageId);
  } catch (err) {
    console.log('Error while voice message sent. ', err.message);
  }
});

BOT.on(message('text'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  await ctx.telegram.sendChatAction(ctx.chat.id, 'choose_sticker');
  let stickerMessageId = null;
  setTimeout(async () => {
    await ctx.replyWithAnimation(
        ANIMATED_STICKERS[Math.floor(
            Math.random() * ANIMATED_STICKERS.length,
        )], {
          disable_notification: true,
        }).then((res) => {
      stickerMessageId = res.message_id;
    });
  }, 1000);
  try {
    ctx.session.messages.push(
        {
          role: OPEN_AI.roles.USER, content: ctx.message.text,
        },
    );
    const RESPONSE = await OPEN_AI.chat(ctx.session.messages);

    ctx.session.messages.push(
        {
          role: OPEN_AI.roles.ASSISTANT, content: RESPONSE.content,
        },
    );

    await ctx.reply(RESPONSE.content);

    ctx.telegram.deleteMessage(ctx.chat.id, stickerMessageId);
  } catch (err) {
    console.log('Error while voice message sent. ', err.message);
  }
});

BOT.on(message('video_note'), async (ctx) => {
  await ctx.reply('Обработка видеосообщений недоступна');
});
BOT.on(message('photo'), async (ctx) => {
  await ctx.reply('Обработка фотографий недоступна');
});
BOT.on(message('document'), async (ctx) => {
  await ctx.reply('Обработка документов недоступна');
});
BOT.on(message('location'), async (ctx) => {
  await ctx.reply('Обработка локаций недоступна');
});
BOT.on(message('audio'), async (ctx) => {
  await ctx.reply('Обработка аудио недоступна');
});

BOT.launch();

process.once('SIGINT', () => {
  BOT.stop('SIGINT');
});
process.once('SIGTERM', () => {
  BOT.stop('SIGTERM');
});
