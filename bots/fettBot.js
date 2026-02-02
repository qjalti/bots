import {Telegraf, Markup} from "telegraf";

const RECIPIENT_ID = 738829247;

const BOT_TOKEN = process.env.FETT_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ Переменная окружения FETT_BOT_TOKEN не задана!");
  process.exit(1);
}

const BOT = new Telegraf(BOT_TOKEN);

BOT.start((ctx) => {
  ctx.reply('Здравствуйте! Оцените, пожалуйста, наш сервис или просто напишите ваш отзыв ниже 👇',
    Markup.inlineKeyboard([
      [Markup.button.callback('⭐️ 1', 'click_rate'), Markup.button.callback('⭐️ 2', 'click_rate'), Markup.button.callback('⭐️ 3', 'click_rate')],
      [Markup.button.callback('⭐️ 4', 'click_rate'), Markup.button.callback('⭐️ 5', 'click_rate')]
    ])
  );
});

BOT.action('click_rate', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('Спасибо за оценку! Если хотите что-то добавить или рассказать о проблеме — просто напишите сообщение здесь.');
});

BOT.on('message', async (ctx) => {
  const feedback = ctx.message.text;
  const user = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

  await BOT.telegram.sendMessage(RECIPIENT_ID, `📩 Новый отзыв:\n\n"${feedback}"\n\nОт: ${user}`);

  await ctx.reply('Благодарим! Ваш отзыв передан администратору.');
});

BOT.launch().then(() => console.log('Бот запущен!'));