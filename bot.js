const { Telegraf } = require("telegraf");
const { getCoefficients } = require("./getCoefficients");
const {
  getFormattedDateAsString,
} = require("./utils/getFormattedDateAsString");
const { chunkString } = require("./utils/chunkString");
const { warehouses } = require("./warehouses");
const dayjs = require("dayjs");
require("dotenv/config");

const key = process.env.BOT_TOKEN;
const targetId = process.env.HANSTER_ID;
const myId = process.env.MY_ID;

const timeInterval = 1000 * 10; // 10 second
const FORMAT = "DD.MM.YYYY HH:mm";
const BORDER_ROW = "\n----------------------------------\n";
const BORDER_ROW_TEMP = "<==>";
const replaceRegExp = new RegExp(BORDER_ROW_TEMP, "g");
const MESSAGE_LENGTH_LIMIT = 2000;

const filters = { date: null, coef: { value: null, sign: null } };
const complexCommands = ["date", "coef"];

let prevCheck = {};
let currentCheck = {};
let checkSummary = "";
const warehousesIds = Object.keys(warehouses);
let isCheckRunning = true;
let lastCheckTime = "";
let timeOutId;

const helpMessage = `Основные команды:
   \n/lastCheck - последний результат
   \n/date=DD.MM.YYYY - только эта дата (пример: /date=01.01.2024)
   \n/date=-1 - все даты
   \n/coef=<1 - установка фильтра по коэффициенту (/coef=>5, /coef=0)
   \n/coef=-1 - отмена коэффициента фильтра
   \n/help - Основные комманды`;

const bot = new Telegraf(key);
const ids = [targetId, myId];

bot.start((ctx) => {
  const id = ctx.update.message.from.id;
  if (!ids.includes(String(id))) ids.push(String(id));
  return ctx.reply(helpMessage);
});
bot.launch();

const tryCheck = async () => {
  try {
    const warehousesCoef = await getCoefficients(warehousesIds);
    lastCheckTime = getFormattedDateAsString();
    if (warehousesCoef.length) {
      let errors = "";
      const newMap = warehousesCoef.reduce((acc, curr) => {
        if (filters.date) {
          const coefDate = dayjs(curr.date, { utc: true });
          const filterDate = filters.date;

          if (!coefDate.isSame(filterDate, "day")) return acc;
        }
        if (filters.coef.value !== null && filters.coef.sign) {
          if (
            !(
              (filters.coef.sign === ">" &&
                curr.coefficient > filters.coef.value) ||
              (filters.coef.sign === "<" &&
                curr.coefficient < filters.coef.value) ||
              (filters.coef.sign === "=" &&
                +curr.coefficient === +filters.coef.value)
            )
          )
            return acc;
        }

        if (!acc[curr.warehouseID]) acc[curr.warehouseID] = {};
        acc[curr.warehouseID][curr.date] = curr;
        return acc;
      }, {});

      if (!Object.keys(prevCheck).length) prevCheck = newMap;
      else prevCheck = currentCheck;
      currentCheck = newMap;
      checkSummary = "";
      for (const id in currentCheck) {
        for (const date in currentCheck[id]) {
          checkSummary += `${
            currentCheck[id][date].warehouseName
          } - ${currentCheck[id][date].date.replace(":00Z", "")} - ${
            currentCheck[id][date].coefficient
          }${BORDER_ROW_TEMP}`;
          if (
            !prevCheck[id][date]?.coefficient ||
            prevCheck[id][date].coefficient !==
              currentCheck[id][date].coefficient
          ) {
            errors += `Склад - ${
              currentCheck[id][date].warehouseName
            } дата: ${new Date(currentCheck[id][date].date).toLocaleString(
              "ru-RU"
            )} ${prevCheck[id][date]?.coefficient || "-"} ---> ${
              currentCheck[id][date].coefficient
            }${BORDER_ROW_TEMP}`;
          }
        }
      }

      if (errors) {
        const chunkedMessage = chunkString(errors, MESSAGE_LENGTH_LIMIT).map(
          (string) => string.replace(replaceRegExp, BORDER_ROW)
        );
        ids.forEach((id) =>
          chunkedMessage.forEach((string) =>
            bot.telegram.sendMessage(id, string)
          )
        );
      }
    }
  } catch (e) {
    bot.telegram.sendMessage(myId, e.message);
    if (isCheckRunning) tryCheck();
  }
  if (isCheckRunning) {
    await new Promise((resolve) => setTimeout(resolve, timeInterval));
    tryCheck();
  }
};

tryCheck();

bot.on("message", (ctx) => {
  const message = ctx.update.message.text.toLowerCase();

  bot.telegram.sendMessage(
    myId,
    ctx.update.message.from.username ||
      ctx.update.message.from.first_name + " : " + message
  );
  if (ctx.update.message.from.id !== +myId && message !== "/lastCheck") return;
  if (complexCommands.some((template) => message.includes(template))) {
    const [command, value] = message.split("=");
    if (command === "/coef") {
      const intValue = parseInt(value.substring(1), 10);
      if (isNaN(intValue)) return ctx.reply("Invalid value");
      if (intValue === -1) {
        filters.coef = { value: null, sign: null };
        return ctx.reply("Фильтр по коэффициенту отменен");
      }
      filters.coef.value = intValue;
      if (value.includes(">")) filters.coef.sign = ">";
      else if (value.includes("<")) filters.coef.sign = "<";
      else filters.coef.sign = "=";
      return ctx.reply(
        `Фильтр по коэффициенту установлен на ${filters.coef.sign}${filters.coef.value}`
      );
    }
    if (command === "/date") {
      if (value === "-1") {
        filters.date = null;
        return ctx.reply("Фильтр по дате отменен");
      } else {
        const [d, m, y] = value.split(".");

        const date = dayjs(`${y}-${m}-${d}`, { utc: true });

        if (!date.isValid()) return ctx.reply("Invalid date");

        filters.date = date;
        return ctx.reply(`Фильтр по дате установлен на ${value}`);
      }
    }
    return ctx.reply("Unknown command");
  } else
    switch (ctx.update.message.text) {
      case "/start": {
        if (isCheckRunning) return ctx.reply("Bot is already running");
        isCheckRunning = true;

        return ctx.reply("Bot started");
      }
      case "/stop": {
        clearTimeout(timeOutId);
        isCheckRunning = false;
        return ctx.reply("Bot stopped");
      }
      case "/date": {
        return "check later";
      }
      case "/lastCheck": {
        const chunkedMessage = chunkString(
          checkSummary
            ? lastCheckTime + "\n" + checkSummary
            : "wait for the result..., check later",
          MESSAGE_LENGTH_LIMIT
        ).map((string) => string.replace(replaceRegExp, BORDER_ROW));

        chunkedMessage.forEach((string) => ctx.reply(string));

        return;
      }
      case "/help": {
        return ctx.reply(helpMessage);
      }
      default: {
        return ctx.reply("Unknown command");
      }
    }
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
