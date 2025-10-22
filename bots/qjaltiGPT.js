const TELEGRAM_TOKEN = "7992334674:AAHwhpaBxpTSl2FNez9DYeuSzTz4jfPN8FU";

import { Telegraf } from "telegraf";
import fs from "fs";
import natural from "natural"; // Библиотека для обработки текста
import dotenv from "dotenv";

dotenv.config();

const MAX_MESSAGE_LENGTH = 4000;
const bot = new Telegraf(TELEGRAM_TOKEN);

// Загрузка переписки из JSON
let messages = [];
try {
  const data = fs.readFileSync("data/alya-chat.json", "utf-8");
  const parsedData = JSON.parse(data);
  messages = parsedData.messages;
} catch (error) {
  console.error("Ошибка при чтении JSON файла:", error);
}

/**
 * Разбивает текст на массив сообщений с максимальной длиной каждого сообщения
 *
 * @param {string} text Исходный текст, который нужно разбить
 * @return {string[]} Массив строк, где каждая строка имеет длину не более
 * MAX_MESSAGE_LENGTH
 * @example
 * splitMessage('abcdefghij', 5); // ['abcde', 'fghij']
 */
function splitMessage(text) {
  const messages = [];
  while (text.length > 0) {
    messages.push(text.slice(0, MAX_MESSAGE_LENGTH));
    text = text.slice(MAX_MESSAGE_LENGTH);
  }
  return messages;
}

/**
 * Заменяет все символы 'ё' на 'е' в тексте
 * @param {string} text - Исходный текст для обработки
 * @return {string} - Текст, в котором все 'ё' заменены на 'е'
 */
function sanitizeText(text) {
  return text.replace(/ё/g, "е"); // Заменяет 'ё' на 'е'
}

/**
 * Очищает HTML-теги из текста, оставляя только разрешенные теги
 * (<strong>, <em>, <b>, <i>)
 * @param {string} text - Исходный текст с HTML-тегами
 * @return {string} - Текст без неразрешенных HTML-тегов
 */
function sanitizeHtml(text) {
  // Преобразуем все <strong> в правильный формат
  return text.replace(/<[^>]*>/g, (match) => {
    // Проверим, что тег открыт и закрыт правильно
    const tagName = match.replace(/[<>]/g, "").split(" ")[0];
    if (["strong", "em", "b", "i"].includes(tagName)) {
      return match;
    }
    return "";
  });
}

/**
 * Отправляет сообщение через бота, разбивая его на части при необходимости
 * @param {Object} bot - Экземпляр бота с методом telegram.sendMessage
 * @param {number|string} chatId - Идентификатор чата,
 * куда отправляется сообщение
 * @param {string} text - Текст сообщения для отправки
 * @return {Promise<void>} - Функция не возвращает значений напрямую,
 * но выполняет асинхронные операции
 */
async function sendMessage(bot, chatId, text) {
  const sanitizedText = sanitizeText(text); // Очистка текста перед отправкой
  const cleanText = sanitizeHtml(sanitizedText); // Очистка HTML перед отправкой
  const messages = splitMessage(cleanText);
  for (const message of messages) {
    try {
      await bot.telegram.sendMessage(chatId, message, {
        parse_mode: "HTML",
      });
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
    }
  }
}

/**
 * Выполняет поиск по сообщениям в чате на основе переданного запроса
 * @param {string} query Строка запроса для поиска в сообщениях
 * @return {Array<Object>} Массив объектов, представляющих найденные сообщения,
 * которые содержат совпадающие слова с запросом
 */
function searchChat(query) {
  const tokenizer = new natural.WordTokenizer();
  const queryTokens = tokenizer.tokenize(query.toLowerCase());

  // Ищем совпадения в сообщениях
  return messages.filter((msg) => {
    if (!msg.text || typeof msg.text !== "string") return false;
    const messageTokens = tokenizer.tokenize(msg.text.toLowerCase());
    // Проверяем, есть ли пересечение токенов
    return queryTokens.some((token) => messageTokens.includes(token));
  });
}

/**
 * Обрабатывает текстовые сообщения от пользователя,
 * выполняя поиск и отправку результатов
 * @param {Object} ctx Контекст сообщения,
 * содержащий информацию о чате и пользователе
 */
bot.on("text", async (ctx) => {
  const query = ctx.message.text;

  // Игнорируем команды (начинаются с '/')
  if (query.startsWith("/")) {
    ctx.reply("Команды пока не поддерживаются.");
    return;
  }

  // Ищем в переписке
  const results = searchChat(query);

  if (results.length > 0) {
    let response = `Я нашел следующие упоминания:\n\n`;
    results.forEach((msg) => {
      const dateTimeString = msg.date;
      const date = new Date(dateTimeString);
      const options = {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      const formattedDateTime = new Intl.DateTimeFormat(
        "ru-RU",
        options,
      ).format(date);

      response += `————————————————\n<strong>${formattedDateTime}</strong>\n<strong>${msg.from}</strong>:\n${msg.text}\n`;
    });
    response += `————————————————`;
    // Отправляем найденные сообщения
    sendMessage(bot, ctx.chat.id, response);
  } else {
    ctx.reply("К сожалению, я не нашел ничего по вашему запросу.");
  }
});

// Запуск бота
bot
  .launch()
  .then(() => console.log("Бот запущен!"))
  .catch((error) => console.error("Ошибка запуска бота:", error));

// Остановка при завершении работы
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
