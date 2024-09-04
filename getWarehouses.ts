import get from "axios";

const baseLink = "https://supplies-api.wildberries.ru/api/v1/warehouses";

async function getWarehouses() {
  return get(baseLink, {
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.SUPPLIES_ID as string,
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch(() => {
      return [
        {
          date: "error",
          coefficient: "error",
          warehouseID: "error",
          warehouseName: "error",
          boxTypeName: "error",
        },
      ];
    });
}

export default getWarehouses;
