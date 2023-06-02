import {Telegraf} from 'telegraf';
import cron from 'node-cron';
import {tonessiVacation} from '../src/tonessiVacation.js';
import {
  AUTHOR_TELEGRAM_ID,
  LOGS_CHAT_ID,
  TONESSI_FIRST_VACATION_DAY,
  VACATION_MESSAGES,
} from '../src/constants.js';
import * as dotenv from 'dotenv';

dotenv.config();

const BOT = new Telegraf(process.env.TONESSI_BOT_TOKEN);

const SM_OPTIONS = {
  parse_mode: 'MarkdownV2',
};

BOT.command('start', async (ctx) => {
  await ctx.reply('Бот успешно запущен!');
});

const getDayWord = (number) => {
  if (number === 1) {
    return 'день';
  } else if (number >= 2 && number <= 4) {
    return 'дня';
  } else {
    return 'дней';
  }
};

const charsReplace = (innerString) => {
  return innerString.replace(/[.+!\-?^${}()|[\]\\,]/g, '\\$&');
};

const sendMessage = async (message, id = AUTHOR_TELEGRAM_ID) => {
  try {
    const REFORMATTED_MESSAGE = charsReplace(message);
    await BOT.telegram.sendMessage(LOGS_CHAT_ID, message, SM_OPTIONS);
    await BOT.telegram.sendMessage(id, REFORMATTED_MESSAGE, SM_OPTIONS);
  } catch (err) {
    console.log('Error! ', err.message);
  }
};

const daysLeft = async () => {
  const DAYS_LEFT = tonessiVacation.check();


  if (
    DAYS_LEFT % 2 === 0 &&
    DAYS_LEFT <= 14 &&
    DAYS_LEFT > 1
  ) {
    await sendMessage(
        `${DAYS_LEFT} ${getDayWord(DAYS_LEFT)} до отпуска! ${VACATION_MESSAGES[DAYS_LEFT]}`,
        AUTHOR_TELEGRAM_ID,
    );
  } else if (DAYS_LEFT === 0) {
    await sendMessage(
        TONESSI_FIRST_VACATION_DAY,
        AUTHOR_TELEGRAM_ID,
    );
  }
};

BOT.launch().then(() => false);

process.once('SIGINT', () => {
  BOT.stop('SIGINT');
});

process.once('SIGTERM', () => {
  BOT.stop('SIGTERM');
});

/**
 * Vacation
 */
cron.schedule('0 12 * * *', daysLeft, {});
