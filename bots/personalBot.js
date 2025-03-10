import {Telegraf} from 'telegraf';
import dotenv from 'dotenv';
import AXIOS from 'axios';
import moment from 'moment';
// import {message} from 'telegraf/filters';

const API_URI = process.env.CURRENCIES_API;

moment.locale('ru');
dotenv.config();

const bot = new Telegraf(process.env.PERSONAL_BOT_TOKEN);

/**
 * Обработчик события 'business_message'
 *
 * @param {Context} ctx Контекст сообщения от Telegraf
 * @param {Object} ctx.update Объект обновления от Telegram
 * @param {Object} ctx.update.business_message Объект бизнес-сообщения
 * @param {string} ctx.update.business_message.text Текст сообщения
 * @param {Object} ctx.update.business_message.from Информация о отправителе
 * @param {number} ctx.update.business_message.from.id ID отправителя
 * @param {Object} ctx.update.business_message.chat Информация о чате
 * @param {number} ctx.update.business_message.chat.id ID чата
 * @param {string} ctx.update.business_message.business_connection_id ID
 * бизнес-соединения
 * Содержит информацию о сообщении, чате и других данных
 */
bot.on('business_message', async (ctx) => {
  /**
   * Получаем данные из контекста.
   */
  const {text} = ctx.update.business_message;
  const userId = ctx.update.business_message.from.id;
  const chatId = ctx.update.business_message.chat.id;
  const businessConnectionId =
    ctx.update.business_message.business_connection_id;

  /**
   * Если текст сообщения равен '/my_id', отправляем ID пользователя.
   */
  if (text === '/my_id') {
    await ctx.telegram.sendMessage(
        chatId,
        `Ваш ID: <code>${userId}</code>
(отправлено ботом)`,
        {
          business_connection_id: businessConnectionId,
          parse_mode: 'HTML',
        },
    );
  }
  if (text === '/currencies') {
    const RESPONSE = await AXIOS.get(API_URI);

    const DATA = RESPONSE.data;

    if (DATA.success) {
      await ctx.telegram.sendMessage(
          chatId,
          `$ ${(DATA.rates.RUB / DATA.rates.USD).toFixed(2)}
€ ${(DATA.rates.RUB).toFixed(2)}

(${moment(DATA.timestamp * 1000).fromNow()})

(отправлено ботом)`,
          {
            business_connection_id: businessConnectionId,
            parse_mode: 'HTML',
          },
      );
    }
  }
  if (text === '/help') {
    await ctx.telegram.sendMessage(
        chatId,
        `Помощь по командам бота:

<code>/currencies</code> — получить курс доллара и евро по отношению к рублю

<code>/my_id</code> — узнать Ваш ID в Telegram

(отправлено ботом)`,
        {
          business_connection_id: businessConnectionId,
          parse_mode: 'HTML',
        },
    );
  }
});

bot.launch().then(() => false);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
