import { Telegraf } from "telegraf";
import getCoefficients, { WarehousesCoefficients } from "./getCoefficients";
import { warehouses } from "./warehouses";
import "dotenv/config";

interface WarehousesById {
  [warehouseId: number]: WarehousesCoefficients;
}

const key = process.env.BOT_TOKEN as string;
const targetId = process.env.HANSTER_ID as string;
const myId = process.env.MY_ID as string;

const timeInterval = 1000 * 10; // 20 second

let prevCheck: any = {};
let currentCheck: any = {};
let checkSummary = "";
const warehousesIds = Object.keys(warehouses);
const isCheckRunning = { current: true };
let lastCheckTime = "";
let timeOutId: any;

// const helpMessage =
//   "Основные комманды:\n/start - начать проверку\n/lastCheck - последний результат\n/stop - остановить проверку\n/help - Основные комманды";
const helpMessage = "Основные комманды:\n/lastCheck - последний результат";

const startBot = () => {
  const bot = new Telegraf(key);
  const ids = [targetId, myId];

  bot.start((ctx) => {
    const id = ctx.update.message.from.id;
    if (!ids.includes(String(id))) ids.push(String(id));
    return ctx.reply(helpMessage);
  });
  bot.launch();

  const tryCheck = async () => {
    const warehousesCoef = await getCoefficients(warehousesIds);
    lastCheckTime = new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
    });
    let errors = "";
    const newMap = warehousesCoef.reduce((acc: any, curr: any) => {
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
          prevCheck[id][date].coefficient !== currentCheck[id][date].coefficient
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
    if (isCheckRunning.current) tryCheck();
  };

  tryCheck();

  bot.on("message", (ctx: any) => {
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
        if (isCheckRunning.current) return ctx.reply("Bot is already running");
        isCheckRunning.current = true;

        return ctx.reply("Bot started");
      }
      case "/stop": {
        clearTimeout(timeOutId);
        isCheckRunning.current = false;
        return ctx.reply("Bot stopped");
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
