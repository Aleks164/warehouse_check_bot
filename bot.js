const { Telegraf } = require("telegraf");
const { getCoefficients } = require("./getCoefficients");
const { warehouses } = require("./warehouses");
require("dotenv/config");

const key = process.env.BOT_TOKEN;
const targetId = process.env.HANSTER_ID;
const myId = process.env.MY_ID;

const timeInterval = 1000 * 10; // 10 second

let prevCheck = {};
let currentCheck = {};
let checkSummary = "";
const warehousesIds = Object.keys(warehouses);
let isCheckRunning = true;
let lastCheckTime = "";
let timeOutId;

const helpMessage = `Основные команды:
   \n/lastCheck - последний результат
   \n/date DD.MM.YYYY - только эта дата
   \n/date_all - все даты
   \n/coef=<1 - установка фильтра по коэффициенту (/coef=>5, /coef=0)
   \n/coef- - отмена коэффициента фильтра
   \n/help - Основные комманды`;

const bot = new Telegraf(key);
const ids = [targetId, myId];

const startBot = async () => {
  bot.start((ctx) => {
    const id = ctx.update.message.from.id;
    if (!ids.includes(String(id))) ids.push(String(id));
    return ctx.reply(helpMessage);
  });
  bot.launch();

  const tryCheck = async () => {
    try {
      const warehousesCoef = await getCoefficients(warehousesIds);
      lastCheckTime = new Date().toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
      });
      let errors = "";
      const newMap = warehousesCoef.reduce((acc, curr) => {
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
          }\n`;
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
            }.\n----------------------------------\n`;
          }
        }
      }

      if (errors) {
        ids.forEach((id) => bot.telegram.sendMessage(id, errors));
      }
      await new Promise((resolve) => setTimeout(resolve, timeInterval));
    } catch (e) {
      bot.telegram.sendMessage(myId, e.message);
    }
    if (isCheckRunning) tryCheck();
  };

  tryCheck();

  bot.on("message", (ctx) => {
    bot.telegram.sendMessage(
      myId,
      ctx.update.message.from.username ||
        ctx.update.message.from.first_name + " : " + ctx.update.message.text
    );
    if (
      ctx.update.message.from.id !== myId &&
      ctx.update.message.text !== "/lastCheck"
    )
      return;
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
        return ctx.reply(
          checkSummary
            ? lastCheckTime + "\n" + checkSummary
            : "wait for the result..., check later"
        );
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
};

startBot();
