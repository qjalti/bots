/**
 * Блок подключения модулей
 */
import TelegramBot from 'node-telegram-bot-api';
import CRON from 'node-cron';
import FS from 'fs';
import PATH from 'path';
import AXIOS from 'axios';
import {Configuration, OpenAIApi} from 'openai';
import moment from 'moment';
import {fileURLToPath} from 'url';
import {dirname} from 'path';


/**
 * Блок определения констант
 */
const API_URI = 'http://data.fixer.io/api/latest?access_key=e0822236ff493bffebc732cbfc84eb8d&format=1';
const TEST_MODE = false;
const ANIMATED_STICKERS = [
  'CAACAgIAAxkBAAIQkGQoXi5wEInigN9oa3w-PmobC01rAAI7AwACbbBCAwOCj__lcU91LwQ',
  'CAACAgIAAxkBAAIQnWQoYj3iWb4tvJxqpQMknItjkSUMAAIrAAMkcWIal6q7lIE88KUvBA',
  'CAACAgIAAxkBAAIQoWQoYrmkwEMrOb_3K3tipis1ve4IAALgAAOWn4wOUr49XZjLh8cvBA',
  'CAACAgEAAxkBAAIQo2QoYxMcOVT9rQIF56oxYFFY1jRpAAIeAQACOA6CEUZYaNdphl79LwQ',
  'CAACAgIAAxkBAAIQpWQoY0RzOCotDl5WaZKUdxbLa3CLAAIfCQACGELuCBeYBo77PzxmLwQ',
  'CAACAgIAAxkBAAIQp2QoY5AH8ZuuFOvnZveFCBh9-tSJAAJIAwACRxVoCSpzhrjTvmcdLwQ',
  'CAACAgIAAxkBAAIQqWQoY7TQdFdu3kgc9hdM_guOjrzxAAK6CAACCLcZAg4TYhWPCwe3LwQ',
  'CAACAgIAAxkBAAIQq2QoY_QC62QTTClJCS3fijVk6L2OAAKeAAPvaTEAASJ1KOYdKTkaLwQ',
  'CAACAgIAAxkBAAIQrWQoZAt8y7oq5AOarzNbTostrHe8AAIYAQACHwFMFe5Y4EwOFR4kLwQ',
  'CAACAgEAAxkBAAIQr2QoZCM58RAG-WYcW55o27-yYhbwAAKyCAACv4yQBPukvERwiE7xLwQ',
  'CAACAgIAAxkBAAIQs2QoZH5F0S8AAeNGsI2khBn6uI-ZNgACsgADmFw8HKwRjIWk-mobLwQ',
  'CAACAgIAAxkBAAIQt2QoZODnOT8LmGeUE0R2pAR3EwNzAALjAANWnb0KD_gizK2mCzcvBA',
  'CAACAgIAAxkBAAIQuWQoZSNHqT08-JmD21v_iqm90vimAAJ-AAPBnGAMCxR_3b0i_fMvBA',
  'CAACAgIAAxkBAAIQu2QoZUl7ck3X62OZN0M2we6V9EzRAAICAQACVp29Ck7ibIHLQOT_LwQ',
  'CAACAgIAAxkBAAIQvWQoZYx6AAFZRtfkBiB6JL42wfjE7AACQgcAAkb7rAR9WohAd-ZTzC8E',
  'CAACAgIAAxkBAAIQv2QoZZh2wVXusog4W4vh_v5B5zmYAAI1AAOvxlEae1tmbETOHzYvBA',
  'CAACAgIAAxkBAAIcTGRGhFAldQi-y2Yz_DuZhcQv30JfAAKvFAACBZOgSNo4y3ReLs91LwQ',
];
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
 * Блок Open AI API
 * @param {string} prompt API request text
 * @param {string} model AI model
 * @param {string} userData User data
 * @param {number} userId User id
 */
