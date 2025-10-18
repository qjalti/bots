import {Telegraf} from 'telegraf';
import axios from 'axios';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_FILE = path.join(__dirname, 'statuses.json');
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

const BOT_TOKEN = process.env.RODIYAR_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ Переменная окружения RODIYAR_BOT_TOKEN не задана!');
  process.exit(1);
}

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

const loadSubscribers = () => {
  if (!fs.existsSync(SUBSCRIBERS_FILE)) {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify({}));
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  } catch (e) {
    console.error('❌ Ошибка чтения subscribers.json, создаём заново');
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify({}));
    return {};
  }
};

const saveSubscribers = (subscribers) => {
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
};

const getSubscriberIds = () => {
  const subs = loadSubscribers();
  return Object.keys(subs).map(Number);
};

const loadStatuses = () => {
  if (!fs.existsSync(STATUS_FILE)) {
    const initial = {};
    SITES.forEach((site) => initial[site.url] = true);
    fs.writeFileSync(STATUS_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch (e) {
    console.error('❌ Ошибка чтения statuses.json, создаём заново');
    const initial = {};
    SITES.forEach((site) => initial[site.url] = true);
    fs.writeFileSync(STATUS_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
};

const saveStatuses = (statuses) => {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(statuses, null, 2));
};

const getErrorDescription = (code) => {
  if (typeof code === 'number') {
    if (code === 400) return 'некорректный запрос (400)';
    if (code === 401) return 'неавторизован (401)';
    if (code === 403) return 'доступ запрещён (403)';
    if (code === 404) return 'страница не найдена (404)';
    if (code === 408) return 'таймаут запроса (408)';
    if (code === 429) return 'слишком много запросов (429)';
    if (code === 500) return 'внутренняя ошибка сервера (500)';
    if (code === 502) return 'плохой шлюз (502)';
    if (code === 503) return 'сервис недоступен (503)';
    if (code === 504) return 'шлюз не ответил вовремя (504)';
    if (code >= 400 && code < 500) return 'ошибка клиента (4xx)';
    if (code >= 500 && code < 600) return 'внутренняя ошибка сервера (5xx)';
    return `неизвестный HTTP-статус ${code}`;
  }

  switch (code) {
    case 'ENOTFOUND':
      return 'домен не найден';
    case 'EAI_AGAIN':
      return 'временный сбой DNS';
    case 'ECONNREFUSED':
      return 'соединение отклонено';
    case 'ETIMEDOUT':
      return 'таймаут соединения';
    case 'EHOSTUNREACH':
      return 'хост недоступен';
    case 'ENETUNREACH':
      return 'сеть недоступна';
    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
    case 'SELF_SIGNED_CERT_IN_CHAIN':
      return 'самоподписанный SSL-сертификат';
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
      return 'невозможно проверить SSL-сертификат';
    case 'CERT_HAS_EXPIRED':
      return 'срок действия SSL-сертификата истёк';
    case 'CERT_NOT_YET_VALID':
      return 'SSL-сертификат ещё не действителен';
    case 'ERR_TLS_CERT_ALTNAME_INVALID':
      return 'недопустимое имя в SSL-сертификате';
    case 'ERR_INVALID_URL':
      return 'некорректный URL';
    case 'ERR_FR_TOO_MANY_REDIRECTS':
      return 'слишком много перенаправлений';
    case 'ERR_NETWORK':
      return 'сетевая ошибка';
    case 'ERR_BAD_RESPONSE':
      return 'некорректный ответ сервера';
    default:
      return code ? `неизвестная ошибка: ${code}` : 'неизвестная ошибка';
  }
};

const checkSite = async (site) => {
  try {
    const response = await axios.get(site.url, {
      timeout: 10_000,
      maxRedirects: 5,
      validateStatus: () => true, // не выбрасывать исключение по статусу
    });

    const isOkStatus = response.status >= 200 && response.status < 400;
    const hasKeyword = response.data.includes(site.keyword);

    if (!isOkStatus) {
      throw {response};
    }
    if (!hasKeyword) {
      throw new Error('MISSING_KEYWORD');
    }

    return {
      ...site,
      ok: true,
      httpStatus: response.status,
      errorCode: String(response.status),
      description: 'работает корректно',
    };
  } catch (error) {
    let httpStatus = null;
    let errorCode = 'UNKNOWN';

    if (error.response?.status) {
      httpStatus = error.response.status;
      errorCode = String(httpStatus);
    } else if (error.code) {
      errorCode = error.code;
    } else if (error.message === 'MISSING_KEYWORD') {
      errorCode = 'MISSING_KEYWORD';
    }

    const description = errorCode === 'MISSING_KEYWORD' ?
        'ключевое слово не найдено на странице' :
        getErrorDescription(errorCode);

    return {
      ...site,
      ok: false,
      httpStatus,
      errorCode,
      description,
    };
  }
};

const monitorSites = async () => {
  console.log('🔍 Проверка доступности сайтов...');

  const statuses = loadStatuses();
  const results = await Promise.all(SITES.map(checkSite));
  let hasChanges = false;

  for (const result of results) {
    const wasOk = statuses[result.url] === true;
    const nowOk = result.ok;

    if (wasOk && !nowOk) {
      const link = `<a href="${result.url}">${result.name}</a>`;
      const codePart = result.httpStatus ?
          `<b>${result.httpStatus} (${result.errorCode})</b>` :
          `<b>${result.errorCode}</b>`;
      const message = `🚨 Сайт упал!\n\n— ${link}: ${codePart} — ${result.description}`;

      const subscriberIds = getSubscriberIds();
      for (const id of subscriberIds) {
        try {
          await BOT.telegram.sendMessage(id, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          });
        } catch (err) {
          console.error(`❌ Не удалось отправить в ${id}:`, err.message);
        }
      }
      statuses[result.url] = false;
      hasChanges = true;
    } else if (!wasOk && nowOk) {
      const link = `<a href="${result.url}">${result.name}</a>`;
      const message = `✅ Сайт восстановлен!\n\n— ${link} снова работает.`;

      const subscriberIds = getSubscriberIds();
      for (const id of subscriberIds) {
        try {
          await BOT.telegram.sendMessage(id, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          });
        } catch (err) {
          console.error(`❌ Не удалось отправить в ${id}:`, err.message);
        }
      }
      statuses[result.url] = true;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    saveStatuses(statuses);
  }
};

BOT.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const subscribers = loadSubscribers();

  if (ctx.chat.type === 'private') {
    const name = ctx.from?.first_name ?
        `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim() :
        `@${ctx.from?.username || 'unknown'}`;
    subscribers[chatId] = {type: 'private', name};
  } else {
    subscribers[chatId] = {
      type: ctx.chat.type,
      title: ctx.chat.title || 'Без названия',
    };
  }

  saveSubscribers(subscribers);

  const msg = `
🤖 <b>Привет! Я — бот мониторинга</b>

Вы подписаны на уведомления о недоступности сайтов:
• Patriot-CL.Ru
• Shvey-Dom.Ru
• RodiyarTech.Ru
• SNB.Group
• Rodiyar.Tech
• Ohrana-Objective.Ru

🔔 Вы получите сообщение:
— если сайт упадёт (только один раз),
— когда он восстановится.

🛠 Команды:
• /status — текущее состояние
• /reload — проверить сейчас
• /stop — отписаться`;
  return ctx.replyWithHTML(msg, {disable_web_page_preview: true});
});

BOT.command('stop', (ctx) => {
  const chatId = ctx.chat.id;
  const subscribers = loadSubscribers();
  if (subscribers[chatId]) {
    delete subscribers[chatId];
    saveSubscribers(subscribers);
    return ctx.reply('🔕 Вы отписались от уведомлений.');
  }
  return ctx.reply('Вы не были подписаны.');
});

BOT.command('status', async (ctx) => {
  const results = await Promise.all(SITES.map(checkSite));
  const working = results.filter((r) => r.ok).length;
  const lines = results.map((r) => {
    const emoji = r.ok ? '✅' : '❌';
    const link = `<a href="${r.url}">${r.name}</a>`;
    if (r.ok) {
      return `${emoji} ${link}`;
    } else {
      const codePart = r.httpStatus ?
          `${r.httpStatus} (${r.errorCode})` :
          r.errorCode;
      return `${emoji} ${link}: <b>${codePart}</b> — ${r.description}`;
    }
  });
  const msg = `📊 Состояние (${working}/${SITES.length} работают):\n\n` + lines.join('\n');
  return ctx.replyWithHTML(msg, {disable_web_page_preview: true});
});

BOT.command('reload', async (ctx) => {
  await ctx.reply('🔄 Запускаю проверку...');
  const statusesBefore = loadStatuses();
  const results = await Promise.all(SITES.map(checkSite));
  const statusesAfter = {...statusesBefore};
  let hasChanges = false;

  for (const r of results) {
    const wasOk = statusesBefore[r.url] === true;
    const nowOk = r.ok;
    if (wasOk !== nowOk) {
      statusesAfter[r.url] = nowOk;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    saveStatuses(statusesAfter);
  }

  const working = results.filter((r) => r.ok).length;
  const lines = results.map((r) => {
    const emoji = r.ok ? '✅' : '❌';
    const link = `<a href="${r.url}">${r.name}</a>`;
    if (r.ok) {
      return `${emoji} ${link}`;
    } else {
      const codePart = r.httpStatus ?
          `${r.httpStatus} (${r.errorCode})` :
          r.errorCode;
      return `${emoji} ${link}: <b>${codePart}</b> — ${r.description}`;
    }
  });
  const msg = `📊 Ручная проверка завершена (${working}/${SITES.length}):\n\n` + lines.join('\n');
  return ctx.replyWithHTML(msg, {disable_web_page_preview: true});
});

BOT.on('message', (ctx) => {
  if (ctx.message?.new_chat_members?.some((user) => user.id === ctx.botInfo.id)) {
    const chatId = ctx.chat.id;
    const subscribers = loadSubscribers();
    subscribers[chatId] = {
      type: ctx.chat.type,
      title: ctx.chat.title || 'Новая группа',
    };
    saveSubscribers(subscribers);
    ctx.reply('✅ Бот добавлен! Буду присылать уведомления о недоступности сайтов.')
        .catch(() => {
        });
  }
});

cron.schedule('*/5 * * * *', monitorSites);
monitorSites().catch(console.error);
BOT.launch().then(() => {
  console.log('🟢 Бот запущен и готов к работе.');
});

process.once('SIGINT', () => BOT.stop('SIGINT'));
process.once('SIGTERM', () => BOT.stop('SIGTERM'));
