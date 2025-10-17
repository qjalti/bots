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

// Очистка URL от пробелов
SITES.forEach((site) => {
  site.url = site.url.trim();
});

const BOT = new Telegraf(BOT_TOKEN);

const checkSite = async (site) => {
  try {
    const response = await axios.head(site.url, {timeout: 10_000});
    const ok = response.status >= 200 && response.status < 400;
    return {...site, ok, status: response.status, error: null};
  } catch (error) {
    let errorType = 'Unknown';

    if (error.code) {
      errorType = error.code;
    } else if (error.response?.status) {
      errorType = `HTTP ${error.response.status}`;
    }

    return {...site, ok: false, error: errorType};
  }
};

const monitorSites = async () => {
  console.log('🔍 Проверка доступности сайтов...');

  const results = await Promise.all(SITES.map(checkSite));
  const failed = results.filter((r) => !r.ok);

  if (failed.length > 0) {
    const messageLines = failed.map((f) => {
      const link = `<a href="${f.url}">${f.name}</a>`;
      return `— ${link}: <b>${f.error}</b>`;
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
