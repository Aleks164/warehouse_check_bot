import dayjs from "dayjs";
import { splitToNChunks } from ".";

export interface MarkupItem {
  text: string;
  callback_data: string;
}

export type InlineKeyboardMarkup = MarkupItem[];

function getDateMarkup(dates: string[]) {
  return {
    reply_markup: {
      inline_keyboard: [
        ...splitToNChunks(
          dates.map((date) => ({
            text: dayjs(date).format("DD.MM"),
            callback_data: date,
          })),
          6
        ),
        [{ text: "Отменить", callback_data: "-1" }],
      ],
    },
  };
}

export default getDateMarkup;
