import { Filters } from ".";

function handleChangeWHFilter(
  message: string,
  filters: Filters,
  reset: () => void
) {
  if (+message === -1) {
    filters.wh = null;
    reset();
    return "Фильтр по складу отменен";
  } else filters.wh = message;

  return `Фильтр по складу установлен на ${filters.wh}`;
}

export default handleChangeWHFilter;
