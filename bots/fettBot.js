import { Telegraf, Markup } from "telegraf";

const RECIPIENT_ID = 738829247;
const userState = new Map();
const BOT_TOKEN = process.env.FETT_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ Переменная окружения FETT_BOT_TOKEN не задана!");
  process.exit(1);
}

const BOT = new Telegraf(BOT_TOKEN);

BOT.start((ctx) => {
  ctx.reply(
    "Здравствуйте! Оцените, пожалуйста, наш сервис или просто напишите ваш отзыв ниже 👇",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("⭐️ 1", "rate_1"),
        Markup.button.callback("⭐️ 2", "rate_2"),
        Markup.button.callback("⭐️ 3", "rate_3"),
      ],
      [
        Markup.button.callback("⭐️ 4", "rate_4"),
        Markup.button.callback("⭐️ 5", "rate_5"),
      ],
    ]),
  );
});

BOT.action(/rate_(\d)/, (ctx) => {
  const rating = ctx.match[1];
  userState.set(ctx.from.id, rating); // Запоминаем оценку

  ctx.answerCbQuery();
  ctx.reply(`Вы выбрали ${rating}. Напишите, пожалуйста, подробнее:`);
});

BOT.on("message", async (ctx) => {
  const rating = userState.get(ctx.from.id) || "Не указана";
  const user = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name;

  // Текст отзыва оборачиваем в тройные кавычки для MarkdownV2 или Markdown
  const message = `📩 *НОВЫЙ ОТЗЫВ*\n\nОценка: ⭐ ${rating}\n\nОтзыв:\n\`\`\`\n${ctx.message.text}\n\`\`\`\nОт: ${user}`;

  try {
    await bot.telegram.sendMessage(RECIPIENT_ID, message, {
      parse_mode: "Markdown",
    });
    await ctx.reply("Спасибо! Ваш отзыв передан руководству.");
  } catch (e) {
    console.error("Ошибка отправки:", e);
  }
});

BOT.launch().then(() => console.log("Бот запущен!"));
