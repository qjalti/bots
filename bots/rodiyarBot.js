import {Telegraf} from 'telegraf';
import axios from 'axios';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

// Определяем __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_FILE = path.join(__dirname, 'statuses.json');

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

// Загрузка состояния из файла
const loadStatuses = () => {
  if (!fs.existsSync(STATUS_FILE)) {
    const initial = {};
    SITES.forEach((site) => {
      initial[site.url] = true; // по умолчанию считаем, что всё работает
    });
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

// Сохранение состояния в файл
const saveStatuses = (statuses) => {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(statuses, null, 2));
};

const getErrorDescription = (code) => {
  // HTTP-статусы
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

  // Сетевые, DNS, SSL и системные ошибки
  switch (code) {
    // --- DNS ---
    case 'ENOTFOUND':
      return 'домен не найден';
    case 'EAI_AGAIN':
      return 'временный сбой DNS';
    case 'EAI_NODATA':
      return 'данные DNS отсутствуют';
    case 'EAI_NONAME':
      return 'некорректное имя хоста';

    // --- Соединение ---
    case 'ECONNREFUSED':
      return 'соединение отклонено';
    case 'ECONNRESET':
      return 'соединение сброшено';
    case 'EPIPE':
      return 'разорван канал передачи данных';
    case 'EHOSTUNREACH':
      return 'хост недоступен';
    case 'ENETUNREACH':
      return 'сеть недоступна';
    case 'EADDRINUSE':
      return 'адрес уже используется';
    case 'EADDRNOTAVAIL':
      return 'адрес недоступен';
    case 'EAFNOSUPPORT':
      return 'семейство адресов не поддерживается';

    // --- Таймауты ---
    case 'ETIMEDOUT':
      return 'таймаут соединения';
    case 'ETIME':
      return 'таймаут системного вызова';

    // --- SSL/TLS ---
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
      return 'недопустимое имя в SSL-сертификате (не совпадает домен)';
    case 'SSL_ERROR':
    case 'ERR_SSL_PROTOCOL_ERROR':
      return 'ошибка протокола SSL/TLS';

    // --- URL и редиректы ---
    case 'ERR_INVALID_URL':
      return 'некорректный URL';
    case 'ERR_FR_TOO_MANY_REDIRECTS':
      return 'слишком много перенаправлений';
    case 'ERR_BAD_REQUEST':
      return 'некорректный HTTP-запрос';
    case 'ERR_HTTP_HEADERS_SENT':
      return 'заголовки уже отправлены';
    case 'ERR_HTTP2_ERROR':
      return 'ошибка HTTP/2';
    case 'ERR_HTTP2_INVALID_SESSION':
      return 'недопустимая HTTP/2-сессия';

    // --- Axios-специфичные ---
    case 'ERR_NETWORK':
      return 'сетевая ошибка';
    case 'ERR_BAD_RESPONSE':
      return 'некорректный ответ сервера';
    case 'ERR_CANCELED':
      return 'запрос отменён';
    case 'ERR_DEPRECATED':
      return 'используется устаревший метод';

    // --- Прочие системные ---
    case 'EACCES':
      return 'доступ запрещён (нет прав)';
    case 'EEXIST':
      return 'файл/ресурс уже существует';
    case 'EISDIR':
      return 'ожидается файл, но это директория';
    case 'EMFILE':
      return 'превышено количество открытых файлов';
    case 'ENOENT':
      return 'файл или ресурс не найден';
    case 'ENOMEM':
      return 'недостаточно памяти';
    case 'ENOSPC':
      return 'нет свободного места на диске';
    case 'EPROTO':
      return 'ошибка протокола';
    case 'EROFS':
      return 'файловая система только для чтения';

    // --- Неизвестные ---
    default:
      return code ? `неизвестная ошибка: ${code}` : 'неизвестная ошибка';
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

  const statuses = loadStatuses();
  const results = await Promise.all(SITES.map(checkSite));
  let hasChanges = false;

  for (const result of results) {
    const wasOk = statuses[result.url] === true;
    const nowOk = result.ok;

    if (wasOk && !nowOk) {
      // Сайт упал — отправить уведомление
      const link = `<a href="${result.url}">${result.name}</a>`;
      const code = result.status || result.errorCode;
      const message = `🚨 Сайт упал!\n\n— ${link}: <b>${code}</b> — ${result.description}`;
      for (const chatId of CHAT_IDS) {
        try {
          await BOT.telegram.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          });
          console.log(`📤 Уведомление о падении отправлено в чат ${chatId}`);
        } catch (err) {
          console.error(`❌ Ошибка отправки в чат ${chatId}:`, err.message);
        }
      }
      statuses[result.url] = false;
      hasChanges = true;
    } else if (!wasOk && nowOk) {
      // Сайт восстановился
      const link = `<a href="${result.url}">${result.name}</a>`;
      const message = `✅ Сайт восстановлен!\n\n— ${link} снова работает.`;
      for (const chatId of CHAT_IDS) {
        try {
          await BOT.telegram.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          });
          console.log(`📤 Уведомление о восстановлении отправлено в чат ${chatId}`);
        } catch (err) {
          console.error(`❌ Ошибка отправки в чат ${chatId}:`, err.message);
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

cron.schedule('*/5 * * * *', monitorSites);

monitorSites().catch(console.error);

BOT.launch().catch(console.error);

process.once('SIGINT', () => BOT.stop('SIGINT'));
process.once('SIGTERM', () => BOT.stop('SIGTERM'));
