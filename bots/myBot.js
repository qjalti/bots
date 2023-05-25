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
const API_URI = 'http://data.fixer.io/api/latest?access_key=e0822236ff493bffebc732cbfc84eb8d&format=1';
const TEST_MODE = false;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

moment.locale('ru');

/**
 * Telegram bot
 */
const TOKEN = '2095103352:AAGsqtjMG-R9bTuDdgzKsEetMxWslt4xjXw';
const BOT = new TelegramBot(TOKEN, {polling: true});
const SEND_TO = 738829247;

/**
 * Блок определения функций
 */
/**
 * Парсинг буфера
 * @param {string} data Данные для дебуферизации
 * @return {string} Данные
 */
const bufferParse = (data) => {
  return Buffer.from(data).toString();
};

/**
 * Форматирование числа
 * @param {number|string}number Число
 * @param {string} currency Валюта USD | EUR
 * @return {string}
 */
const formatNumber = (number, currency) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(number);
};

/**
 * Отправить сообщение ботом
 * @param {string} botMessage Текст сообщения
 * @param {number|string} sendTo ID адресата
 */
const botSendMessage = (botMessage, sendTo = SEND_TO) => {
  BOT.sendMessage(sendTo, botMessage, {
    parse_mode: 'Markdown',
  })
      .then(() => false)
      .catch(() => {
        BOT.sendMessage(
            sendTo,
            `Возникла непредвиденная ошибка. Повторите попытку позже`,
        )
            .then(() => false);
      });
};

/**
 * Считать старые данные
 * @return {Promise} Promise with read data
 */
const readOldData = () => {
  return new Promise((resolve, reject) => {
    FS.readFile(
        PATH.join(__dirname, '..', 'data', 'myBot.json'),
        'utf-8',
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(bufferParse(data)));
          }
        });
  });
};

/**
 * Парсинг REST API курса валют
 * @return {Promise} Promise with AXIOS request
 */
const parseExchangeRates = () => {
  return new Promise((resolve) => {
    AXIOS.get(API_URI)
        .then(async (res) => {
          const DATA = res.data;

          let EUR_RUB;
          let USD_RUB;
          let EUR_SIGN;
          let USD_SIGN;

          /**
         * Получение старых данных и расчет разницы
         */
          const OLD_DATA = await readOldData();

          if (DATA.success) {
            EUR_RUB = DATA.rates.RUB;
            USD_RUB = DATA.rates.RUB / DATA.rates.USD;
          } else {
            EUR_RUB = OLD_DATA.EUR;
            USD_RUB = OLD_DATA.USD;
          }

          const EUR_DIFF = (EUR_RUB - OLD_DATA.EUR).toFixed(2);
          const USD_DIFF = (USD_RUB - OLD_DATA.USD).toFixed(2);

          if (Math.sign(EUR_DIFF)) {
            EUR_SIGN = `↑ ${EUR_DIFF}`;
          }
          if (Math.sign(EUR_DIFF) === -1) {
            EUR_SIGN = `↓ ${EUR_DIFF}`;
          }
          if (!Math.sign(EUR_DIFF)) {
            EUR_SIGN = `= ${EUR_DIFF}`;
          }

          if (Math.sign(USD_DIFF)) {
            USD_SIGN = `↑ ${USD_DIFF}`;
          }
          if (Math.sign(USD_DIFF) === -1) {
            USD_SIGN = `↓ ${USD_DIFF}`;
          }
          if (!Math.sign(USD_DIFF)) {
            USD_SIGN = `= ${USD_DIFF}`;
          }

          /**
         * Запись новой информации в файл
         */
          const NEW_DATA = {
            EUR: EUR_RUB,
            USD: USD_RUB,
            EUR_DIFF,
            USD_DIFF,
            SWING_PRICE: OLD_DATA.SWING_PRICE,
            QUERIES_LIMIT: DATA.success,
            USD_SIGN: USD_SIGN,
            EUR_SIGN: EUR_SIGN,
          };

          FS.writeFile(
              PATH.join(__dirname, '..', 'data', 'myBot.json'),
              JSON.stringify(NEW_DATA),
              (err) => {
                if (err) {
                  throw err;
                }
              });
          resolve(NEW_DATA);
        });
  });
};

/**
 * Сформировать приветствие в зависимости от времени суток
 * @return {string} Приветствие
 */
const getDayPart = () => {
  const CURRENT_DATE = new Date();
  if (CURRENT_DATE.getHours() === 5) {
    return 'Доброе утро';
  } else {
    return 'Добрый день';
  }
};

/**
 * Парсинг значений и отправка сообщения ботом
 */
const collectAndSendData = async () => {
  const EXCHANGE_RATES = await parseExchangeRates();

  const CURRENT_DAY_PART = getDayPart();
  const MESSAGE = `
${CURRENT_DAY_PART}, Никита!
${EXCHANGE_RATES.USD_SIGN}
${EXCHANGE_RATES.EUR_SIGN}

Курс${EXCHANGE_RATES.QUERIES_LIMIT ? '' : ' (лимит запросов исчерпан)'}:
${formatNumber(EXCHANGE_RATES.USD, 'USD')}
${formatNumber(EXCHANGE_RATES.EUR, 'EUR')}
`;
  botSendMessage(MESSAGE);
};

/**
 * Send Alya notify to drink pills
 */
const sendAlyaMessage = async () => {
  const ALYA_TELEGRAM_ID = 272337232;
  botSendMessage('ДЕД, ВЫПЕЙ ТАБЛЕТКИ!', ALYA_TELEGRAM_ID);
};

const upHHResume = async () => {
  await BOT.sendMessage(
      SEND_TO,
      `Поднять резюме на hh.ru\nhttps://hh.ru/resume/a2f705e1ff09c57c830039ed1f423464753455`,
  );
};

/**
 * New message event
 */
BOT.on('message', async (msg) => {
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

  if (msg.text === '/start') { // Если отправлена команда /start
    botSendMessage('Бот успешно запущен', CHAT_ID);
  } else if (msg.text === '/author') { // Если отправлена команда /author
    BOT.sendMessage(
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
    });
  } else if (msg.text === '/my_id') { // Если отправлена команда /my_id
    botSendMessage(`\`${msg.from.id}\``, CHAT_ID);
  } else if (msg.sticker && msg.from.id === SEND_TO) { // Получение ID стикера
    await BOT.sendMessage(SEND_TO, msg.sticker.file_id);
  }
  if (CHAT_ID !== SEND_TO) { // Логгирование сообщения
    await BOT.sendMessage(-1001253575722, logMessage);
  }
});

if (TEST_MODE) {
  collectAndSendData().then(() => false);
} else {
  /**
   * Настройка CRON
   */
  CRON.schedule('0 5 * * *', collectAndSendData, {});
  CRON.schedule('0 15 * * *', collectAndSendData, {});
  CRON.schedule('0 5 * * *', sendAlyaMessage, {});
  CRON.schedule('0 5-23/4 * * *', upHHResume, {});
  // CRON.schedule('45 8 * * *', msgToMom, {});
  // CRON.schedule('45 20 * * *', msgToMom, {});
}
