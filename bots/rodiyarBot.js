import {Telegraf} from 'telegraf';
import axios from 'axios';
import cron from 'node-cron';

const BOT_TOKEN = process.env.RODIYAR_BOT_TOKEN;
const CHAT_ID = 738829247;

const SITES = [
  {name: 'Patriot-CL.Ru', url: 'https://patriot-cl.ru/'},
  {name: 'Shvey-Dom.Ru', url: 'https://shvey-dom.ru/'},
  {name: 'RodiyarTech.Ru', url: 'https://rodiyartech.ru/'},
  {name: 'SNB.Group', url: 'https://snb.group/'},
  {name: 'Rodiyar.Tech', url: 'https://rodiyar.tech/'},
  {name: 'Ohrana-Objective.Ru', url: 'https://ohrana-objective.ru/'},
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
monitorSites();

// Запуск бота
BOT.launch().then(() => false);

// Обработка завершения процесса
process.once('SIGINT', () => BOT.stop('SIGINT'));
process.once('SIGTERM', () => BOT.stop('SIGTERM'));
