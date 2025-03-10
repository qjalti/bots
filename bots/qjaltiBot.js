const TELEGRAM_TOKEN = '7992334674:AAHwhpaBxpTSl2FNez9DYeuSzTz4jfPN8FU';

const {Telegraf} = require('telegraf');
const fs = require('fs');
const natural = require('natural'); // Библиотека для обработки текста
require('dotenv').config();

const bot = new Telegraf(TELEGRAM_TOKEN);

// Загрузка переписки из JSON
let messages = [];
try {
  const data = fs.readFileSync('../data/alya-chat.json', 'utf-8');
  const parsedData = JSON.parse(data);
  messages = parsedData.messages;
} catch (error) {
  console.error('Ошибка при чтении JSON файла:', error);
}

/**
 * Выполняет поиск по сообщениям в чате на основе переданного запроса
 * @param {string} query Строка запроса для поиска в сообщениях
 * @return {Array<Object>} Массив объектов, представляющих найденные сообщения,
 * которые содержат совпадающие слова с запросом
 * @example
 * searchChat('привет'); // Возвращает массив сообщений,
 * содержащих слово "привет"
 */
function searchChat(query) {
  const tokenizer = new natural.WordTokenizer();
  const queryTokens = tokenizer.tokenize(query.toLowerCase());

  // Ищем совпадения в сообщениях
  return messages.filter((msg) => {
    if (!msg.text) return false; // Пропускаем сообщения без текста
    const messageTokens = tokenizer.tokenize(msg.text.toLowerCase());
    // Проверяем, есть ли пересечение токенов
    return queryTokens.some((token) => messageTokens.includes(token));
  });
}

// function searchChat(query) {
//   const tokenizer = new natural.WordTokenizer();
//   const queryTokens = tokenizer.tokenize(query.toLowerCase());
//
//   // Ищем совпадения в сообщениях
//   const results = messages.filter((msg) => {
//     if (!msg.text) return false; // Пропускаем сообщения без текста
//     const messageTokens = tokenizer.tokenize(msg.text.toLowerCase());
//     // Проверяем, есть ли пересечение токенов
//     return queryTokens.some((token) => messageTokens.includes(token));
//   });
//
//   return results;
// }

// Обработка запросов пользователя
bot.on('text', async (ctx) => {
  const query = ctx.message.text;

  // Ищем в переписке
  const results = searchChat(query);

  if (results.length > 0) {
    let response = `Я нашел следующие упоминания:\n\n`;
    results.forEach((msg) => {
      response += `[${msg.date}] ${msg.user}: ${msg.text}\n`;
    });
    ctx.reply(response);
  } else {
    ctx.reply('К сожалению, я не нашел ничего по вашему запросу.');
  }
});

// Запуск бота
bot.launch()
    .then(() => console.log('Бот запущен!'))
    .catch((error) => console.error('Ошибка запуска бота:', error));

// Остановка при завершении работы
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
