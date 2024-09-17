import { splitToNChunks } from ".";

function getWHMarkup(wh: string[]) {
  return {
    reply_markup: {
      inline_keyboard: [
        ...splitToNChunks(
          wh.map((name) => ({
            text: name,
            callback_data: name,
          })),
          2
        ),
        [{ text: "Отменить", callback_data: "-1" }],
      ],
    },
  };
}

export default getWHMarkup;
