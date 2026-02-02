import { Telegraf, Markup } from "telegraf";

const RECIPIENT_ID = 738829247;
const userState = new Map();
const BOT_TOKEN = process.env.FETT_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ Переменная окружения FETT_BOT_TOKEN не задана!");
  process.exit(1);
}

const BOT = new Telegraf(BOT_TOKEN);

const logAction = (ctx, action, extra = "") => {
  const { id, username, first_name } = ctx.from;
  const date = new Date().toLocaleString("ru-RU");
  console.log(
    `[${date}] [ID: ${id}] [@${username || "no_nick"}] [Имя: ${first_name}] -> ${action} ${extra}`,
  );
};

BOT.start((ctx) => {
  logAction(ctx, "Запустил бота");
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
  userState.set(ctx.from.id, rating);
  logAction(ctx, `Нажал на кнопку оценки: ${rating}`);

  ctx.answerCbQuery();
  ctx.reply(`Вы выбрали ${rating}. Напишите, пожалуйста, подробнее:`);
});

BOT.on("message", async (ctx) => {
  const rating = userState.get(ctx.from.id) || "Не указана";
  const user = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name;
  const text = ctx.message.text;

  logAction(ctx, `Прислал отзыв (Оценка: ${rating}):`, `"${text}"`);

  const message = `📩 *НОВЫЙ ОТЗЫВ*\n\nОценка: ⭐ ${rating}\n\nОтзыв:\n\`\`\`\n${ctx.message.text}\n\`\`\`\nОт: ${user}`;

  try {
    await BOT.telegram.sendMessage(RECIPIENT_ID, message, {
      parse_mode: "Markdown",
    });
    await ctx.reply("Спасибо! Ваш отзыв передан руководству.");
  } catch (e) {
    console.error("Ошибка отправки:", e);
  }
});

BOT.launch().then(() => console.log("Бот запущен!"));
