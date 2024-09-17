import { getCheckSummary, getFilteredCoefficients } from ".";
import { getCoefficients } from "../api";
import { getChunkedString } from "../utils";
import warehouses from "../warehouses";
import {
  MESSAGE_LENGTH_LIMIT,
  ROW_TEMPLATE_REPLACE_REG_EXP,
  BORDER_ROW,
  BORDER_ROW_TEMP,
} from "./const";
import { Filters, WarehousesByDateByIdMap } from "./types";
const warehousesIds = Object.keys(warehouses);

const checkWarehouseCoefficients = async (
  currentCheck: WarehousesByDateByIdMap,
  prevCheck: WarehousesByDateByIdMap,
  filters: Filters
) => {
  const warehousesCoefficients = await getCoefficients(warehousesIds);

  let checkSummary = "";
  let allCoefficients = "";
  let allDates: Set<string> = new Set();
  let chunkedDeviation: string[] = [];

  if (warehousesCoefficients.length) {
    allCoefficients = warehousesCoefficients.reduce((acc, curr) => {
      acc += `${curr.warehouseName} - ${curr.date.replace(":00Z", "")} - ${
        curr.coefficient
      }${BORDER_ROW_TEMP}`;
      return acc;
    }, allCoefficients);
    warehousesCoefficients.forEach((coef) => {
      allDates.add(coef.date);
    });
    const newMap = getFilteredCoefficients(warehousesCoefficients, filters);
    if (!Object.keys(prevCheck).length) prevCheck = newMap;
    else prevCheck = currentCheck;
    currentCheck = newMap;

    let deviations = "";
    ({ deviations, checkSummary } = getCheckSummary(currentCheck, prevCheck));

    if (deviations) {
      chunkedDeviation = getChunkedString(deviations, MESSAGE_LENGTH_LIMIT).map(
        (string) => string.replace(ROW_TEMPLATE_REPLACE_REG_EXP, BORDER_ROW)
      );
    }
  }
  return {
    chunkedDeviation,
    checkSummary,
    currentCheck,
    prevCheck,
    allCoefficients,
    allDates: Array.from(allDates),
  };
};

export default checkWarehouseCoefficients;
