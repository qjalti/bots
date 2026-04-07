import { Telegraf, Markup } from "telegraf";

const RECIPIENT_ID = -1003823819498; // PROD
// const RECIPIENT_ID = -1003749640851; // DEV
const userState = new Map();
const BOT_TOKEN = process.env.FETT_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ Переменная окружения FETT_BOT_TOKEN не задана!");
  process.exit(1);
}

const BOT = new Telegraf(BOT_TOKEN);

const formatChannelMessage = (state, text = null) => {
  const reviewText = text ? text : "<i>(ожидание текста отзыва...)</i>";
  const fullName = [state.first_name, state.last_name]
    .filter(Boolean)
    .join(" ");
  const user = [
    fullName,
    state.username ? `(@${state.username})` : null,
    `[ID: ${state.id}]`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    `🆔 <strong>Отзыв №${state.reviewId}</strong>\n\n` +
    `📍 Адрес: <em>${state.location}</em>\n` +
    `⭐ Оценка: ${state.rating}\n\n` +
    `💬 Текст:\n<blockquote>${reviewText}</blockquote>\n\n` +
    `👤 От: ${user}`
  );
};

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

BOT.action(/rate_(\d)/, async (ctx) => {
  const rating = ctx.match[1];
  logAction(ctx, `Нажал оценку`, rating);
  const userId = ctx.from.id;

  const reviewId = Date.now().toString().slice(-5);

  userState.set(userId, {
    reviewId,
    rating,
    location: userState.get(userId)?.location || "Не указан",
    id: userId,
    username: ctx.from.username,
    first_name: ctx.from.first_name,
    last_name: ctx.from.last_name,
  });

  const state = userState.get(userId);
  ctx.answerCbQuery();

  try {
    const sentMsg = await ctx.telegram.sendMessage(
      RECIPIENT_ID,
      formatChannelMessage(state),
      { parse_mode: "HTML" },
    );

    state.lastChannelMsgId = sentMsg.message_id;

    await ctx.reply(
      `Вы поставили ${rating} ⭐. Теперь напишите текст отзыва, и я дополню сообщение в канале`,
    );
  } catch (e) {
    console.error("Ошибка при отправке оценки:", e);
  }
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

BOT.on("channel_post", (ctx) => {
  console.log("ID канала, где бот считал сообщение:", ctx.chat.id);
});

BOT.on("message", async (ctx) => {
  if (ctx.message.text && ctx.message.text.startsWith("/")) return;

  const state = userState.get(ctx.from.id);
  if (!state || !state.lastChannelMsgId) {
    return ctx.reply("Пожалуйста, сначала выберите оценку выше");
  }

  try {
    await ctx.telegram.editMessageText(
      RECIPIENT_ID,
      state.lastChannelMsgId,
      null,
      formatChannelMessage(state, ctx.message.text),
      { parse_mode: "HTML" },
    );

    const cleanChatId = RECIPIENT_ID.toString().replace("-100", "");

    const messageLink = `https://t.me/c/${cleanChatId}/${state.lastChannelMsgId}`;

    await ctx.telegram.sendMessage(
      RECIPIENT_ID,
      `📝 <strong>Дополнение к отзыву #${state.reviewId}</strong>\n` +
        `Пользователь прислал текст. <a href="${messageLink}">👉 Перейти к отзыву</a>`,
      { parse_mode: "HTML" },
    );

    await ctx.reply("✅ Спасибо! Ваш отзыв дополнен и передан руководству");
    userState.delete(ctx.from.id);
    logAction(ctx, "Прислал отзыв и состояние очищено");
  } catch (e) {
    console.error("Ошибка при обновлении отзыва:", e);
  }
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});

BOT.launch({
  allowedUpdates: ["message", "callback_query", "my_chat_member"],
})
  .then(() => console.log("🤖 Бот запущен"))
  .catch((err) => console.error("Ошибка запуска бота:", err));

process.once("SIGINT", () => BOT.stop("SIGINT"));
process.once("SIGTERM", () => BOT.stop("SIGTERM"));
