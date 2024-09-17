import { Filters } from ".";

function handleChangeCoefficientFIlter(
  message: string,
  filters: Filters,
  reset: () => void
) {
  if (isNaN(+message)) {
    switch (message) {
      case ">": {
        filters.coefficient.sign = ">";
        break;
      }
      case "<": {
        filters.coefficient.sign = "<";
        break;
      }
      case "=":
      default: {
        filters.coefficient.sign = "=";
        break;
      }
    }
    if (!filters.coefficient.value) filters.coefficient.value = 1;
  } else {
    const intValue = parseInt(message, 10) ? parseInt(message, 10) : 0;
    if (intValue === -1) {
      filters.coefficient = { value: null, sign: null };
      reset();
      return "Фильтр по коэффициенту отменен";
    }
    filters.coefficient.value = intValue;
    if (!filters.coefficient.sign) filters.coefficient.sign = "=";
  }
  return `Фильтр по коэффициенту установлен на ${filters.coefficient.sign}${filters.coefficient.value}`;
}

export default handleChangeCoefficientFIlter;
