import dayjs from "dayjs";
import { WarehousesCoefficient } from "../api/types";
import { Filters, WarehousesByDateByIdMap } from "./types";

function getFilteredCoefficients(
  warehousesCoefficients: WarehousesCoefficient[],
  filters: Filters,
  prevCheck: WarehousesByDateByIdMap
) {
  return warehousesCoefficients.reduce<WarehousesByDateByIdMap>((acc, curr) => {
    const date = curr.date;
    const id = curr.warehouseID;
    const prevCoef = prevCheck[id]?.[date];
    if (filters.date) {
      const coefficientOnDate = dayjs(date, { utc: true });
      const filterDate = filters.date;

      if (!coefficientOnDate.isSame(filterDate, "day")) return acc;
    }
    if (filters.coefficient.value !== null && filters.coefficient.sign) {
      if (
        !(
          (filters.coefficient.sign === ">" &&
            curr.coefficient > filters.coefficient.value) ||
          (filters.coefficient.sign === "<" &&
            curr.coefficient < filters.coefficient.value) ||
          (filters.coefficient.sign === "=" &&
            +curr.coefficient === +filters.coefficient.value) ||
          (prevCoef &&
            ((filters.coefficient.sign === ">" &&
              prevCoef.coefficient > filters.coefficient.value) ||
              (filters.coefficient.sign === "<" &&
                prevCoef.coefficient < filters.coefficient.value) ||
              (filters.coefficient.sign === "=" &&
                +prevCoef.coefficient === +filters.coefficient.value)))
        )
      )
        return acc;
    }
    if (filters.wh) {
      if (curr.warehouseName !== filters.wh) return acc;
    }

    if (!acc[curr.warehouseID]) acc[curr.warehouseID] = {};
    acc[curr.warehouseID]![curr.date] = curr;
    return acc;
  }, {});
}

export default getFilteredCoefficients;
