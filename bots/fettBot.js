import { Telegraf, Markup } from "telegraf";

const RECIPIENT_ID = -1003749640851;
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

const handleStartOrRate = (ctx) => {
  const payload = ctx.startPayload;

  userState.set(ctx.from.id, {
    rating: null,
    location: null,
  });

  logAction(
    ctx,
    "Запустил бота (или вызвал /rate)",
    payload ? `(payload: ${payload})` : "",
  );

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
};

BOT.start(handleStartOrRate);
BOT.command("rate", handleStartOrRate);

BOT.action(/^loc_(.+)$/, (ctx) => {
  const loc = ctx.match[1];

  if (!userState.has(ctx.from.id)) {
    userState.set(ctx.from.id, { rating: null, location: null });
  }

  const state = userState.get(ctx.from.id);

  state.location =
    loc === "myasnitskaya" ? "Мясницкая, 16" : "Рождественка 5/7, стр 2";

  logAction(ctx, "Выбрал адрес", state.location);

  ctx.answerCbQuery();
  ctx.reply(
    `Вы выбрали: ${state.location}\n\nОцените, пожалуйста, сервис или просто напишите ваш отзыв ниже 👇`,
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
  if (!userState.has(ctx.from.id)) {
    userState.set(ctx.from.id, { rating: null, location: null });
  }
  userState.get(ctx.from.id).rating = rating;

  logAction(ctx, `Нажал оценку`, rating);

  ctx.answerCbQuery();
  ctx.reply("Напишите, пожалуйста, отзыв:");
});

BOT.on("my_chat_member", (ctx) => {
  const chat = ctx.myChatMember.chat;
  const newStatus = ctx.myChatMember.new_chat_member.status;

  if (newStatus === "member" || newStatus === "administrator") {
    console.log(`[LOG] Бот добавлен в новый чат:`);
    console.log(`ID: ${chat.id}`);
    console.log(`Тип: ${chat.type}`);
    console.log(`Название: ${chat.title || "Личный чат"}`);
  }
});

BOT.on("message", async (ctx) => {
  if (ctx.message.text && ctx.message.text.startsWith("/")) return;

  let state = userState.get(ctx.from.id);

  if (!state) {
    state = { rating: null, location: null };
    userState.set(ctx.from.id, state);
  }

  const { first_name, last_name, username, id } = ctx.from;
  const fullName = [first_name, last_name].filter(Boolean).join(" ");
  const user = [fullName, username ? `(@${username})` : null, `[ID: ${id}]`]
    .filter(Boolean)
    .join(" ");

  if (!state.location) {
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

  const message = `📩 <strong>НОВЫЙ ОТЗЫВ</strong>

Адрес: <em>${state.location}</em>
Оценка: ⭐ ${state.rating || "Не указана"}

Отзыв:
<blockquote>${ctx.message.text || "Текст отсутствует"}</blockquote>

От: ${user}`;

  try {
    await BOT.telegram.sendMessage(RECIPIENT_ID, message, {
      parse_mode: "HTML",
    });
    await ctx.reply("✅ Спасибо! Ваш отзыв передан руководству");
    userState.delete(ctx.from.id);
    logAction(ctx, "Прислал отзыв и состояние очищено");
  } catch (e) {
    console.error("Ошибка отправки:", e);
  }
});

BOT.launch({
  allowedUpdates: ["message", "callback_query", "my_chat_member"],
}).then(() => console.log("🤖 Бот запущен"));
