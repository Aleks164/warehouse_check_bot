import dayjs from "dayjs";
import { Filters } from ".";

function handleComplexCommands(message: string, filters: Filters) {
  const [command, value] = message.split("=");
  if (command === "/coef") {
    const intValue = parseInt(value.substring(1), 10);
    if (isNaN(intValue)) return "Invalid value";
    if (intValue === -1) {
      filters.coefficient = { value: null, sign: null };
      return "Фильтр по коэффициенту отменен";
    }
    filters.coefficient.value = intValue;
    if (value.includes(">")) filters.coefficient.sign = ">";
    else if (value.includes("<")) filters.coefficient.sign = "<";
    else filters.coefficient.sign = "=";
    return `Фильтр по коэффициенту установлен на ${filters.coefficient.sign}${filters.coefficient.value}`;
  }
  if (command === "/date") {
    if (value === "-1") {
      filters.date = null;
      return "Фильтр по дате отменен";
    } else {
      const [d, m, y] = value.split(".");

      const date = dayjs(`${y}-${m}-${d}`, { utc: true });

      if (!date.isValid()) return "Invalid date";

      filters.date = date;
      return `Фильтр по дате установлен на ${value}`;
    }
  }
  return "Unknown command";
}

export default handleComplexCommands;
