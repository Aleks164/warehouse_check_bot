import get from "axios";
import "dotenv/config";

export interface WarehousesCoefficients {
  date: string;
  coefficient: number;
  warehouseID: number;
  warehouseName: string;
  boxTypeName: string;
}

const baseLink =
  "https://supplies-api.wildberries.ru/api/v1/acceptance/coefficients?warehouseIDs=";
async function getCoefficients(ids: string[]) {
  return get(baseLink + ids, {
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.SUPPLIES_ID as string,
    },
  })
    .then((response) => {
      const data = (response.data || []) as WarehousesCoefficients[];

      return data.filter((item) => item.boxTypeName === "Короба");
    })
    .catch((e) => {
      console.log(e.message);
      return [
        {
          date: "error",
          coefficient: "error",
          warehouseID: "error",
          warehouseName: "error",
          boxTypeName: "error",
        },
      ] as unknown as WarehousesCoefficients[];
    });
}

export default getCoefficients;
