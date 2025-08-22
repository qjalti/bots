/**
 * Блок подключения модулей
 */
import {Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import dotenv from 'dotenv';
import CRON from 'node-cron';
import FS from 'fs';
import PATH from 'path';
import AXIOS from 'axios';
import moment from 'moment';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

/**
 * Settings
 */
dotenv.config();
moment.locale('ru');

/**
 * Constants
 */
const API_URI = process.env.CURRENCIES_API;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const bot = new Telegraf(process.env.BOT_TOKEN);

/**
 * Telegraf
 */
const MY_ID = 738829247;
const ORLOV_ALEXANDER_ID = 391884971;
// let lastMessageData = null;

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

          if (DATA.result === 'success') {
            EUR_RUB = DATA.conversion_rates.RUB / DATA.conversion_rates.EUR;
            USD_RUB = DATA.conversion_rates.RUB / DATA.conversion_rates.USD;
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
            QUERIES_LIMIT: DATA.result === 'success',
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
 * Парсит значения курсов валют и отправляет сообщение ботом.
 * @param {number} [chatId=MY_ID] Идентификатор чата,
 * куда будет отправлено сообщение.
 * По умолчанию используется значение MY_ID.
 * @return {Promise<void>} Функция не возвращает значений напрямую,
 * но выполняет асинхронные операции.
 * @throws {Error} Если произойдет ошибка при парсинге курсов валют
 * или отправке сообщения.
 */
const collectAndSendData = async (chatId = MY_ID) => {
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
  bot.telegram.sendMessage(MY_ID, MESSAGE).then(() => false);
};

/**
 * Send Alya notify to drink pills
 */
const sendAlyaMessage = async () => {
  const ALYA_TELEGRAM_ID = 272337232;
  bot.telegram.sendMessage(
      ALYA_TELEGRAM_ID,
      'ДЕД, ВЫПЕЙ ТАБЛЕТКИ!',
  )
      .then(() => false);
  bot.telegram.sendMessage(
      MY_ID,
      'ДЕД, ВЫПЕЙ ТАБЛЕТКИ!',
  )
      .then(() => false);
};

const seventeenthDay = () => {
  bot.telegram.sendMessage(
      MY_ID,
      'Передать показания счетчиков',
  )
      .then(() => false);
};

const upHHResume = () => {
  bot.telegram.sendMessage(
      MY_ID,
      `Поднять резюме на <a href='https://hh.ru/resume/a2f705e1ff09c57c830039ed1f423464753455' target='_blank'>hh</a>`,
      {
        parse_mode: 'HTML',
      },
  )
      .then(() => false);
};

const msgToMom = async () => {
  bot.telegram.sendMessage(
      MY_ID,
      `Написать <a href='https://wa.me/79892142176'>маме</a>`,
      {
        parse_mode: 'HTML',
        link_preview_options: {
          is_disabled: true,
        },
      },
  )
      .then(() => false);
};

const freeGiftCounter = async () => {
  bot.telegram.sendMessage(
      MY_ID,
      'Сброс бесплатного подарка',
  )
      .then(() => false);
};

const freeParkingSunday = async () => {
  bot.telegram.sendMessage(
      MY_ID,
      `🚙 Напоминание: сегодня воскресенье, а значит <a href="https://parking.mos.ru/parking/street/rules/">платная городская парковка (200 руб/час и дешевле)</a> — <strong>БЕСПЛАТНАЯ</strong>

<em>(но на всякий случай лучше перепроверять информацию в приложениях или на столбе)</em>`,
      {
        parse_mode: 'HTML',
      },
  )
      .then(() => false);
};

const tattooReady = async () => {
  const TATTOO_DATE = moment([2023, 9, 17, 22, 0]);

  const TD_YEARS = moment().diff(TATTOO_DATE, 'years');
  TATTOO_DATE.add(TD_YEARS, 'years');

  const TD_MONTHS = moment().diff(TATTOO_DATE, 'months');
  TATTOO_DATE.add(TD_MONTHS, 'months');

  const TD_DAYS = moment().diff(TATTOO_DATE, 'days');
  TATTOO_DATE.add(TD_DAYS, 'days');

  bot.telegram.sendMessage(
      MY_ID,
      'Тату было сделано ' +
    TD_YEARS +
    'y, ' +
    TD_MONTHS +
    'mo, ' +
    TD_DAYS +
    'd',
  )
      .then(() => false);
};

const moscowArrived = async () => {
  const ARRIVED_DATE = moment([2023, 9, 5, 13, 0]);

  const AD_YEARS = moment().diff(ARRIVED_DATE, 'years');
  ARRIVED_DATE.add(AD_YEARS, 'years');

  const AD_MONTHS = moment().diff(ARRIVED_DATE, 'months');
  ARRIVED_DATE.add(AD_MONTHS, 'months');

  const AD_DAYS = moment().diff(ARRIVED_DATE, 'days');
  ARRIVED_DATE.add(AD_DAYS, 'days');

  bot.telegram.sendMessage(
      MY_ID,
      'Переехал в Москву ' +
    AD_YEARS +
    'y, ' +
    AD_MONTHS +
    'mo, ' +
    AD_DAYS +
    'd',
  )
      .then(() => false);
};

const workFor = async () => {
  const WORK_FOR_DATE = moment([2024, 10, 1, 9, 0]);

  const WFD_YEARS = moment().diff(WORK_FOR_DATE, 'years');
  WORK_FOR_DATE.add(WFD_YEARS, 'years');

  const WFD_MONTHS = moment().diff(WORK_FOR_DATE, 'months');
  WORK_FOR_DATE.add(WFD_MONTHS, 'months');

  const WFD_DAYS = moment().diff(WORK_FOR_DATE, 'days');
  WORK_FOR_DATE.add(WFD_DAYS, 'days');

  bot.telegram.sendMessage(
      MY_ID,
      'Работаю в Rodiyar ' +
    WFD_YEARS +
    'y, ' +
    WFD_MONTHS +
    'mo, ' +
    WFD_DAYS +
    'd',
  )
      .then(() => false);
};

const lilacAge = async () => {
  const WORK_FOR_DATE = moment([2023, 2, 19, 15, 0]);

  const WFD_YEARS = moment().diff(WORK_FOR_DATE, 'years');
  WORK_FOR_DATE.add(WFD_YEARS, 'years');

  const WFD_MONTHS = moment().diff(WORK_FOR_DATE, 'months');
  WORK_FOR_DATE.add(WFD_MONTHS, 'months');

  const WFD_DAYS = moment().diff(WORK_FOR_DATE, 'days');
  WORK_FOR_DATE.add(WFD_DAYS, 'days');

  bot.telegram.sendMessage(
      MY_ID,
      'Возраст сирени ' +
    WFD_YEARS +
    'y, ' +
    WFD_MONTHS +
    'mo, ' +
    WFD_DAYS +
    'd',
  )
      .then(() => false);
};

const checkOil = async () => {
  const OIL_CHANGE_DATE = moment([2024, 11, 21, 0, 0]);

  const OCD_YEARS = moment().diff(OIL_CHANGE_DATE, 'years');
  OIL_CHANGE_DATE.add(OCD_YEARS, 'years');

  const OCD_MONTHS = moment().diff(OIL_CHANGE_DATE, 'months');
  OIL_CHANGE_DATE.add(OCD_MONTHS, 'months');

  const OCD_DAYS = moment().diff(OIL_CHANGE_DATE, 'days');
  OIL_CHANGE_DATE.add(OCD_DAYS, 'days');

  bot.telegram.sendMessage(
      MY_ID,
      'Менял масло в машине (56K km) ' +
    OCD_YEARS +
    'y, ' +
    OCD_MONTHS +
    'mo, ' +
    OCD_DAYS +
    'd',
  )
      .then(() => false);
};

const appartmentRent = async () => {
  const RENT_DATE = moment([2025, 1, 22, 10, 0]);

  const RD_YEARS = moment().diff(RENT_DATE, 'years');
  RENT_DATE.add(RD_YEARS, 'years');

  const RD_MONTHS = moment().diff(RENT_DATE, 'months');
  RENT_DATE.add(RD_MONTHS, 'months');

  const RD_DAYS = moment().diff(RENT_DATE, 'days');
  RENT_DATE.add(RD_DAYS, 'days');

  bot.telegram.sendMessage(
      MY_ID,
      'Арендовал квартиру ' +
    RD_YEARS +
    'y, ' +
    RD_MONTHS +
    'mo, ' +
    RD_DAYS +
    'd',
  )
      .then(() => false);
};

const sendTemperatureAndSunRiseData = async () => {
  const LA = '55.80852';
  const LO = '37.70758';

  const ROOM_TEMPERATURE_QUERY = await AXIOS.post(
      'https://qjalti.ru/api/arduino/select',
  );

  const OUTDOOR_TEMPERATURE_QUERY = await AXIOS.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${LA}&longitude=${LO}&current=temperature_2m`,
  );

  const SUNRISE_SUNSET_QUERY = await AXIOS.get(
      `https://api.sunrise-sunset.org/json?lat=${LA}&lng=${LO}&date=today&formatted=0&tzid=Europe/Moscow`,
  );

  const SUNRISE_TIME = new Date(
      SUNRISE_SUNSET_QUERY.data.results.sunrise,
  )
      .toLocaleString('ru-RU', {
        hour: 'numeric',
        minute: 'numeric',
      });
  const SUNSET_TIME = new Date(
      SUNRISE_SUNSET_QUERY.data.results.sunset,
  )
      .toLocaleString('ru-RU', {
        hour: 'numeric',
        minute: 'numeric',
      });

  const ROOM_TEMPERATURE = ROOM_TEMPERATURE_QUERY.data.data[0].temperature;
  const OUTDOOR_TEMPERATURE = OUTDOOR_TEMPERATURE_QUERY
      .data.current.temperature_2m +
    OUTDOOR_TEMPERATURE_QUERY.data.current_units.temperature_2m;

  await bot.telegram.sendMessage(
      MY_ID,
      `${OUTDOOR_TEMPERATURE} (outdoor)
${ROOM_TEMPERATURE}°C (room)
${SUNRISE_TIME} (sunrise)
${SUNSET_TIME} (sunset)`,
  );
};

const sendOrlovAlexanderMessage = async () => {
  const LA = '55.80852';
  const LO = '37.70758';

  const OUTDOOR_TEMPERATURE_QUERY = await AXIOS.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${LA}&longitude=${LO}&current=temperature_2m`,
  );

  const OUTDOOR_TEMPERATURE = OUTDOOR_TEMPERATURE_QUERY
      .data.current.temperature_2m +
    OUTDOOR_TEMPERATURE_QUERY.data.current_units.temperature_2m;

  await bot.telegram.sendMessage(
      MY_ID,
      `Температура на улице:
${OUTDOOR_TEMPERATURE}`,
  );

  await bot.telegram.sendMessage(
      ORLOV_ALEXANDER_ID,
      `Температура на улице:
${OUTDOOR_TEMPERATURE}`,
  );
};

const vacationLeft = async () => {
  const VACATION_DATE = moment([2025, 11, 9, 18, 0]);

  const VD_MONTHS = VACATION_DATE.diff(moment(), 'months');
  VACATION_DATE.subtract(VD_MONTHS, 'months');

  const VD_DAYS = VACATION_DATE.diff(moment(), 'days');

  bot.telegram.sendMessage(
      MY_ID,
      'До отпуска ' +
    VD_MONTHS +
    'mo, ' +
    VD_DAYS +
    'd',
  )
      .then(() => false);
};


/**
 * New message event
 */

bot.on(message('sticker'), (ctx) => {
  ctx.reply('`' + ctx.update.message.sticker.file_id + '`', {
    parse_mode: 'MarkdownV2',
  });
});

bot.on('message', async (ctx) => {
  const DIVIDER16 = `\n————————————————\n`;
  let logMessage = DIVIDER16;

  const MESSAGE_DATA = ctx.update.message;
  const CHAT_DATA = ctx.update.message.chat;
  const CHAT_ID = CHAT_DATA.id;
  const USER_NAME = `${CHAT_DATA.first_name ?
    CHAT_DATA.first_name :
    ' '} ${CHAT_DATA.last_name ?
    CHAT_DATA.last_name :
    ' '}`;

  logMessage += `${USER_NAME}, ${CHAT_ID}, ${CHAT_DATA.username}`;
  logMessage += DIVIDER16;
  logMessage += MESSAGE_DATA.text;
  logMessage += DIVIDER16;

  if (MESSAGE_DATA.text === '/start') {
    ctx.reply('Бот успешно запущен');
  } else if (MESSAGE_DATA.text === '/author') {
    await ctx.reply(`Привет!
Рад, что пользуешься моим функционалом!
Большое спасибо тебе!
Если у тебя есть какие-то вопросы — напиши моему автору:`);
    ctx.sendContact('+79883857654', 'Никита');
  } else if (MESSAGE_DATA.text === '/my_id') {
    ctx.reply('`' + CHAT_ID + '`', {
      parse_mode: 'MarkdownV2',
    });
  }
  if (CHAT_ID !== MY_ID) {
    await bot.telegram.sendMessage(-1001253575722, logMessage);
  }
});

/**
 * Настройка CRON
 */

/**
 * ┌────────────── second (optional)
 * │ ┌──────────── minute
 * │ │ ┌────────── hour
 * │ │ │ ┌──────── day of month
 * │ │ │ │ ┌────── month
 * │ │ │ │ │ ┌──── day of week (0-6 (SUN-MON))
 * │ │ │ │ │ │
 * │ │ │ │ │ │
 * 0 0 0 0 0 0
 */

/**
 * Every day at 5 AM
 */
CRON.schedule('0 5 * * *', collectAndSendData, {});

/**
 * Every day from 5 AM to 11 PM every 4 hours
 */
CRON.schedule('0 5-23/1 * * *', sendTemperatureAndSunRiseData, {});

/**
 * Every day from 5 AM to 11 PM every 4 hours
 */
CRON.schedule('0 5-23/4 * * *', upHHResume, {
  scheduled: false,
});

/**
 * On the 20th day of every month at 6:15 AM
 */
CRON.schedule('15 6 20 * *', seventeenthDay, {});

/**
 * On the 20th day of every month at 7:05 AM
 */
CRON.schedule('5 7 * * *', sendOrlovAlexanderMessage, {
  scheduled: true,
});

/**
 * Every 3rd day of the month at 7:30 AM
 */
CRON.schedule('30 7 */3 * *', checkOil, {});

/**
 * Every day at 9 AM
 */
CRON.schedule('0 9 * * *', sendAlyaMessage, {
  scheduled: true,
});

/**
 * Every day at 9:15 AM
 */
CRON.schedule('15 9 * * *', workFor, {});

/**
 * Every day at 9:45 AM
 */
CRON.schedule('45 9 * * *', msgToMom, {});

/**
 * Every day at 9:30 AM
 */
CRON.schedule('30 9 * * *', vacationLeft, {
  scheduled: true,
});

/**
 * Every sunday at 11 AM
 */
CRON.schedule('0 11 * * 0', freeParkingSunday, {});

/**
 * Every day at 12 PM
 */
CRON.schedule('0 12 * * *', appartmentRent, {});

/**
 * Every day at 1 PM
 */
CRON.schedule('0 13 * * *', moscowArrived, {});

/**
 * Every friday at 2:30 PM
 */
CRON.schedule('30 14 * * 5', freeGiftCounter, {});

/**
 * Every day at 3 PM
 */
CRON.schedule('0 15 * * *', collectAndSendData, {
  scheduled: false,
});

/**
 * Every day at 9 PM
 */
CRON.schedule('0 21 * * *', collectAndSendData, {
  scheduled: false,
});

/**
 * Every day at 9:15 PM
 */
CRON.schedule('15 21 * * *', lilacAge, {});

/**
 * Every day at 9:45 PM
 */
CRON.schedule('45 21 * * *', msgToMom, {});

/**
 * Every day at 10 PM
 */
CRON.schedule('0 22 * * *', tattooReady, {});

bot.launch().then(() => false);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
