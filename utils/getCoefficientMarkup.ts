import { splitToNChunks } from ".";

function getCoefficientMarkup() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: ">", callback_data: ">" },
          { text: "<", callback_data: "<" },
          { text: "=", callback_data: "=" },
        ],
        ...splitToNChunks(
          Array(21)
            .fill(0)
            .map((_, i) => ({
              text: String(i),
              callback_data: String(i),
            })),
          6
        ),
        [{ text: "Отменить", callback_data: "-1" }],
      ],
    },
  };
}

export default getCoefficientMarkup;
