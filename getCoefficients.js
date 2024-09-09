const get = require("axios");
require("dotenv/config");

const baseLink =
  "https://supplies-api.wildberries.ru/api/v1/acceptance/coefficients?warehouseIDs=";
async function getCoefficients(ids) {
  return get(baseLink + ids, {
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
      console.log(e.message);
      return [];
    });
}

module.exports = { getCoefficients };
