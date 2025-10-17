import {Telegraf} from 'telegraf';
import axios from 'axios';
import cron from 'node-cron';

const BOT_TOKEN = process.env.RODIYAR_BOT_TOKEN;
const CHAT_ID = 738829247;

const SITES = [
  'https://www.patriot-cl.ru',
  'https://shvey-dom.ru',
  'https://rodiyartech.ru',
  'https://snb.group',
  'https://rodiyar.tech',
  'https://ohrana-objective.ru',
];

const BOT = new Telegraf(BOT_TOKEN);

const checkSite = async (site) => {
  try {
    const response = await axios.head(site.url, {timeout: 10_000});
    return {...site, ok: response.status >= 200 && response.status < 400};
  } catch {
    return {...site, ok: false};
  }
};

const monitorSites = async () => {
  console.log('🔍 Проверка доступности сайтов...');

  const results = await Promise.all(SITES.map(checkSite));
  const failed = results.filter((r) => !r.ok);

  if (failed.length > 0) {
    const message =
      '🚨 Обнаружены недоступные сайты:\n\n' +
      failed.map((f) => `• ${f.name} — ${f.url}`).join('\n');

    try {
      await BOT.telegram.sendMessage(CHAT_ID, message);
      console.log(
          `📤 Отправлено уведомление о ${failed.length} недоступных сайтах`,
      );
    } catch (err) {
      console.error('❌ Ошибка отправки в Telegram:', err.message);
    }
  }
};

// Запуск проверки каждые 5 минут
cron.schedule('*/5 * * * *', monitorSites);

// Запуск бота
BOT.launch().then(() => false);

// Обработка завершения процесса
process.once('SIGINT', () => BOT.stop('SIGINT'));
process.once('SIGTERM', () => BOT.stop('SIGTERM'));
