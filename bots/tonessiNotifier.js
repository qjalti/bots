import { Telegraf } from "telegraf";
import cron from "node-cron";
import { tonessiPills } from "../src/tonessiPills.js";
import {
  AUTHOR_TELEGRAM_ID,
  LOGS_CHAT_ID,
  TONESSI_ID,
} from "../src/constants.js";
import * as dotenv from "dotenv";

dotenv.config();

const BOT = new Telegraf(process.env.TONESSI_NOTIFIER_TOKEN);

const SM_OPTIONS = {
  parse_mode: "MarkdownV2",
};

BOT.command("start", async (ctx) => {
  await ctx.reply(`Бот успешно запущен!`);
});

const charsReplace = (innerString) => {
  return innerString.replace(/[.+!\-?^${}()|[\]\\,]/g, "\\$&");
};

const sendMessage = async (message, id = AUTHOR_TELEGRAM_ID) => {
  try {
    const REFORMATTED_MESSAGE = charsReplace(message);
    const RESPONSE = await BOT.telegram.sendMessage(
      id,
      REFORMATTED_MESSAGE,
      SM_OPTIONS,
    );
    await BOT.telegram.sendMessage(
      LOGS_CHAT_ID,
      REFORMATTED_MESSAGE,
      SM_OPTIONS,
    );
    await BOT.telegram.sendMessage(
      LOGS_CHAT_ID,
      JSON.stringify(RESPONSE, null, 2),
    );
    await BOT.telegram.sendMessage(
      AUTHOR_TELEGRAM_ID,
      REFORMATTED_MESSAGE,
      SM_OPTIONS,
    );
  } catch (err) {
    await BOT.telegram.sendMessage(id, err.message, SM_OPTIONS);
    console.log("Error! ", err.message, err);
  }
};

const takePills = async () => {
  const MESSAGE = await tonessiPills.parsePillsList();
  if (MESSAGE !== false) {
    await sendMessage(MESSAGE, TONESSI_ID); // TODO DEV & PROD
  }
};

BOT.launch().then(() => false);

process.once("SIGINT", () => {
  BOT.stop("SIGINT");
});

process.once("SIGTERM", () => {
  BOT.stop("SIGTERM");
});

/**
 * Pills
 */
cron.schedule("0 9 * * *", takePills, {});

cron.schedule("0 12 * * *", takePills, {});
cron.schedule("30 12 * * *", takePills, {});
cron.schedule("30 14 * * *", takePills, {});
cron.schedule("30 15 * * *", takePills, {});

cron.schedule("0 18 * * *", takePills, {});
cron.schedule("0 19 * * *", takePills, {});
cron.schedule("0 21 * * *", takePills, {});
