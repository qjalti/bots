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
${EXCHANGE_RATES.USD_SIGN} $
${EXCHANGE_RATES.EUR_SIGN} €

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
  botSendMessage('ДЕД, ВЫПЕЙ ТАБЛЕТКИ!', SEND_TO);
};

const seventeenthDay = async () => {
  botSendMessage('Передать показания счетчиков', SEND_TO);
};

const upHHResume = async () => {
  await BOT.sendMessage(
      SEND_TO,
      `Поднять резюме на <a href='https://hh.ru/resume/a2f705e1ff09c57c830039ed1f423464753455' target='_blank'>hh</a>`,
      {
        parse_mode: 'HTML',
      },
  );
};

const msgToMom = async () => {
  await BOT.sendMessage(
      SEND_TO,
      `Написать <a href='http://t.me/+79892142176'>маме</a>`,
      {
        parse_mode: 'HTML',
      },
  );
};

const freeParkingSunday = async () => {
  await BOT.sendMessage(
      SEND_TO,
      `🚙 Напоминание: сегодня воскресенье, а значит <a href="https://parking.mos.ru/parking/street/rules/">платная городская парковка (200 руб/час и дешевле)</a> — <strong>БЕСПЛАТНАЯ</strong>

<em>(но на всякий случай лучше перепроверять информацию в приложениях или на столбе)</em>`, {
        parse_mode: 'HTML',
      },
  );
};

const tattooReady = async () => {
  const TATTOO_DATE = moment([2023, 9, 17, 22, 0]);

  const TD_YEARS = moment().diff(TATTOO_DATE, 'years');
  TATTOO_DATE.add(TD_YEARS, 'years');

  const TD_MONTHS = moment().diff(TATTOO_DATE, 'months');
  TATTOO_DATE.add(TD_MONTHS, 'months');

  const TD_DAYS = moment().diff(TATTOO_DATE, 'days');
  TATTOO_DATE.add(TD_DAYS, 'days');

  await BOT.sendMessage(
      SEND_TO,
      'Тату было сделано ' +
    TD_YEARS +
    'y, ' +
    TD_MONTHS +
    'mo, ' +
    TD_DAYS +
    'd');
};

const moscowArrived = async () => {
  const ARRIVED_DATE = moment([2023, 9, 5, 13, 0]);

  const AD_YEARS = moment().diff(ARRIVED_DATE, 'years');
  ARRIVED_DATE.add(AD_YEARS, 'years');

  const AD_MONTHS = moment().diff(ARRIVED_DATE, 'months');
  ARRIVED_DATE.add(AD_MONTHS, 'months');

  const AD_DAYS = moment().diff(ARRIVED_DATE, 'days');
  ARRIVED_DATE.add(AD_DAYS, 'days');

  await BOT.sendMessage(
      SEND_TO,
      'Переехал в Москву ' +
    AD_YEARS +
    'y, ' +
    AD_MONTHS +
    'mo, ' +
    AD_DAYS +
    'd');
};

const checkOil = async () => {
  const OIL_CHANGE_DATE = moment([2023, 11, 21, 0, 0]);

  const OCD_YEARS = moment().diff(OIL_CHANGE_DATE, 'years');
  OIL_CHANGE_DATE.add(OCD_YEARS, 'years');

  const OCD_MONTHS = moment().diff(OIL_CHANGE_DATE, 'months');
  OIL_CHANGE_DATE.add(OCD_MONTHS, 'months');

  const OCD_DAYS = moment().diff(OIL_CHANGE_DATE, 'days');
  OIL_CHANGE_DATE.add(OCD_DAYS, 'days');

  await BOT.sendMessage(
      SEND_TO,
      'Менял масло в машине (57K km) ' +
    OCD_YEARS +
    'y, ' +
    OCD_MONTHS +
    'mo, ' +
    OCD_DAYS +
    'd');
};

const appartmentRent = async () => {
  const RENT_DATE = moment([2023, 11, 2, 13, 0]);

  const RD_YEARS = moment().diff(RENT_DATE, 'years');
  RENT_DATE.add(RD_YEARS, 'years');

  const RD_MONTHS = moment().diff(RENT_DATE, 'months');
  RENT_DATE.add(RD_MONTHS, 'months');

  const RD_DAYS = moment().diff(RENT_DATE, 'days');
  RENT_DATE.add(RD_DAYS, 'days');

  await BOT.sendMessage(
      SEND_TO,
      'Арендовал квартиру ' +
    RD_YEARS +
    'y, ' +
    RD_MONTHS +
    'mo, ' +
    RD_DAYS +
    'd');
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
  CRON.schedule('0 9 * * *', sendAlyaMessage, {});
  CRON.schedule('0 22 * * *', tattooReady, {});
  CRON.schedule('0 13 * * *', moscowArrived, {});
  CRON.schedule('0 12 * * *', appartmentRent, {});
  // CRON.schedule('0 5-23/4 * * *', upHHResume, {});
  CRON.schedule('45 9 * * *', msgToMom, {});
  CRON.schedule('45 21 * * *', msgToMom, {});
  CRON.schedule('0 11 * * 0', freeParkingSunday, {});
  CRON.schedule('15 7 17 * *', seventeenthDay, {});
  CRON.schedule('30 7 */3 * *', checkOil, {});
}
