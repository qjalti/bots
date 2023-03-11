/**
 * Блок подключения модулей
 */
const VK_BOT = require('node-vk-bot-api');
const CRON = require('node-cron');
const MOMENT = require('moment');
const {Configuration, OpenAIApi} = require('openai');

/**
 * Блок настройки Moment
 */
MOMENT.locale('ru');

/**
 * Блок определения констант
 */
const PROD_CHAT_ID = 2000000004;
const DEV_CHAT_ID = 2000000003;
const TOKEN = 'vk1.a.W_e_xqnrJwDg-DYFxA9Gbmgbn-diyaYyEuL8I0dITwPGnKaTYrSFdW46e0CgQA_LPeuFAsoASp5RRaKkAGtWLwve3X3Pvdd3dWqGTDsdP0AEIs4u4L7sx6te-WCg2Len0ywK-zRBNWHPTGsSojFTPhs52BB1ghOMG11tcRqKeNchXugQuHu_mnVJrjFW2z-eqkiTgfja-KftVwmQsQDSfw';
const CHAT_ID = DEV_CHAT_ID;
const TRIGGER_TEXT = '[club210382674|@mutabor_action]';
const DEV_MODE = true;
const FIRST_MEET_PHOTOS = [
  'photo-210382674_457239317',
  'photo-210382674_457239141',
  'photo-210382674_457239143',
  'photo-210382674_457239363',
  'photo-210382674_457239206',
  'photo-210382674_457239234',
  'photo-210382674_457239251',
  'photo-210382674_457239352',
  'photo-210382674_457239364',
  'photo-210382674_457239375',
];

/**
 * Блок настройки VK bot
 */
const BOT = new VK_BOT(TOKEN);

/**
 * Блок Open AI API (ChatGPT)
 */
const sendOpenAIAPI = async () => {
  const OPENAI_API_KEY = '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';
  const CONFIGURATION = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(CONFIGURATION);
  const TEMPLATE = `Напиши текст по шаблону.
Поздравление: Сегодня знаменательное событие! Сегодня годовщина! Ровно ${parseYearText(YEARS_MF)} назад мы все встретились на занятии по актерскому мастерству! Под предводительством непревзойденной Антонины Германовны! Ура! УРА! УРААА!!!
Поздравление:`;

  try {
    const COMPLETION = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: TEMPLATE,
      temperature: 0.8,
      max_tokens: 1024,
    });
    return COMPLETION.data.choices[0].text;
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      return `Сегодня знаменательное событие! Ведь ровно ${parseYearText(YEARS_MF)} назад мы все встретились на занятии по актерскому мастерству! Под предводительством непревзойденной Антонины Германовны! Ура! УРА! УРААА!!!`;
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    }
  }
};

/**
 * Блок пользовательских функций
 */
/**
 * Определение числительного существительного
 * 1 год, 2 года, 5 лет
 * 21 год, 22 года, 25 лет
 * и т.п.
 * @param {number|string} years Количество лет
 * @return {string} Количество лет с числительным существительным
 */
const parseYearText = (years) => {
  if (years === 1) {
    return years + ' год';
  }
  if (years >= 2 && years < 5) {
    return years + ' года';
  }
  if (years >= 5) {
    return years + ' лет';
  }
};

/**
 * Отправвить информационное сообщение (о доступных функциях бота)
 */
const sendInfoMessage = async (ctx) => {
  const REPLY_TO_ID = ctx.message.peer_id;
  await BOT.sendMessage(REPLY_TO_ID, {
    random_id: Date.now(),
    message:
      `Привет!
Пока я знаю только такие команды:`,
    keyboard: JSON.stringify({
      inline: true,
      buttons: [
        [
          {
            action: {
              type: 'text',
              payload: {
                command: 'show_meet_time',
              },
              label: 'Узнать сколько времени знакомы',
            },
          },
        ],
        [
          {
            action: {
              type: 'open_app',
              app_id: 8044824,
              label: 'Мутабор. Всякий движ',
            },
          },
        ],
      ],
    }),
  });
};

/**
 * Отправить "сколько времени знакомы"
 */
const sendMeetTime = async () => {
  const CURRENT_DATE = MOMENT();
  const MUTABOR_FRIENDS = [2021, 1, 14, 15, 0];
  const MUTABOR_FRIENDS_DATE = MOMENT(MUTABOR_FRIENDS);
  const YEARS_MF = CURRENT_DATE.diff(MUTABOR_FRIENDS_DATE, 'years');
  MUTABOR_FRIENDS_DATE.add(YEARS_MF, 'years');
  const MONTHS_MF = CURRENT_DATE.diff(MUTABOR_FRIENDS_DATE, 'months');
  MUTABOR_FRIENDS_DATE.add(MONTHS_MF, 'months');
  const DAYS_MF = CURRENT_DATE.diff(MUTABOR_FRIENDS_DATE, 'days');
  MUTABOR_FRIENDS_DATE.add(DAYS_MF, 'days');
  const HOURS_MF = CURRENT_DATE.diff(MUTABOR_FRIENDS_DATE, 'hours');
  MUTABOR_FRIENDS_DATE.add(HOURS_MF, 'hours');
  const MINUTES_MF = CURRENT_DATE.diff(MUTABOR_FRIENDS_DATE, 'minutes');
  MUTABOR_FRIENDS_DATE.add(MINUTES_MF, 'minutes');

  return `Знакомы ${parseYearText(YEARS_MF)}, ${MONTHS_MF} мес, ${DAYS_MF} д, ${HOURS_MF} ч, ${MINUTES_MF} мин, (с ${MOMENT(MUTABOR_FRIENDS).format('Do MMMM YYYY, kk:mm:ss')})`;
};

/**
 * Отправить оповещение о годовщине первой встречи
 */
const sendFirstMeetNotify = async () => {
  const MESSAGE = await sendOpenAIAPI();
  await BOT.sendMessage(CHAT_ID, {
    random_id: Date.now(),
    message: `${MESSAGE} 🎈 🎉 🎊\n(текст написан нейросетью)`,
    attachment: FIRST_MEET_PHOTOS,
  });
};

/**
 * Блок настройки бота
 */
BOT.use(async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    console.error(e);
  }
});

BOT.command('/start', sendInfoMessage);

BOT.command('/meet_time', async (ctx) => {
  const REPLY_TO_ID = ctx.message.peer_id;
  const MEET_TIME = await sendMeetTime();
  await BOT.sendMessage(REPLY_TO_ID, {
    random_id: Date.now(),
    message: MEET_TIME,
  });
});

BOT.event('message_new', async (ctx) => {
  const REPLY_TO_ID = ctx.message.peer_id;
  if (ctx.message.payload) {
    if (JSON.parse(ctx.message.payload)) {
      const PAYLOAD = JSON.parse(ctx.message.payload);
      if (PAYLOAD.command === 'show_meet_time') {
        const MEET_TIME = await sendMeetTime();
        await BOT.sendMessage(REPLY_TO_ID, {
          random_id: Date.now(),
          message: MEET_TIME,
        });
      }
    }
  }
  if (ctx.message.text === TRIGGER_TEXT) {
    await sendInfoMessage(ctx);
  }
});

BOT.startPolling((err) => {
  if (err) {
    console.error(err);
  }
});

/**
 * Блок установки CRON
 */
if (DEV_MODE) {
  CRON.schedule('* * * * *', sendFirstMeetNotify, {});
}
CRON.schedule('15 15 14 2 *', sendFirstMeetNotify, {});
