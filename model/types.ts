import dayjs from "dayjs";
import { WarehousesCoefficient } from "../api";

export type CoefficientSign = ">" | "<" | "=" | null;

export interface CoefficientFilter {
  value: number | null;
  sign: CoefficientSign;
}

export interface Filters {
  date: null | dayjs.Dayjs;
  coefficient: CoefficientFilter;
}

export interface WarehousesByDateMap {
  [date: string]: WarehousesCoefficient;
}

export interface WarehousesByDateByIdMap {
  [id: string]: WarehousesByDateMap | undefined;
}
