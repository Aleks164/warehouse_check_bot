import { WarehousesByDateByIdMap } from ".";
import { BORDER_ROW_TEMP } from "./const";

function getCheckSummary(
  currentCheck: WarehousesByDateByIdMap,
  prevCheck: WarehousesByDateByIdMap
) {
  let deviations = "";
  let checkSummary = "";

  for (const id in currentCheck) {
    for (const date in currentCheck[id]) {
      const coefficientItem = currentCheck[id][date];
      const prevCoefficientItem = prevCheck?.[id]?.[date];
      checkSummary += `${
        coefficientItem.warehouseName
      } - ${coefficientItem.date.replace(":00Z", "")} - ${
        coefficientItem.coefficient
      }${BORDER_ROW_TEMP}`;
      if (
        !prevCoefficientItem ||
        !prevCoefficientItem?.coefficient ||
        prevCoefficientItem.coefficient !== coefficientItem.coefficient
      ) {
        deviations += `Склад - ${
          coefficientItem.warehouseName
        } дата: ${new Date(coefficientItem.date).toLocaleString("ru-RU")} ${
          prevCoefficientItem?.coefficient || "-"
        } ---> ${coefficientItem.coefficient}${BORDER_ROW_TEMP}`;
        console.log("-deviations", currentCheck);
      }
    }
  }
  return { deviations, checkSummary };
}

export default getCheckSummary;
