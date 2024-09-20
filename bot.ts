import { Telegraf } from "telegraf";
import {
  getCoefficientMarkup,
  getDateMarkup,
  getFormattedDateAsString,
  getWHMarkup,
  sleep,
} from "./utils";
import {
  Filters,
  WarehousesByDateByIdMap,
  checkWarehouseCoefficients,
  handleBaseCommands,
  handleChangeCoefficientFIlter,
  handleChangeDateFilter,
  handleChangeWHFilter,
} from "./model";
import "dotenv/config";

const key = process.env.BOT_TOKEN;
const targetId = process.env.HANSTER_ID;
const main = process.env.HANSTER_MAIN_ID;
const myId = process.env.MY_ID;

if (!key || !targetId || !myId || !main)
  throw new Error(
    "Bot token, target ID, or my ID not found in environment variables"
  );

const REQUEST_TIME_INTERVAL = 1000 * 12; // 12 second

const filters: Filters = {
  date: null,
  coefficient: { value: null, sign: null },
  wh: null,
};
const complexCommands = ["date", "coef", "wh"];
const whList = ["Электросталь", "Казань", "Коледино", "Тула"];
const ids = [targetId, myId, main];

let prevCheck: WarehousesByDateByIdMap = {};
let currentCheck: WarehousesByDateByIdMap = {};
let checkSummary: string | null = null;
let allCoefficients: string = "";
let lastCheckTime = "";
let allDates: string[] = [];
let timeOutId: NodeJS.Timeout | string | number | undefined;

const helpMessage = `Основные команды:
   \n/lastCheck - последний результат
   \n/all - все коэффициенты
   \n/date - установка фильтра по дате 
   \n/coef - установка фильтра по коэффициенту  
   \n/wh - установка фильтра по складу  
   \n/filter - текущее фильтры  
   \n/help - Основные команды`;

const runBot = async () => {
  const bot = new Telegraf(key);

  bot.start((ctx) => {
    const id = ctx.update.message.from.id;
    if (!ids.includes(String(id))) ids.push(String(id));
    return ctx.reply(helpMessage);
  });

  const doCheck = async () => {
    try {
      let chunkedDeviation: string[];
      lastCheckTime = getFormattedDateAsString();
      ({
        chunkedDeviation,
        checkSummary,
        currentCheck,
        prevCheck,
        allCoefficients,
        allDates,
      } = await checkWarehouseCoefficients(currentCheck, prevCheck, filters));
      ids.forEach((id) =>
        chunkedDeviation.forEach((string) =>
          bot.telegram.sendMessage(id, string || "---")
        )
      );

      timeOutId = setTimeout(doCheck, REQUEST_TIME_INTERVAL);
    } catch (e: any) {
      bot.telegram.sendMessage(myId, e.message || "someError");

      timeOutId = setTimeout(doCheck, REQUEST_TIME_INTERVAL);
    }
  };

  timeOutId = setTimeout(doCheck, REQUEST_TIME_INTERVAL);

  bot.on("message", (ctx) => {
    try {
      if (!("text" in ctx.update.message)) return;
      const message = ctx.update.message.text.toLowerCase();

      bot.telegram.sendMessage(
        myId,
        (ctx.update.message.from.username ||
          ctx.update.message.from.first_name) +
          " : " +
          message
      );

      if (complexCommands.some((template) => message.includes(template))) {
        switch (message) {
          case "/coef":
            return ctx.reply("коэффициент", getCoefficientMarkup());

          case "/date":
            return ctx.reply("дата", getDateMarkup(allDates));

          case "/wh":
            return ctx.reply("склад", getWHMarkup(whList));

          default:
            return ctx.reply("Unknown command");
        }
      } else {
        const chunkedMessage = handleBaseCommands(
          message,
          checkSummary,
          lastCheckTime,
          helpMessage,
          allCoefficients,
          filters,
          timeOutId
        );
        chunkedMessage.forEach((string) => ctx.reply(string || "---"));
      }
    } catch (e: any) {
      bot.telegram.sendMessage(myId, e.message || "someError");
    }
  });

  bot.on("callback_query", (ctx) => {
    try {
      if (!("data" in ctx.update.callback_query)) return;
      const {
        data,
        message: { text },
      } = ctx.update.callback_query as any;

      const reset = () => {
        prevCheck = {};
        currentCheck = {};
      };

      switch (text) {
        case "дата": {
          const resultMessage = handleChangeDateFilter(data, filters, reset);
          ctx.reply(resultMessage || "---");
          return;
        }
        case "коэффициент": {
          const resultMessage = handleChangeCoefficientFIlter(
            data,
            filters,
            reset
          );
          ctx.reply(resultMessage || "---");
          return;
        }
        case "склад": {
          const resultMessage = handleChangeWHFilter(data, filters, reset);
          ctx.reply(resultMessage || "---");
          return;
        }
        default:
          return;
      }
    } catch (e: any) {
      bot.telegram.sendMessage(myId, e.message || "some error");
    }
  });

  bot.launch();

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};

const doRunBot = async () => {
  try {
    runBot();
  } catch (e: any) {
    console.log(e.message);
    clearTimeout(timeOutId);
    await sleep(10000);
    doRunBot();
  }
};

doRunBot();
