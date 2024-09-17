import dayjs from "dayjs";
import { Filters } from ".";

function handleChangeDateFilter(
  date: string,
  filters: Filters,
  reset: () => void
) {
  if (date === "-1") {
    filters.date = null;
    reset();
    return "Фильтр по дате отменен";
  } else {
    const newDate = dayjs(date, { utc: true });

    if (!newDate.isValid()) return "Некорректная дата";

    filters.date = newDate;
    return `Фильтр по дате установлен на ${newDate.format("DD.MM.YYYY")}`;
  }
}

export default handleChangeDateFilter;