const sendOpenAIAPI = async (prompt, model = 'new', userData, userId) => {
  if (userId !== 738829247) {
    return `Бесплатный пробный период завершился 1 мая. Для продолжения пользования ChatGPT — напишите автору бота (/author)`;
  }

  const OPENAI_API_KEY = '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';
  // const OPENAI_API_KEY = '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';
  const CONFIGURATION = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(CONFIGURATION);

  try {
    if (model === 'new') {
      const COMPLETION = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {'role': 'system', 'content': `The user's name is ${userData}`},
          {
            'role': 'system',
            'content': `Current date is ${moment().format('LLLL')}`,
          },
          {'role': 'system', 'content': `User is from Russia`},
          {'role': 'system', 'content': `User speaks Russian`},
          {'role': 'user', 'content': prompt},
        ],
      });
      return COMPLETION.data.choices[0].message.content;
    } else if (model === 'old') {
      const COMPLETION = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        temperature: 0.8,
        max_tokens: 1024,
      });
      return COMPLETION.data.choices[0].text;
    }
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      if (error.response.status === 429) {
        return `Бесплатный пробный период завершился. ChatGPT отключен`;
      }
      return `Возникла непредвиденная ошибка. Повторите попытку позже`;
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      return `Возникла непредвиденная ошибка. Повторите попытку позже`;
    }
  }
};

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

          /**
         * Получение старых данных и расчет разницы
         */
          const OLD_DATA = await readOldData();

          if (DATA.success) {
            this.EUR_RUB = DATA.rates.RUB;
            this.USD_RUB = DATA.rates.RUB / DATA.rates.USD;
          } else {
            this.EUR_RUB = OLD_DATA.EUR;
            this.USD_RUB = OLD_DATA.USD;
          }

          const EUR_DIFF = (this.EUR_RUB - OLD_DATA.EUR).toFixed(2);
          const USD_DIFF = (this.USD_RUB - OLD_DATA.USD).toFixed(2);

          if (Math.sign(EUR_DIFF)) {
            this.EUR_SIGN = `↑ ${EUR_DIFF}`;
          }
          if (Math.sign(EUR_DIFF) === -1) {
            this.EUR_SIGN = `↓ ${EUR_DIFF}`;
          }
          if (!Math.sign(EUR_DIFF)) {
            this.EUR_SIGN = `= ${EUR_DIFF}`;
          }

          if (Math.sign(USD_DIFF)) {
            this.USD_SIGN = `↑ ${USD_DIFF}`;
          }
          if (Math.sign(USD_DIFF) === -1) {
            this.USD_SIGN = `↓ ${USD_DIFF}`;
          }
          if (!Math.sign(USD_DIFF)) {
            this.USD_SIGN = `= ${USD_DIFF}`;
          }

          /**
         * Запись новой информации в файл
         */
          const NEW_DATA = {
            EUR: this.EUR_RUB,
            USD: this.USD_RUB,
            EUR_DIFF,
            USD_DIFF,
            SWING_PRICE: OLD_DATA.SWING_PRICE,
            QUERIES_LIMIT: DATA.success,
            USD_SIGN: this.USD_SIGN,
            EUR_SIGN: this.EUR_SIGN,
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
 * Send Alya notify to drink pills (and copy to bot author)
 */
const sendAlyaMessage = async () => {
  const ALYA_TELEGRAM_ID = 272337232;

  botSendMessage('ДЕД, ВЫПЕЙ ТАБЛЕТКИ!', ALYA_TELEGRAM_ID);
};

const morningMessage = async () => {
  const KEYBOARD = [
    [
      {
        text: 'Новое пожелание',
        callback_data: 'morning_again',
      },
    ],
  ];

  const AI_PROMPT = `
Напиши моей маме Елене пожелание доброго утра и хорошего дня
А также напомни ей, что нужно беречь здоровье и делать перерывчики`;

  const AI_RESPONSE = await sendOpenAIAPI(AI_PROMPT, 'new', 'qjalti');
  await BOT.sendMessage(SEND_TO, AI_RESPONSE + `\nПозже созвонимся`, {
    reply_markup: {
      inline_keyboard: KEYBOARD,
    },
  },
  );
};

const eveningMessage = async () => {
  const KEYBOARD = [
    [
      {
        text: 'Новое пожелание',
        callback_data: 'evening_again',
      },
    ],
  ];

  const AI_PROMPT = `
Напиши моей маме Елене пожелание спокойной ночи и хороших снов`;

  const AI_RESPONSE = await sendOpenAIAPI(AI_PROMPT, 'new', 'qjalti');
  await BOT.sendMessage(SEND_TO, AI_RESPONSE + `\nДозавтриго`, {
    reply_markup: {
      inline_keyboard: KEYBOARD,
    },
  },
  );
};

const msgToMom = async () => {
  const CURRENT_DATE = new Date;
  const CURRENT_HOUR = CURRENT_DATE.getHours();
  if (CURRENT_HOUR === 8) {
    await morningMessage();
  } else if (CURRENT_HOUR === 20) {
    await eveningMessage();
  }
};

const upHHResume = async () => {
  await BOT.sendMessage(
      SEND_TO,
      `Поднять резюме на hh.ru\nhttps://hh.ru/resume/a2f705e1ff09c57c830039ed1f423464753455`,
  );
};

/**
 * CallBackQuery event
 */
BOT.on('callback_query', (ctx) => {
  if (ctx.data === 'morning_again') {
    morningMessage().then(() => false);
  }
});

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
    botSendMessage(`Привет! Этот бот перенаправляет сообщения чат-боту с искусственным интеллектом ChatGPT (GPT-3.5-TURBO)

Бот Telegram имеет не полный функционал взаимодействия с ChatGPT, например бот не умеет:
- обрабатывать голосовые сообщения/видеосообщения/вложения
- напоминать
- запоминать прошлые сообщения/узнавать пользователей

Источник ИИ (полный функционал):
https://chat.openai.com/`, CHAT_ID);
  } else if (msg.text === '/ai_di') { // Если отправлена команда /ai_di
    botSendMessage(
        `Напиши своё сообщение ниже:`,
        CHAT_ID,
    );
    BOT.sendChatAction(CHAT_ID, 'typing').then(() => false);
    const REQ_RESULT = await sendOpenAIAPI(msg.text, 'old', 'Unknown');
    logMessage += REQ_RESULT;
    logMessage += DIVIDER16;
    setTimeout(() => {
      botSendMessage(REQ_RESULT, CHAT_ID);
    }, 4000);
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
          'Qjalti',
      ).then(() => false);
    });
  } else if (msg.text === '/my_id') { // Если отправлена команда /my_id
    botSendMessage(`\`${msg.from.id}\``, CHAT_ID);
  } else if (msg.sticker && msg.from.id === SEND_TO) {
    await BOT.sendMessage(SEND_TO, msg.sticker.file_id);
  } else if (msg.chat.id !== -1001253575722 && msg.text) {
    BOT.sendChatAction(CHAT_ID, 'choose_sticker').then(() => false);
    let stickerMessageId = null;
    setTimeout(() => {
      BOT.sendAnimation(
          CHAT_ID,
          ANIMATED_STICKERS[Math.floor(
              Math.random() * ANIMATED_STICKERS.length,
          )], {
            disable_notification: true,
          }).then((res) => {
        stickerMessageId = res.message_id;
      });
    }, 1000);
    const REQ_RESULT = await sendOpenAIAPI(msg.text, 'new', USER_NAME, msg.from.id);
    logMessage += REQ_RESULT;
    logMessage += DIVIDER16;
    BOT.sendChatAction(CHAT_ID, 'typing').then(() => false);
    setTimeout(async () => {
      await BOT.deleteMessage(CHAT_ID, stickerMessageId);
      await botSendMessage(REQ_RESULT ?
          REQ_RESULT :
          `Возникла непредвиденная ошибка. Повторите попытку позже`,
      CHAT_ID);
    }, 4000);
  }
  if (CHAT_ID !== SEND_TO) {
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
