import {Telegraf, session} from 'telegraf';
import {message} from 'telegraf/filters';
import {OGG} from '../src/ogg.js';
import {OPEN_AI} from '../src/openai.js';
import {
  CHAT_GPT_EXAMPLES,
  ERROR_MESSAGE,
  ANIMATED_STICKERS,
  AUTHOR_COMMAND,
  AUTHOR_TELEGRAM_ID,
  LOGS_CHAT_ID,
  HISTORY_CLEARED_MESSAGE, ERROR_429_MESSAGE,
} from '../src/constants.js';
import * as dotenv from 'dotenv';

/**
 * Constants definations
 */
const INITIAL_SESSION = {
  messages: [],
};
const SIXTEEN_DASHES = `----------------\n`;


/**
 * Modules configurations
 */
dotenv.config();
const BOT = new Telegraf(process.env.TELEGRAM_TOKEN);
BOT.use(session());

/**
 * Custom functions
 */

/**
 * Log message by send it to logs group
 * @param {string} message
 * @return {Promise<void>}
 */
const logMessage = async (message) => {
  await BOT.telegram.sendMessage(LOGS_CHAT_ID, message);
};

/**
 * Errors handler
 */
BOT.catch(async (error, ctx) => {
  console.error('Error:', error);
  await ctx.reply(ERROR_MESSAGE);
});

/**
 * Commands handler
 */
BOT.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION;
});
BOT.command('new', async (ctx) => {
  if (ctx.session) {
    ctx.session.messages = [];
    await ctx.reply('История переписки сброшена');
  } else {
    await ctx.reply('История переписка итак пустая');
  }
});
BOT.command('examples', async (ctx) => {
  await ctx.reply(CHAT_GPT_EXAMPLES);
});
BOT.command('my_id', async (ctx) => {
  await ctx.replyWithMarkdownV2(`\`${ctx.chat.id}\``);
});
BOT.command('author', async (ctx) => {
  await ctx.reply(AUTHOR_COMMAND);
  await ctx.sendContact('+79883857654', 'Никита');
});

/**
 * On voice only sent
 */
BOT.on(message('voice'), async (ctx) => {
  let log = SIXTEEN_DASHES;

  const USER_DATA = ctx.chat.id + ', ' + ctx.chat.username;
  const USER_ID = ctx.chat.id;

  log += USER_DATA + `\n`;
  log += SIXTEEN_DASHES;

  const LINK = await ctx.telegram.getFileLink(ctx.message.voice.file_id);

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
    const USER_ID_OGG = String(ctx.message.from.id);
    const OGG_PATH = await OGG.create(LINK.href, USER_ID_OGG);
    const MP3_PATH = await OGG.toMP3(OGG_PATH, USER_ID_OGG);
    const TEXT = await OPEN_AI.transcription(MP3_PATH);

    log += LINK + `\n` + SIXTEEN_DASHES;
    log += TEXT.data + `\n` + SIXTEEN_DASHES;

    await ctx.reply(`Я так понял Вы сказали:\n"${TEXT.data}"`);

    ctx.session.messages.push(
      {
        role: OPEN_AI.roles.USER, content: TEXT.data,
      },
    );

    const RESPONSE = await OPEN_AI.chat(ctx.session.messages);

    if (RESPONSE.code === 4) {
      sessionClear(ctx);
    }

    ctx.session.messages.push(
      {
        role: OPEN_AI.roles.ASSISTANT, content: RESPONSE.data.content,
      },
    );

    log += RESPONSE.data.content + `\n` + SIXTEEN_DASHES;

    if (RESPONSE.success) {
      await ctx.replyWithMarkdown(RESPONSE.data.content);
    } else if (RESPONSE.code === 4) {
      ctx.session.messages = [];
      await ctx.reply(HISTORY_CLEARED_MESSAGE);
    }

    if (USER_ID !== AUTHOR_TELEGRAM_ID) {
      await logMessage(log);
    }
    if (stickerMessageId) {
      await ctx.telegram.deleteMessage(ctx.chat.id, stickerMessageId);
    }
  } catch (err) {
    if (stickerMessageId) {
      await ctx.telegram.deleteMessage(ctx.chat.id, stickerMessageId);
    }
    ctx.reply(ERROR_MESSAGE);
    console.log('Error while voice message send: ', err.message, err);
  }
});

/**
 * On text only send
 */
BOT.on(message('text'), async (ctx) => {
  let log = SIXTEEN_DASHES;

  const USER_DATA = ctx.chat.id + ', ' + ctx.chat.username;
  const USER_ID = ctx.chat.id;

  log += USER_DATA + `\n`;
  log += SIXTEEN_DASHES;

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
    log += ctx.message.text + `\n` + SIXTEEN_DASHES;

    ctx.session.messages.push(
      {
        role: OPEN_AI.roles.USER, content: ctx.message.text,
      },
    );
    const RESPONSE = await OPEN_AI.chat(ctx.session.messages);

    ctx.session.messages.push(
      {
        role: OPEN_AI.roles.ASSISTANT, content: RESPONSE.data.content,
      },
    );

    log += RESPONSE.data.content + `\n` + SIXTEEN_DASHES;

    if (RESPONSE.success) {
      await ctx.replyWithMarkdown(RESPONSE.data.content);
    } else if (RESPONSE.code === 400) {
      ctx.session.messages = [];
      await ctx.reply(HISTORY_CLEARED_MESSAGE);
    } else if (RESPONSE.code === 429) {
      ctx.session.messages = [];
      await ctx.reply(ERROR_429_MESSAGE);
    }

    if (USER_ID !== AUTHOR_TELEGRAM_ID) {
      await logMessage(log);
    }
    if (stickerMessageId) {
      await ctx.telegram.deleteMessage(ctx.chat.id, stickerMessageId);
    }
  } catch (err) {
    if (stickerMessageId) {
      await ctx.telegram.deleteMessage(ctx.chat.id, stickerMessageId);
    }
    ctx.reply(ERROR_MESSAGE);
    console.log('Error while text message send: ', err.message, err);
  }
});

/**
 * Unsupported message types handlers
 */
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

BOT.launch().then(() => false);

process.once('SIGINT', () => {
  BOT.stop('SIGINT');
});
process.once('SIGTERM', () => {
  BOT.stop('SIGTERM');
});
