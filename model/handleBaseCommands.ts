import { getChunkedString } from "../utils";
import {
  BORDER_ROW,
  MESSAGE_LENGTH_LIMIT,
  ROW_TEMPLATE_REPLACE_REG_EXP,
} from "./const";
import { Filters } from "./types";

function handleBaseCommands(
  command: string,
  checkSummary: string | null,
  lastCheckTime: string,
  helpMessage: string,
  allCoefficients: string,
  filters: Filters,
  timerId: NodeJS.Timeout | string | number | undefined
) {
  let resultMessage: string;
  switch (command) {
    case "/start": {
      if (timerId) {
        resultMessage = "Bot is already running";
        break;
      }

      resultMessage = "Bot started";
      break;
    }
    case "/stop": {
      clearTimeout(timerId);
      resultMessage = "Bot stopped";
      break;
    }
    case "/filter": {
      resultMessage = "Фильтры - ";
      if (filters.date)
        resultMessage +=
          "Фильтр по дате: " + filters.date.format("DD.MM.YYYY") + ", ";
      if (filters.coefficient.value !== null && filters.coefficient.sign)
        resultMessage +=
          "Фильтр по коэффициенту: " +
          filters.coefficient.sign +
          filters.coefficient.value +
          ", ";
      if (filters.wh) resultMessage += "Фильтр по складу: " + filters.wh;

      break;
    }
    case "/lastcheck": {
      resultMessage = checkSummary
        ? lastCheckTime + "\n" + checkSummary
        : checkSummary === null
        ? "нет результатов для текущих фильтров"
        : "запрос коэффициентов...";

      break;
    }
    case "/all": {
      resultMessage = allCoefficients;

      break;
    }
    case "/help": {
      return [helpMessage];
    }
    default: {
      resultMessage = "Unknown command";
      break;
    }
  }
  return getChunkedString(resultMessage, MESSAGE_LENGTH_LIMIT).map((string) =>
    string.replace(ROW_TEMPLATE_REPLACE_REG_EXP, BORDER_ROW)
  );
}

export default handleBaseCommands;
