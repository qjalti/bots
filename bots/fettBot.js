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
  const payload = ctx.startPayload;

  userState.set(ctx.from.id, {
    rating: null,
    location: null,
  });

  logAction(ctx, "Запустил бота", payload ? `(payload: ${payload})` : "");

  if (payload === "myasnitskaya") {
    userState.get(ctx.from.id).location = "Мясницкая, 16";
  }

  if (payload === "rozhdestvenka") {
    userState.get(ctx.from.id).location = "Рождественка 5/7, стр 2";
  }

  if (!payload) {
    return ctx.reply(
      "Выберите адрес, пожалуйста:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📍 Мясницкая, 16", "loc_myasnitskaya")],
        [
          Markup.button.callback(
            "📍 Рождественка 5/7, стр 2",
            "loc_rozhdestvenka",
          ),
        ],
      ]),
    );
  }

  ctx.reply(
    "Здравствуйте! Оцените, пожалуйста, наш сервис 👇",
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

BOT.action(/^loc_(.+)$/, (ctx) => {
  const state = userState.get(ctx.from.id);
  const loc = ctx.match[1];

  state.location =
    loc === "myasnitskaya" ? "Мясницкая, 16" : "Рождественка 5/7, стр 2";

  logAction(ctx, "Выбрал адрес", state.location);

  ctx.answerCbQuery();
  ctx.reply(
    "Спасибо! Теперь оцените сервис 👇",
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
  userState.get(ctx.from.id).rating = rating;

  logAction(ctx, `Нажал оценку`, rating);

  ctx.answerCbQuery();
  ctx.reply("Напишите, пожалуйста, отзыв:");
});

BOT.on("message", async (ctx) => {
  const state = userState.get(ctx.from.id);
  const user = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name;

  const message = `📩 *НОВЫЙ ОТЗЫВ*

Адрес: ${state.location || "Не указан"}
Оценка: ⭐ ${state.rating || "Не указана"}

Отзыв:
\`\`\`
${ctx.message.text}
\`\`\`
От: ${user}`;

  logAction(ctx, "Прислал отзыв");

  await BOT.telegram.sendMessage(RECIPIENT_ID, message, {
    parse_mode: "Markdown",
  });

  await ctx.reply("Спасибо! Ваш отзыв передан руководству.");
});

BOT.launch().then(() => console.log("🤖 Бот запущен"));
