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
      return [];
    });
}

export default getWarehouses;
