import {Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import config from 'config';
import cron from 'node-cron';
import {tonnesiVacation} from '../src/tonessiVacation.js';

const BOT = new Telegraf(config.get('TONESSI_BOT_TOKEN'));

const AUTHOR_TELEGRAM_ID = config.get('AUTHOR_TELEGRAM_ID');
const LOGS_CHAT_ID = config.get('LOGS_CHAT_ID');

BOT.command('start', async (ctx) => {
  await ctx.reply('Бот успешно запущен!');
});

BOT.on(message('text'), (ctx) => {
  console.log(ctx.message);
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

const sendMessage = async (message, id = AUTHOR_TELEGRAM_ID) => {
  await BOT.telegram.sendMessage(LOGS_CHAT_ID, message);
  await BOT.telegram.sendMessage(id, message);
};

const daysLeft = async () => {
  const DAYS_LEFT = tonnesiVacation.check();
  console.log(DAYS_LEFT);

  if (!(DAYS_LEFT % 2) && DAYS_LEFT && DAYS_LEFT <= 14) {
    await sendMessage(
        `${DAYS_LEFT} ${getDayWord(DAYS_LEFT)} до отпуска! 🌴 Отдых близко! 😎`,
        AUTHOR_TELEGRAM_ID,
    );
  } else if (!DAYS_LEFT) {
    await sendMessage(
        config.get('TONESSI_FIRST_VACATION_DAY'),
        AUTHOR_TELEGRAM_ID,
    );
    BOT.stop('Mission completed');
  }
};

BOT.launch().then(() => false);

process.once('SIGINT', () => {
  BOT.stop('SIGINT');
});

process.once('SIGTERM', () => {
  BOT.stop('SIGTERM');
});

cron.schedule('0 12 * * *', daysLeft, null);
