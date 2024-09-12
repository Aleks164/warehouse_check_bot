import get from "axios";
import "dotenv/config";
import { WarehousesCoefficient } from "./types";

const baseLink =
  "https://supplies-api.wildberries.ru/api/v1/acceptance/coefficients?warehouseIDs=";
async function getCoefficients(ids: string[]) {
  return get<WarehousesCoefficient[]>(baseLink + ids, {
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.SUPPLIES_ID,
    },
  })
    .then((response) => {
      const data = response.data || [];

      return data.filter((item) => item.boxTypeName === "Короба");
    })
    .catch((e) => {
      throw new Error(e);
    });
}

export default getCoefficients;
