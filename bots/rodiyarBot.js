import { Telegraf } from "telegraf";
import axios from "axios";
import cron from "node-cron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pLimit from "p-limit";
import axiosRetry from "axios-retry";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_FILE = path.join(__dirname, "statuses.json");
const SUBSCRIBERS_FILE = path.join(__dirname, "subscribers.json");
const limit = pLimit(5);

let isRunning = false;

axiosRetry(axios, {
  retries: 5,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (error.code === "ECONNABORTED") return false;
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status >= 500)
    );
  },
});

const BOT_TOKEN = process.env.RODIYAR_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("❌ Переменная окружения RODIYAR_BOT_TOKEN не задана!");
  process.exit(1);
}

const logAction = (logVar) => {
  const date = new Date().toLocaleString("ru-RU");
  console.log(`[${date}] ${logVar}`);
};

const SITES = [
  { name: "Patriot-CL", url: "https://patriot-cl.ru/" },
  { name: "Shvey-Dom", url: "https://shvey-dom.ru/" },
  { name: "RodiyarTech.Ru", url: "https://rodiyartech.ru/" },
  { name: "SNB", url: "https://snb.group/" },
  { name: "Rodiyar.Tech", url: "https://rodiyar.tech/" },
  { name: "Ohrana-Objective", url: "https://ohrana-objective.ru/" },
  { name: "ДИТ.Рф", url: "https://xn--d1ai4a.xn--p1ai/" },
  { name: "МК5.45", url: "https://mk5-45.ru/" },
  { name: "RodinaKB", url: "https://rodinakb.ru/" },
  { name: "Ohrana-RodinaSPB", url: "https://ohrana-rodinaspb.ru/" },
  { name: "BastionVolga", url: "https://bastionvolga.ru/" },
  { name: "GuardGroup", url: "https://guard-group.ru/" },
  { name: "UniGuard", url: "https://uni-guard.ru/" },
  { name: "OkrugSPB", url: "https://okrug-spb.ru/" },
  { name: "NABSkala", url: "https://nabskala.ru/" },
  { name: "RazvitPro", url: "https://razvit.pro/" },
  { name: "RealOhrana", url: "https://real-ohrana.ru/" },
  { name: "YarosvetGuard", url: "https://yarosvet-guard.com/" },
  { name: "OSNGroup", url: "https://osn-group.ru/" },
  { name: "KNB-3", url: "https://knb-3.ru/" },
  { name: "Rodiyar.Com", url: "https://rodiyar.com/" },
  { name: "NSK-Monolit", url: "https://nsk-monolit.ru/" },
];

SITES.forEach((site) => {
  site.url = site.url.trim();
});

const BOT = new Telegraf(BOT_TOKEN);

