/**
 * Блок подключения модулей
 */
import TelegramBot from 'node-telegram-bot-api';
import FS from 'fs';
import CRON from 'node-cron';
import MOMENT from 'moment';
import PATH from 'path';

/**
 * Блок определения констант
 */
const TEST_MODE = false;
const DATA_FILENAME = 'active_users.json';
const AUTHOR_TELEGRAM_ID = 738829247;
const MY_BOT_ID = 1087968824;
const MESSAGE_TO_NOT_ACTIVE_USERS = `
Привет! Что-то я смотрю, что ты ленивая жопа и не хочешь учить английский!
А ну быро написал хоть один пост! Через неделю проверю!
`;

/**
 * Настройки бота Telegram
 */
const TOKEN = '5871273249:AAE9il90C1TWFZJkXABpynysqSBZOQWb18U';
const BOT = new TelegramBot(TOKEN, {polling: true});
const CHAT_ID = -1001834442451;

/**
 * Блок пользовательских функций
 */
/**
 * Парсинг буфера
 * @param data Данные для дебуферизации
 * @return {string} Данные
 */
const bufferParse = (data) => {
  return Buffer.from(data).toString();
};

/**
 * Считать старые данные
 * @return {object} Данные из файла
 */
const readOldData = () => {
  return new Promise((resolve, reject) => {
    FS.readFile(PATH.join(__dirname, '..', 'data', DATA_FILENAME), 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(bufferParse(data)));
      }
    });
  });
};

/**
 * Записать данные в файл
 * @param new_data Данные для записи
 */
const writeNewData = async (new_data) => {
  await FS.writeFile(PATH.join(__dirname, '..', 'data', DATA_FILENAME), JSON.stringify(new_data), (err) => {
    if (err) {
      throw err;
    }
  });
};

const checkActiveUsers = async () => {
  const DATA = await readOldData();
  const NOT_ACTIVE_USERS = [];
  DATA.map((el) => {
    if (el.week_messages === 0) {
      NOT_ACTIVE_USERS.push(el.user_id);
    }
  });
  if (NOT_ACTIVE_USERS.length) {
    NOT_ACTIVE_USERS.map((el) => {
      BOT.sendMessage(el, MESSAGE_TO_NOT_ACTIVE_USERS);
    });
  }
  clearMessagesCount(DATA);
};

const clearMessagesCount = (data) => {
  data.map((el) => {
    el.week_messages = 0;
  });
  writeNewData(data);
};

const checkUserId = (array, user_id) => {
  return array.findIndex((cb) => {
    if (cb.user_id === user_id) {
      return cb;
    }
  });
};

const registerEnglish = async (user_id, user_signature) => {
  const OLD_DATA = await readOldData();
  const CHECK_STATUS = checkUserId(OLD_DATA, user_id);
  if (CHECK_STATUS === -1) {
    const NEW_DATA = OLD_DATA.filter((callback) => {
      if (callback.name !== user_signature) {
        return callback;
      }
    });
    NEW_DATA.push({
      name: user_signature,
      total_messages: 0,
      week_messages: 0,
      user_id,
    });
    await writeNewData(NEW_DATA);
    return true;
  } else {
    return false;
  }
};

/**
 * Обработка новых постов в канале
 * @param post Объект с данными о посте
 */
BOT.on('channel_post', async (post) => {
  console.log(post);
  const AUTHOR_SIGNATURE = post.author_signature;
  const OLD_DATA = await readOldData();
  const OBJ = OLD_DATA.find((o) => o.name === AUTHOR_SIGNATURE);
  if (OBJ) {
    OLD_DATA.find((el) => {
      if (el.name === AUTHOR_SIGNATURE) {
        el.total_messages = (el.total_messages) + 1;
        el.week_messages = (el.week_messages) + 1;
      }
    });
    writeNewData(OLD_DATA);
    // await BOT.sendMessage(CHAT_ID, JSON.stringify(OLD_DATA));
  } else {
    OLD_DATA.push({
      name: AUTHOR_SIGNATURE,
      total_messages: 1,
      week_messages: 1,
    });
    writeNewData(OLD_DATA);
    // await BOT.sendMessage(CHAT_ID, JSON.stringify(OLD_DATA));
  }
});

/**
 * Обработка всех входящих сообщений
 * @param callback Объект с данными о сообщении
 */
BOT.on('message', async (callback) => {
  if (callback.from.id !== MY_BOT_ID) {
    /**
     * Если команда /start
     */
    if (callback.text === '/myid') {
      BOT.sendMessage(callback.from.id, 'Ваш ID:').then(() => {
        BOT.sendMessage(callback.from.id, callback.from.id).then((r) => false);
      });
      BOT.sendMessage(AUTHOR_TELEGRAM_ID, `Пользователь с ID ${callback.from.id} запросил свой ID`).then((r) => false);
    } else if (callback.text === '/start') {
      BOT.sendMessage(AUTHOR_TELEGRAM_ID, `Пользователь с ID ${callback.from.id} (${callback.from.last_name ? callback.from.last_name + ' ' + callback.from.first_name : callback.from.first_name}) начал чат с ботом!`).then(() => {
        BOT.sendMessage(
            callback.from.id,
            `Привет!
Я могу подсказать тебе твой ID или зарегистрировать тебя в канале по изучению английского языка
Для выбора команд открой меню бота или используй команды:

/myid — узнать свой ID
/eng_reg — зарегистрироваться в канале по изучению английского языка

Если у тебя есть какие-то вопросы — напиши моему автору:`,
        ).then(() => {
          BOT.sendContact(
              callback.from.id,
              '+79883857654',
              'Qjalti',
          ).then(() => false);
        });
      });
    } else if (callback.text === '/eng_reg') {
      BOT.sendMessage(callback.from.id, 'Регистрация...').then(async () => {
        const START_TRIGGER = process.hrtime()[1];
        const SIGNATURE = callback.from.last_name ? callback.from.first_name + ' ' + callback.from.last_name : callback.from.first_name;
        const REG_STATUS = await registerEnglish(callback.from.id, SIGNATURE);
        const END_TRIGGER = process.hrtime()[1];
        const RUNTIME = (END_TRIGGER - START_TRIGGER) / 1000000;
        if (REG_STATUS) {
          BOT.sendMessage(callback.from.id, `Регистрация завершена! (за ${RUNTIME.toFixed(2)} мс)`).then(() => false);
        } else {
          BOT.sendMessage(callback.from.id, `Вы уже зарегистрированы`).then(() => false);
        }
      });
    } else if (callback.from.id !== 777000) {
      BOT.sendMessage(
          callback.from.id,
          `Привет!
Рад, что пользуешься моим функционалом!
Большое спасибо за это.
Если у тебя есть какие-то вопросы — напиши моему автору:`,
      ).then(() => {
        BOT.sendContact(
            callback.from.id,
            '+79883857654',
            'Qjalti',
        ).then(() => false);
      });
    }
  }
});

// BOT.getChat(CHAT_ID).then(r => console.log(r));

CRON.schedule('0 15 * * 0', checkActiveUsers, {});
// CRON.schedule('* * * * *', checkActiveUsers, {});
