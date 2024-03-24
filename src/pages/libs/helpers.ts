import Browser from "webextension-polyfill";

import { ACCOUNTS_API_V2, Prices, PRICES_API, TagsDataV2 } from "./constants";
import { ICONS } from "./tagging-helpers";

export const getIsMac = () => /(Mac|iPhone|iPod|iPad)/i.test(navigator?.platform);

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

export function formatPrice(price: number, symbol = "$", ignoreSmol = false) {
  let _price: string;
  if (price < 1 && !ignoreSmol) {
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
  const chunkSize = 20;
  const chunks = [];
  for (let i = 0; i < tokensWithPrefix.length; i += chunkSize) {
    chunks.push(tokensWithPrefix.slice(i, i + chunkSize));
  }

  const res = await Promise.all(
    chunks.map(async (chunk) => (await fetch(PRICES_API + "/" + chunk.join(",")).then((res) => res.json())) as Prices),
  );
  const coins: {
    [key: string]: {
      price: number;
      symbol: string;
      timestamp: number;
      confidence: number;
    };
  } = res.reduce((acc, cur) => ({ ...acc, ...cur.coins }), {});
  return coins;
}

export async function getAccountTagsV2(address: string) {
  const res = (await fetch(ACCOUNTS_API_V2 + "/" + address).then((res) => res.json())) as TagsDataV2;
  return res[address];
}

// render an image to console with given url
export const logImage = (url: string, message = "", size = 20, styles = "") => {
  const _url = Browser.runtime.getURL(url);
  console.log(
    `%c ${message}`,
    `background: url(${_url}) 0 0 no-repeat; padding-left: ${size}px; background-size: ${size}px; font-size: ${size}px; ${styles}`,
  );
};

export const getImageUrl = (url: string) => {
  if (url.startsWith("data:image")) return url;
  if (url.startsWith("https")) return url;
  return Browser.runtime.getURL(url);
};

export const getTagIconUrl = (link: string) => {
  if (ICONS[link]) return Browser.runtime.getURL(ICONS[link]);
  if (link.startsWith("data:image")) return link;
  if (link.startsWith("https")) return link;
  return Browser.runtime.getURL(link);
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

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
