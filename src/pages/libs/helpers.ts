import Browser from "webextension-polyfill";

import { AccountsResponse, ACCOUNTS_API, Prices, PRICES_API } from "./constants";
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

  if (query.length >= 2 && query.length <= 5) {
    // if query is 2 to 4 characters long, check if it's a coin symbol
    const matches = await coinsDb.coins.where("symbol").equalsIgnoreCase(query).toArray();
    if (matches.length === 0) return result;

    // sort the matches by length of name, shortest first. later will sort by mcap
    matches.sort((a, b) => a.name.length - b.name.length);
    const { id: coinId, name } = matches[0];

    const { price } = await getTokenPrice("coingecko:" + coinId);
    // thankfully the precision returned from API is exactly what we want hehehe
    result = `${name} $${price}`;
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

export function formatPrice(price: number, symbol = "$") {
  let _price: string;
  if (price < 1) {
    _price = price.toPrecision(3);
  } else {
    _price = price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return symbol + _price;
}

export async function getTokenPrice(tokenWithPrefix: string) {
  const res = (await fetch(PRICES_API + "/" + tokenWithPrefix).then((res) => res.json())) as Prices;
  return res.coins[tokenWithPrefix];
}

export async function getBatchTokenPrices(tokensWithPrefix: string[]) {
  const res = (await fetch(PRICES_API + "/" + tokensWithPrefix.join(",")).then((res) => res.json())) as Prices;
  return res.coins;
}

export async function getAccountTags(address: string) {
  const res = (await fetch(ACCOUNTS_API + "/" + address).then((res) => res.json())) as AccountsResponse;
  return res[0];
}

export async function getBatchAccountTags(addresses: string[]) {
  const res = (await fetch(ACCOUNTS_API + "/" + addresses.join(",")).then((res) => res.json())) as AccountsResponse;
  return res;
}

// render an image to console with given url
export const logImage = (url: string, message = "", size = 20, styles = "") => {
  const _url = Browser.runtime.getURL(url);
  console.log(
    `%c ${message}`,
    `background: url(${_url}) 0 0 no-repeat; padding-left: ${size}px; background-size: ${size}px; font-size: ${size}px; ${styles}`,
  );
};

export function createInlineLlamaIcon(src: string, alt: string, size = 12, className = "mr-1 mCS_img_loaded") {
  const icon = document.createElement("img");
  icon.src = Browser.runtime.getURL(src);
  icon.alt = alt;
  icon.width = size;
  icon.className = className;
  return icon;
}

export const getStorage = async <T>(area: "local" | "sync", key: string, defaultValue?: T): Promise<T | undefined> => {
  const res = await Browser.storage[area].get(key);
  return res[key] ?? defaultValue;
};

export const setStorage = async <T>(area: "local" | "sync", key: string, value: T): Promise<void> => {
  await Browser.storage[area].set({ [key]: value });
};
