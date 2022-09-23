import { Prices, PRICES_API } from "./constants";
import { coinsDb } from "./db";

export const getIsMac = () => /(Mac|iPhone|iPod|iPad)/i.test(navigator?.platform);

/**
 * Used in search bar to deliver instant query results on the right side. Can be coin price or whatever.
 *
 * @param query the query string
 * @returns the result in string format
 */
export const getInstantResult = async (query: string): Promise<string> => {
  let result = "";

  if (query.length >= 3 && query.length <= 4) {
    // if query is 3 or 4 characters long, check if it's a coin symbol
    const { id: coinId } = await coinsDb.coins.where("symbol").equalsIgnoreCase(query).first();
    const res = (await fetch(PRICES_API + "/coingecko:" + coinId).then((res) => res.json())) as Prices;
    const price = res.coins["coingecko:" + coinId].price;
    // thankfully the precision returned is exactly what we want
    result = "$" + price;
  }

  return result;
};

export function getReadableValue(value: number) {
  if (typeof value !== "number" || isNaN(value) || value === 0) return "0";

  if (Math.abs(value) < 1000) {
    return value.toPrecision(4);
  }

  // https://crusaders-of-the-lost-idols.fandom.com/wiki/Large_Number_Abbreviations
  // llamao issa fun
  const s = [
    "",
    "k",
    "m",
    "b",
    "t",
    "q",
    "Q",
    "s",
    "S",
    "o",
    "n",
    "d",
    "U",
    "D",
    "T",
    "Qt",
    "Qd",
    "Sd",
    "St",
    "O",
    "N",
  ];
  const e = Math.floor(Math.log(value) / Math.log(1000));
  return (value / Math.pow(1000, e)).toFixed(1) + s[e];
}
