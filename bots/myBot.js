/**
 * Блок подключения модулей
 */
const TelegramBot = require('node-telegram-bot-api');
const CRON = require('node-cron');
const FS = require('fs');
const PATH = require('path');
const AXIOS = require('axios');
const {Configuration, OpenAIApi} = require('openai');

/**
 * Блок определения констант
 */
const API_URI = 'http://data.fixer.io/api/latest?access_key=e0822236ff493bffebc732cbfc84eb8d&format=1';
const TEST_MODE = false;
const LOG = false;
const OPEN_AI_MODEL = 'gpt-3.5-turbo';

/**
 * Telegram bot
 */
const TOKEN = '2095103352:AAGsqtjMG-R9bTuDdgzKsEetMxWslt4xjXw';
const BOT = new TelegramBot(TOKEN, {polling: true});
const SEND_TO = 738829247;

/**
 * Блок Open AI API
 * @param {string} model AI model
 * @param {string} prompt API request text
 */
const sendOpenAIAPI = async (model, prompt) => {
  const OPENAI_API_KEY = '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';
  const CONFIGURATION = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(CONFIGURATION);

  try {
    if (model === 'new') {
      const COMPLETION = await openai.createChatCompletion({
        model: OPEN_AI_MODEL,
        // prompt,
        messages: [{'role': 'user', 'content': prompt}],
        // temperature: 0.8,
        // max_tokens: 1024 // 1024
      });
      return COMPLETION.data.choices[0].message.content;
    } else if (model === 'old') {
      const TEMPLATE = `Напиши текст по шаблону:
Шаблон: ${prompt}
Текст:`;
      const COMPLETION = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: TEMPLATE,
        temperature: 0.8,
        max_tokens: 1024,
      });
      return COMPLETION.data.choices[0].text;
    }
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
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
  BOT.sendMessage(sendTo, botMessage).then((r) => {
    if (LOG) {
      console.log(r);
    }
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
  const TEXT = await sendOpenAIAPI(
      `Напомни моему дедушке выпить таблетки в стиле произведений Виктора Пелевина`,
  );
  const ALYA_TELEGRAM_ID = 272337232;

  botSendMessage(TEXT, ALYA_TELEGRAM_ID);
  botSendMessage(TEXT);
};

let aiReq = false;
let aiInitiator = false;
let aiModel = false;
/**
 * New message event
 */
BOT.on('message', async (msg) => {
  const CHAT_ID = msg.chat.id;
  botSendMessage(msg.text + '; ' + msg.from.first_name);
  if (aiReq && msg.chat.id === aiInitiator) {
    const REQ_RESULT = await sendOpenAIAPI(aiModel, msg.text);
    botSendMessage(REQ_RESULT, CHAT_ID);
    botSendMessage(REQ_RESULT);
    aiReq = false;
    aiInitiator = false;
  } else if (msg.text === '/ai') {
    botSendMessage(
        `Напиши своё сообщение искуственному интеллекту ChatGPT (gpt-3.5-turbo):`,
        CHAT_ID,
    );
    aiReq = true;
    aiInitiator = msg.chat.id;
    aiModel = 'new';
  } else if (msg.text === '/ai_di') {
    botSendMessage(
        `Напиши своё сообщение искуственному интеллекту GPT-3.5 (text-davinci-003):`,
        CHAT_ID,
    );
    aiReq = true;
    aiInitiator = msg.chat.id;
    aiModel = 'old';
  } else {
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
}
