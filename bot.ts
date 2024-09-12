import { Telegraf } from "telegraf";
import { getFormattedDateAsString, getChunkedString, sleep } from "./utils";
import { getCoefficients } from "./api";
import {
  Filters,
  getCheckSummary,
  getFilteredCoefficients,
  WarehousesByDateByIdMap,
  handleComplexCommands,
  checkWarehouseCoefficients,
  handleBaseCommands,
} from "./model";
import "dotenv/config";

const key = process.env.BOT_TOKEN;
const targetId = process.env.HANSTER_ID;
const myId = process.env.MY_ID;

if (!key || !targetId || !myId)
  throw new Error(
    "Bot token, target ID, or my ID not found in environment variables"
  );

const REQUEST_TIME_INTERVAL = 1000 * 12; // 12 second

const filters: Filters = {
  date: null,
  coefficient: { value: null, sign: null },
};
const complexCommands = ["date", "coef"];
const ids = [targetId, myId];

let prevCheck: WarehousesByDateByIdMap = {};
let currentCheck: WarehousesByDateByIdMap = {};
let checkSummary = "";
let lastCheckTime = "";
let timeOutId: NodeJS.Timeout | string | number | undefined;

const helpMessage = `Основные команды:
   \n/lastCheck - последний результат
   \n/date=DD.MM.YYYY - только эта дата (пример: /date=01.01.2024)
   \n/date=-1 - все даты
   \n/coef=<1 - установка фильтра по коэффициенту (/coef=>5, /coef=0)
   \n/coef=-1 - отмена коэффициента фильтра
   \n/help - Основные комманды`;

const bot = new Telegraf(key);

bot.start((ctx) => {
  const id = ctx.update.message.from.id;
  if (!ids.includes(String(id))) ids.push(String(id));
  return ctx.reply(helpMessage);
});
bot.launch();

const doCheck = async () => {
  try {
    let chunkedDeviation: string[];
    lastCheckTime = getFormattedDateAsString();

    ({ chunkedDeviation, checkSummary, currentCheck, prevCheck } =
      await checkWarehouseCoefficients(currentCheck, prevCheck, filters));

    ids.forEach((id) =>
      chunkedDeviation.forEach((string) => bot.telegram.sendMessage(id, string))
    );

    timeOutId = setTimeout(doCheck, REQUEST_TIME_INTERVAL);
  } catch (e: any) {
    bot.telegram.sendMessage(myId, e.message);

    timeOutId = setTimeout(doCheck, REQUEST_TIME_INTERVAL);
  }
};

timeOutId = setTimeout(doCheck, REQUEST_TIME_INTERVAL);

bot.on("message", (ctx) => {
  if (!("text" in ctx.update.message)) return;
  const message = ctx.update.message.text.toLowerCase();

  bot.telegram.sendMessage(
    myId,
    ctx.update.message.from.username ||
      ctx.update.message.from.first_name + " : " + message
  );
  if (ctx.update.message.from.id !== +myId && message !== "/lastCheck") return;
  if (complexCommands.some((template) => message.includes(template))) {
    const resultMessage = handleComplexCommands(message, filters);
    return ctx.reply(resultMessage);
  } else {
    const chunkedMessage = handleBaseCommands(
      ctx.update.message.text,
      checkSummary,
      lastCheckTime,
      helpMessage,
      timeOutId
    );
    chunkedMessage.forEach((string) => ctx.reply(string));
  }
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
