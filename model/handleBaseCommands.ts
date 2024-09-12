import { getChunkedString } from "../utils";
import {
  BORDER_ROW,
  MESSAGE_LENGTH_LIMIT,
  ROW_TEMPLATE_REPLACE_REG_EXP,
} from "./const";

function handleBaseCommands(
  command: string,
  checkSummary: string,
  lastCheckTime: string,
  helpMessage: string,
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
    case "/date": {
      resultMessage = "check later";
      break;
    }
    case "/lastCheck": {
      resultMessage = checkSummary
        ? lastCheckTime + "\n" + checkSummary
        : "wait for the result..., check later";

      break;
    }
    case "/help": {
      resultMessage = helpMessage;
      break;
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
