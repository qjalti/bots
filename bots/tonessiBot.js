import { Telegraf } from "telegraf";
import cron from "node-cron";
import { tonessiVacation } from "../src/tonessiVacation.js";
import {
  AUTHOR_TELEGRAM_ID,
  LOGS_CHAT_ID,
  TONESSI_FIRST_VACATION_DAY,
  TONESSI_FIRST_VACATION_DAY_SORRY,
  VACATION_MESSAGES,
  TONESSI_ID,
} from "../src/constants.js";
import * as dotenv from "dotenv";

dotenv.config();

const BOT = new Telegraf(process.env.TONESSI_BOT_TOKEN);

const SM_OPTIONS = {
  parse_mode: "MarkdownV2",
};

BOT.command("start", async (ctx) => {
  await ctx.reply("Бот успешно запущен!");
});

const getDayWord = (number) => {
  if (number === 1) {
    return "день";
  } else if (number >= 2 && number <= 4) {
    return "дня";
  } else {
    return "дней";
  }
};

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

const daysLeft = async () => {
  const { daysLeft, hoursLeft } = tonessiVacation.check();

  console.log("---");
  console.log(daysLeft, "daysLeft");
  console.log(typeof daysLeft, "typeof daysLeft");
  console.log(hoursLeft, "hoursLeft");
  console.log(typeof hoursLeft, "typeof hoursLeft");
  console.log(`---\n\n`);

  if (daysLeft % 2 === 0 && daysLeft <= 14 && daysLeft > 1) {
    await sendMessage(
      `${daysLeft} ${getDayWord(daysLeft)} до отпуска! ${VACATION_MESSAGES[daysLeft]}`,
      TONESSI_ID,
    );
  } else if (daysLeft === 0 && hoursLeft > 0) {
    await sendMessage(TONESSI_FIRST_VACATION_DAY, TONESSI_ID);
  } else if (hoursLeft === -23) {
    await sendMessage(TONESSI_FIRST_VACATION_DAY_SORRY, TONESSI_ID);
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
 * Vacation
 */
cron.schedule("0 12 * * *", daysLeft, {});
