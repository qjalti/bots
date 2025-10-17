import {Telegraf} from 'telegraf';
import axios from 'axios';
import cron from 'node-cron';

const BOT_TOKEN = process.env.RODIYAR_BOT_TOKEN;

const CHAT_IDS = [
  738829247,
  -4802395189,
];

const SITES = [
  {name: 'Patriot-CL.Ru', url: 'https://patriot-cl.ru/'},
  {name: 'Shvey-Dom.Ru', url: 'https://shvey-dom.ru/'},
  {name: 'RodiyarTech.Ru', url: 'https://rodiyartech.ru/'},
  {name: 'SNB.Group', url: 'https://snb.group/'},
  {name: 'Rodiyar.Tech', url: 'https://rodiyar.tech/'},
  {name: 'Ohrana-Objective.Ru', url: 'https://ohrana-objective.ru/'},
];

SITES.forEach((site) => {
  site.url = site.url.trim();
});

const BOT = new Telegraf(BOT_TOKEN);

BOT.use((ctx, next) => {
  if (ctx.message?.text) {
    const senderId = ctx.from?.id ?? 'unknown';
    const chatId = ctx.chat?.id ?? 'unknown';
    const username = ctx.from?.username ? `@${ctx.from.username}` : '';
    const fullName = ctx.from?.first_name || ctx.from?.last_name ?
      `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim() :
      'no name';

    console.log(
        `[📩 Входящее сообщение] От: ID=${senderId} ${username} (${fullName}) | Чат: ${chatId} | Текст: "${ctx.message.text}"`,
    );
  }
  return next();
});

const getErrorDescription = (code) => {
  if (typeof code === 'number') {
    if (code >= 400 && code < 500) return 'ошибка клиента (4XX)';
    if (code >= 500 && code < 600) return 'внутренняя ошибка сервера (5XX)';
    return 'неизвестный HTTP-статус';
  }

  switch (code) {
    case 'ECONNREFUSED':
      return 'соединение отклонено';
    case 'ETIMEDOUT':
      return 'таймаут соединения';
    case 'ENOTFOUND':
      return 'домен не найден';
    case 'EHOSTUNREACH':
      return 'хост недоступен';
    case 'ENETUNREACH':
      return 'сеть недоступна';
    case 'EAI_AGAIN':
      return 'временный сбой DNS';
    case 'ERR_FR_TOO_MANY_REDIRECTS':
      return 'слишком много перенаправлений';
    case 'ERR_INVALID_URL':
      return 'некорректный URL';
    default:
      return 'неизвестная ошибка сети';
  }
};

const checkSite = async (site) => {
  try {
    const response = await axios.head(site.url, {timeout: 10_000});
    const ok = response.status >= 200 && response.status < 400;
    return {...site, ok, status: response.status, error: null};
  } catch (error) {
    let statusCode = null;
    let errorCode = 'UNKNOWN';

    if (error.response?.status) {
      statusCode = error.response.status;
      errorCode = statusCode;
    } else if (error.code) {
      errorCode = error.code;
    }

    const description = getErrorDescription(errorCode);

    return {
      ...site,
      ok: false,
      status: statusCode,
      errorCode,
      description,
    };
  }
};

const monitorSites = async () => {
  console.log('🔍 Проверка доступности сайтов...');

  const results = await Promise.all(SITES.map(checkSite));
  const failed = results.filter((r) => !r.ok);

  if (failed.length > 0) {
    const messageLines = failed.map((f) => {
      const code = f.status || f.errorCode;
      const link = `<a href="${f.url}">${f.name}</a>`;
      return `— ${link}: <b>${code}</b> — ${f.description}`;
    });

    const message = '🚨 Обнаружены недоступные сайты:\n\n' +
      messageLines.join('\n');

    for (const chatId of CHAT_IDS) {
      try {
        await BOT.telegram.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
        console.log(`📤 Уведомление отправлено в чат ${chatId}`);
      } catch (err) {
        console.error(`❌ Не удалось отправить в чат ${chatId}:`, err.message);
      }
    }
  }
};

cron.schedule('*/5 * * * *', monitorSites);

monitorSites().catch(console.error);

BOT.launch().catch(console.error);

process.once('SIGINT', () => BOT.stop('SIGINT'));
process.once('SIGTERM', () => BOT.stop('SIGTERM'));
