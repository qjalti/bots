import {Telegraf, session} from 'telegraf';
import {message} from 'telegraf/filters';
import {OGG} from '../src/ogg.js';
import {OPEN_AI} from '../src/openai.js';
import {
  CHAT_GPT_EXAMPLES,
  ERROR_MESSAGE,
  ANIMATED_STICKERS,
  USERS_WHITELIST,
  AUTHOR_COMMAND,
} from '../src/constants.js';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

dotenv.config();

const INITIAL_SESSION = {
  messages: [],
};

const BOT = new Telegraf(process.env.TELEGRAM_TOKEN);
BOT.use(session());

const AUTHOR_TELEGRAM_ID = process.env.AUTHOR_TELEGRAM_ID;
const LOGS_CHAT_ID = process.env.LOGS_CHAT_ID;
const SIXTEEN_DASHES = `----------------\n`;

const logMessage = async (message) => {
  await BOT.telegram.sendMessage(LOGS_CHAT_ID, message);
};

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

BOT.command('my_id', async (ctx) => {
  await ctx.replyWithMarkdownV2(`\`${ctx.chat.id}\``);
});

BOT.command('author', async (ctx) => {
  await ctx.reply(AUTHOR_COMMAND);
  await ctx.sendContact('+79883857654', 'Никита');
});

/**
 * Блок обработки войсов
 */
BOT.on(message('voice'), async (ctx) => {
  let log = SIXTEEN_DASHES;
  const USER_DATA = ctx.chat.id + ', ' + ctx.chat.username;
  log += USER_DATA + `\n`;
  log += SIXTEEN_DASHES;
  const LINK = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
  if (USERS_WHITELIST.includes(ctx.chat.id)) {
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
      const USER_ID = String(ctx.message.from.id);
      const OGG_PATH = await OGG.create(LINK.href, USER_ID);
      const MP3_PATH = await OGG.toMP3(OGG_PATH, USER_ID);
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
      ctx.session.messages.push(
          {
            role: OPEN_AI.roles.ASSISTANT, content: RESPONSE.content,
          },
      );
      log += RESPONSE.content + `\n` + SIXTEEN_DASHES;

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
        await ctx.replyWithMarkdown(RESPONSE.content);
      }
      logMessage(log);
      await ctx.telegram.deleteMessage(ctx.chat.id, stickerMessageId);
    } catch (err) {
      console.log('Error while voice message sent. ', err.message);
    }
  } else {
    ctx.reply('У Вас нет доступа к этому боту. Для получения доступа' +
      ' обратитесь к автору бота (/author)');
    log += LINK + `\n` + SIXTEEN_DASHES;
    await logMessage(log);
  }
});

BOT.on(message('text'), async (ctx) => {
  let log = SIXTEEN_DASHES;
  const USER_DATA = ctx.chat.id + ', ' + ctx.chat.username;
  log += USER_DATA + `\n`;
  log += SIXTEEN_DASHES;
  if (USERS_WHITELIST.includes(ctx.chat.id)) {
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
            role: OPEN_AI.roles.ASSISTANT, content: RESPONSE.content,
          },
      );
      log += RESPONSE.content + `\n` + SIXTEEN_DASHES;

      await ctx.replyWithMarkdown(RESPONSE.content);
      logMessage(log);
      await ctx.telegram.deleteMessage(ctx.chat.id, stickerMessageId);
    } catch (err) {
      console.log('Error while voice message sent. ', err.message);
    }
  } else {
    ctx.reply('У Вас нет доступа к этому боту. Для получения доступа' +
      ' обратитесь к автору бота (/author)');
    await logMessage(log);
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

BOT.launch().then((r) => {
  console.log(chalk.green('Бот успешно запущен'));
  console.log(r);
});

process.once('SIGINT', () => {
  BOT.stop('SIGINT');
});
process.once('SIGTERM', () => {
  BOT.stop('SIGTERM');
});
