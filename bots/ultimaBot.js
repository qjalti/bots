/**
 * Блок подключения модулей
 */
import TelegramBot from 'node-telegram-bot-api';
import CRON from 'node-cron';
import FS from 'fs';
import PATH from 'path';
import AXIOS from 'axios';
import moment from 'moment';
import {fileURLToPath} from 'url';
import {dirname} from 'path';


/**
 * Блок определения констант
 */
const TEST_MODE = false;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

moment.locale('ru');

/**
 * Telegram bot
 */
const TOKEN = '7230407089:AAEItWerSIi0tQh2NPEDXsChmMz8WLxP74s';
const BOT = new TelegramBot(TOKEN, {polling: true});
const SEND_TO = 738829247;
const LOG_GROUP_ID = -1001253575722;
const GROUP_ID = -1002147555826;

/**
 * New message event
 */
BOT.on('message', async (msg) => {
  console.log(msg);
  const DIVIDER16 = `\n————————————————\n`;
  let logMessage = DIVIDER16;
  const CHAT_ID = msg.chat.id;
  const USER_NAME = `${msg.from.first_name ?
    msg.from.first_name :
    ' '} ${msg.from.last_name ?
    msg.from.last_name :
    ' '}`;

  logMessage += `${USER_NAME}, ${CHAT_ID}, ${msg.from.username}`;
  logMessage += DIVIDER16;
  logMessage += msg.text;
  logMessage += DIVIDER16;
  logMessage += msg;
  logMessage += DIVIDER16;

  /* BOT.sendMessage(
    CHAT_ID,
    `Привет!
Рад, что пользуешься моим функционалом!
Большое спасибо тебе!
Если у тебя есть какие-то вопросы — напиши моему автору:`,
  ).then(() => {
    BOT.sendContact(
      CHAT_ID,
      '+79883857654',
      'Никита',
    ).then(() => false);
  });*/

  if (CHAT_ID !== GROUP_ID) { // Логгирование сообщения
    await BOT.sendMessage(LOG_GROUP_ID, logMessage);
  }

  // -1002147555826
});

const freeParkingNotify = async () => {
  await BOT.sendMessage(
      GROUP_ID,
      `🚙 Напоминание автокурьерам: сегодня воскресенье, а значит <a href="https://parking.mos.ru/parking/street/rules/">платная городская парковка (200 руб/час и дешевле)</a> — <strong>БЕСПЛАТНАЯ</strong>

<em>(но на всякий случай лучше перепроверять информацию в приложениях или на столбе)</em>`,
      {
        disable_notification: true,
        parse_mode: 'HTML',
      },
  );
};

/**
 * Настройка CRON
 */
CRON.schedule('0 11 * * 0', freeParkingNotify, {});