BOT.use((ctx, next) => {
  if (ctx.message?.text) {
    const senderId = ctx.from?.id ?? "unknown";
    const chatId = ctx.chat?.id ?? "unknown";
    const username = ctx.from?.username ? `@${ctx.from.username}` : "";
    const fullName =
      ctx.from?.first_name || ctx.from?.last_name
        ? `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim()
        : "no name";

    console.log(
      `[📩 Входящее сообщение] От: ID=${senderId} ${username} (${fullName}) | Чат: ${chatId} | Текст: "${ctx.message.text}"`,
    );
  }
  return next();
});

const loadSubscribers = async () => {
  try {
    const data = await fs.promises.readFile(SUBSCRIBERS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    await fs.promises.writeFile(SUBSCRIBERS_FILE, JSON.stringify({}, null, 2));
    return {};
  }
};

const saveSubscribers = async (subscribers) => {
  await fs.promises.writeFile(
    SUBSCRIBERS_FILE,
    JSON.stringify(subscribers, null, 2),
  );
};

const getSubscriberIds = async () => {
  const subs = await loadSubscribers();
  return Object.keys(subs).map(Number);
};

const loadStatuses = async () => {
  try {
    const data = await fs.promises.readFile(STATUS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    await fs.promises.writeFile(STATUS_FILE, JSON.stringify({}, null, 2));
    return {};
  }
};

const saveStatuses = async (statuses) => {
  await fs.promises.writeFile(STATUS_FILE, JSON.stringify(statuses, null, 2));
};

const getErrorDescription = (code) => {
  // if (typeof code === "number") {
  //   if (code === 400) return "некорректный запрос (400)";
  //   if (code === 401) return "неавторизован (401)";
  //   if (code === 403) return "доступ запрещён (403)";
  //   if (code === 404) return "страница не найдена (404)";
  //   if (code === 408) return "таймаут запроса (408)";
  //   if (code === 429) return "слишком много запросов (429)";
  //   if (code === 500) return "внутренняя ошибка сервера (500)";
  //   if (code === 502) return "ошибка ответа вышестоящего сервера (502)";
  //   if (code === 503) return "сервис недоступен (503)";
  //   if (code === 504) return "шлюз не ответил вовремя (504)";
  //   if (code >= 400 && code < 500) return "ошибка клиента (4xx)";
  //   if (code >= 500 && code < 600) return "внутренняя ошибка сервера (5xx)";
  //   return `неизвестный HTTP-статус ${code}`;
  // }

  switch (String(code)) {
    case "400":
      return "некорректный запрос (400)";
    case "401":
      return "неавторизован (401)";
    case "403":
      return "доступ запрещён (403)";
    case "404":
      return "страница не найдена (404)";
    case "408":
      return "таймаут запроса (408)";
    case "429":
      return "слишком много запросов (429)";
    case "500":
      return "внутренняя ошибка сервера (500)";
    case "502":
      return "Ошибка ответа вышестоящего сервера (502)";
    case "503":
      return "сервис недоступен (503)";
    case "504":
      return "шлюз не ответил вовремя (504)";

    case "ENOTFOUND":
      return "домен не найден";
    case "EAI_AGAIN":
      return "временный сбой DNS";
    case "ECONNREFUSED":
      return "соединение отклонено";
    case "ETIMEDOUT":
      return "таймаут соединения";
    case "EHOSTUNREACH":
      return "хост недоступен";
    case "ENETUNREACH":
      return "сеть недоступна";
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
    case "SELF_SIGNED_CERT_IN_CHAIN":
      return "самоподписанный SSL-сертификат";
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
      return "невозможно проверить SSL-сертификат";
    case "CERT_HAS_EXPIRED":
      return "срок действия SSL-сертификата истёк";
    case "CERT_NOT_YET_VALID":
      return "SSL-сертификат ещё не действителен";
    case "ERR_TLS_CERT_ALTNAME_INVALID":
      return "недопустимое имя в SSL-сертификате";
    case "ERR_INVALID_URL":
      return "некорректный URL";
    case "ERR_FR_TOO_MANY_REDIRECTS":
      return "слишком много перенаправлений";
    case "ERR_NETWORK":
      return "сетевая ошибка";
    case "ERR_BAD_RESPONSE":
      return "некорректный ответ сервера";
    case "ECONNABORTED":
      return "сайт временно перегружен";
    default:
      return code ? `неизвестная ошибка: ${code}` : "неизвестная ошибка";
  }
};

const checkSite = async (site) => {
  try {
    const response = await axios.get(site.url, {
      timeout: 60000,
      maxRedirects: 5,
      headers: {
        "User-Agent": `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; RodiyarMonitor/1.0)`,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
        Range: "bytes=0-0",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });
    const ok = response.status >= 200 && response.status < 400;
    return {
      ...site,
      ok,
      httpStatus: response.status,
      errorCode: String(response.status),
      description: getErrorDescription(response.status),
    };
  } catch (error) {
    let httpStatus = null;
    let errorCode = "UNKNOWN";

    if (error.response?.status) {
      httpStatus = error.response.status;
      errorCode = String(httpStatus);
    } else if (error.code) {
      errorCode = error.code;
    }

    const description = getErrorDescription(errorCode);

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
  const statuses = await loadStatuses();
  const results = await Promise.all(
    SITES.map((site) => limit(() => checkSite(site))),
  );
  let hasChanges = false;

  for (const result of results) {
    const wasOk = statuses[result.url] === true;
    const nowOk = result.ok;

    if (wasOk && !nowOk) {
      const statusText =
        result.errorCode === "ECONNABORTED"
          ? "⚠️ Сайт под интенсивной нагрузкой"
          : "🚨 Сайт упал";
      const link = `<a href="${result.url}">${result.name}</a>`;
      const codePart = result.httpStatus
        ? `<b>${result.httpStatus} (${result.errorCode})</b>`
        : `<b>${result.errorCode}</b>`;
      const message = `${statusText}!\n\n— ${link}: ${codePart} — ${result.description}`;

      const subscriberIds = await getSubscriberIds();
      for (const id of subscriberIds) {
        try {
          await BOT.telegram.sendMessage(id, message, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
          });
        } catch (err) {
          const errorMsg =
            err?.response?.error?.description || err.message || "";

          if (errorMsg.includes("bot was blocked by the user")) {
            console.log(
              `🗑️ Пользователь ${id} заблокировал бота — удаляем из подписчиков`,
            );
            const subscribers = await loadSubscribers();
            if (subscribers.hasOwnProperty(id)) {
              delete subscribers[id];
              await saveSubscribers(subscribers);
            }
          } else {
            console.error(`❌ Не удалось отправить в ${id}:`, errorMsg);
          }
        }
      }
      statuses[result.url] = false;
      hasChanges = true;
    } else if (!wasOk && nowOk) {
      const link = `<a href="${result.url}">${result.name}</a>`;
      const message = `✅ Сайт восстановлен!\n\n— ${link} снова работает`;

      const subscriberIds = await getSubscriberIds();
      for (const id of subscriberIds) {
        try {
          await BOT.telegram.sendMessage(id, message, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
          });
        } catch (err) {
          const errorMsg =
            err?.response?.error?.description || err.message || "";

          if (errorMsg.includes("bot was blocked by the user")) {
            console.log(
              `🗑️ Пользователь ${id} заблокировал бота — удаляем из подписчиков`,
            );
            const subscribers = await loadSubscribers();
            if (subscribers.hasOwnProperty(id)) {
              delete subscribers[id];
              await saveSubscribers(subscribers);
            }
          } else {
            console.error(`❌ Не удалось отправить в ${id}:`, errorMsg);
          }
        }
      }
      statuses[result.url] = true;
      hasChanges = true;
    }
  }

  if (hasChanges) {
    await saveStatuses(statuses);
  }
};

BOT.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const subscribers = await loadSubscribers();

  if (ctx.chat.type === "private") {
    const name = ctx.from?.first_name
      ? `${ctx.from.first_name} ${ctx.from.last_name || ""}`.trim()
      : `@${ctx.from?.username || "unknown"}`;
    subscribers[chatId] = { type: "private", name };
  } else {
    subscribers[chatId] = {
      type: ctx.chat.type,
      title: ctx.chat.title || "Без названия",
    };
  }

  await saveSubscribers(subscribers);

  const msg = `
🤖 <b>Привет! Я — бот мониторинга</b>

Вы подписаны на уведомления о недоступности сайтов:
• Patriot-CL.Ru
• Shvey-Dom.Ru
• RodiyarTech.Ru
• SNB.Group
• Rodiyar.Tech
• Ohrana-Objective.Ru
• ДИТ.Рф
• МК5.45
• RodinaKB
• Ohrana-RodinaSPB
• BastionVolga
• GuardGroup
• UniGuard
• OkrugSPB
• NABSkala
• RazvitPro
• RealOhrana
• YarosvetGuard
• OSNGroup
• KNB-3

🔔 Вы получите сообщение:
— если сайт упадёт (только один раз),
— когда он восстановится`;
  return ctx.replyWithHTML(msg, { disable_web_page_preview: true });
});

BOT.command("stop", async (ctx) => {
  const chatId = ctx.chat.id;
  const subscribers = await loadSubscribers();
  if (subscribers[chatId]) {
    delete subscribers[chatId];
    await saveSubscribers(subscribers);
    return ctx.reply("🔕 Вы отписались от уведомлений");
  }
  return ctx.reply("Вы не были подписаны.");
});

BOT.command("status", async (ctx) => {
  const results = await Promise.all(
    SITES.map((site) => limit(() => checkSite(site))),
  );
  const working = results.filter((r) => r.ok).length;
  const lines = results.map((r) => {
    const emoji = r.ok ? "✅" : "❌";
    const link = `<a href="${r.url}">${r.name}</a>`;
    if (r.ok) {
      return `${emoji} ${link}\n`;
    } else {
      const codePart = r.httpStatus
        ? `${r.httpStatus} (${r.errorCode})`
        : r.errorCode;
      return `${emoji} ${link}: <b>${codePart}</b> — ${r.description}\n`;
    }
  });
  const msg =
    `📊 Состояние (${working}/${SITES.length} работают):\n\n` +
    lines.join("\n");
  return ctx.replyWithHTML(msg, { disable_web_page_preview: true });
});

BOT.command("reload", async (ctx) => {
  await ctx.reply("🔄 Запускаю проверку...");
  const statusesBefore = await loadStatuses();
  const results = await Promise.all(
    SITES.map((site) => limit(() => checkSite(site))),
  );
  const statusesAfter = { ...statusesBefore };
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
    await saveStatuses(statusesAfter);
  }

  const working = results.filter((r) => r.ok).length;
  const lines = results.map((r) => {
    const emoji = r.ok ? "✅" : "❌";
    const link = `<a href="${r.url}">${r.name}</a>`;
    if (r.ok) {
      return `${emoji} ${link}\n`;
    } else {
      const codePart = r.httpStatus
        ? `${r.httpStatus} (${r.errorCode})`
        : r.errorCode;
      return `${emoji} ${link}: <b>${codePart}</b> — ${r.description}\n`;
    }
  });
  const msg =
    `📊 Ручная проверка завершена (${working}/${SITES.length}):\n\n` +
    lines.join("\n");
  return ctx.replyWithHTML(msg, { disable_web_page_preview: true });
});

BOT.on("message", async (ctx) => {
  if (
    ctx.message?.new_chat_members?.some((user) => user.id === ctx.botInfo.id)
  ) {
    const chatId = ctx.chat.id;
    const subscribers = await loadSubscribers();
    subscribers[chatId] = {
      type: ctx.chat.type,
      title: ctx.chat.title || "Новая группа",
    };
    await saveSubscribers(subscribers);
    ctx
      .reply(
        "✅ Бот добавлен! Буду присылать уведомления о недоступности сайтов",
      )
      .catch(() => {});
  }
});

cron.schedule("*/5 * * * *", async () => {
  if (isRunning) {
    logAction("⏭️ Пропускаю проверку — предыдущая ещё не завершена");
    return;
  }
  isRunning = true;
  try {
    await monitorSites();
  } finally {
    isRunning = false;
  }
});

BOT.launch().then(() => {
  console.log("🟢 Бот запущен и готов к работе");
});

process.once("SIGINT", () => BOT.stop("SIGINT"));
process.once("SIGTERM", () => BOT.stop("SIGTERM"));
