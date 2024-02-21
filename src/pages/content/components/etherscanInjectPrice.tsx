import {
  createInlineLlamaIcon,
  formatPrice,
  getBatchTokenPrices,
  getStorage,
  getTokenPrice,
  logImage,
} from "@src/pages/libs/helpers";
import gib from "@src/assets/img/memes/gib-128.png";
import { DEFAULT_SETTINGS } from "@src/pages/libs/constants";

export type EtherscanAlikeExplorerConfig = {
  name: string;
  chainPrefix: string;
};

const SELECTOR_ERC20_TOKEN_INFO_ROW = "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-4.mb-1.mb-md-0 > span";
const SELECTOR_ERC20_TOKEN_INFO_PRICE = "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > span";
const SELECTOR_ERC20_TOKEN_INFO_LINK = "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > a";

export async function injectPrice(config: EtherscanAlikeExplorerConfig) {
  const priceInjector = await getStorage("local", "settings:priceInjector", DEFAULT_SETTINGS.PRICE_INJECTOR);
  if (!priceInjector) {
    return;
  }

  logImage(gib, `Llama Power activated on ${config.name}`);

  const urlType = window.location.pathname.split("/")[1];
  const account = window.location.pathname.split("/")[2];

  switch (urlType) {
    case "address":
      renderPriceOnAddressPage();
      break;
    default:
      break;
  }

  async function renderPriceOnAddressPage() {
    await renderErc20PriceOnAddressPage();
    await renderMissingPricesInDropdownOnAddressPage();
  }

  const spamTokenIdentifiers = [
    "[Spam]",
    "[Suspicious]",
    "[Unsafe]",
    "Visit ",
    "https:",
    "http:",
    ".com",
    "www.",
    ".xyz",
    ".net",
    ".site",
    "claim ",
    "claimusdc",
    "airdrop",
  ].map((i) => i.toLowerCase());

  async function renderMissingPricesInDropdownOnAddressPage() {
    const getERC20Items = () => getElements(["li.list-custom-ERC20 > a", "li.list-custom-ERC-20 > a"], undefined, true);
    // clean up spam NFTs & tokens
    const cleanupSpam = () => {
      let listItems = getERC20Items();
      const lastItem = listItems[listItems.length - 1];
      if (!lastItem) return;
      const ulElement = lastItem.parentElement.parentElement;
      listItems = getElements(["li > a"], ulElement, true);
      listItems.forEach((item) => {
        if (tokenHasPrice(item)) return;

        const text = item.textContent.toLowerCase();
        const isSus = spamTokenIdentifiers.some((s) => text.includes(s)) || !text;
        if (isSus) {
          item.parentElement.remove();
        }
      });
    };

    cleanupSpam();

    let listItems = getERC20Items();

    const addressPriceMap = listItems.reduce((acc, item) => {
      if (tokenHasPrice(item)) return acc;

      const url = new URL(item.href);
      const address = url.pathname.split("/token/")[1];
      const prefixedAddress = config.chainPrefix + address;
      acc[prefixedAddress] = address;
      return acc;
    }, {} as Record<string, string>);
    if (!Object.keys(addressPriceMap).length) return;

    let totalAmountTextNode = getElements(["a#availableBalanceDropdown", "button#dropdownMenuBalance"]);
    if (!totalAmountTextNode) return;
    totalAmountTextNode = totalAmountTextNode.childNodes[0];
    const hasMoreTokens = totalAmountTextNode.textContent.includes(">");
    let totalAmount = parseFloat(totalAmountTextNode.textContent.replace(/(\s|\,|\$|\>)/g, ""));

    const prices = await getBatchTokenPrices(Object.keys(addressPriceMap));
    if (!Object.keys(prices).length) return;

    const addressItemMap = getERC20Items().reduce((acc, item) => {
      const url = new URL(item.href);
      const address = url.pathname.split("/token/")[1];
      acc[address] = item;
      return acc;
    }, {} as Record<string, HTMLAnchorElement>);

    listItems = getERC20Items(); // refetch erc20 list
    for (const [address, { price, symbol }] of Object.entries(prices)) {
      const listItem = addressItemMap[addressPriceMap[address]];
      if (listItem) {
        const amountSpan = getElements(["span.list-amount", ".text-muted"], listItem);
        if (!amountSpan) continue;

        const amount = parseFloat(amountSpan.textContent.trim().split(" ")[0].replace(/,/g, ""));
        const textRightDiv = getElements(["div.text-right", "div.text-end"], listItem);
        const usdValueSpan = getElements([".list-usd-value"], listItem);
        const usdAmount = amount * price;
        totalAmount += usdAmount;

        usdValueSpan.textContent = formatPrice(usdAmount);
        const priceDiv = document.createElement("div");
        priceDiv.className = "d-flex justify-content-end align-items-center";
        const priceTextSpan = document.createElement("span");
        priceTextSpan.textContent = "@" + formatPrice(price, "");
        priceTextSpan.className = "list-usd-rate link-hover__item";
        const icon = createInlineLlamaIcon(gib, symbol);
        priceDiv.append(icon, priceTextSpan);
        textRightDiv.append(priceDiv);
        textRightDiv.setAttribute("title", "Price from DeFiLlama API");
      }
    }

    totalAmountTextNode.textContent = "\n" + (hasMoreTokens ? ">" : "") + formatPrice(totalAmount) + "\n";

    // ===============================
    // hacks to hook up interactivity
    // ===============================

    // double click to re-sort the list
    const sortButton = document.querySelector<HTMLButtonElement>("button#btn_ERC20_sort");
    sortButton.click();
    sortButton.click();
    // fix injected tooltips
    const tooltipsActivationScript = `$('[data-toggle="tooltip"]').tooltip()`;
    document.documentElement.setAttribute("onreset", tooltipsActivationScript);
    document.documentElement.dispatchEvent(new CustomEvent("reset"));
    document.documentElement.removeAttribute("onreset");
    setTimeout(cleanupSpam, 3000);
    // known bug: the llama tooltips won't render in list
  }

  function tokenHasPrice(token: Element) {
    const usdValueSpan = getElements([".list-usd-rate"], token);
    return /^\@\d/.test(usdValueSpan?.textContent.trim());
  }

  async function renderErc20PriceOnAddressPage() {
    if (!document.querySelector(SELECTOR_ERC20_TOKEN_INFO_ROW)) {
      return;
    }
    if (document.querySelector(SELECTOR_ERC20_TOKEN_INFO_PRICE)) {
      return;
    }
    const { price, symbol } = (await getTokenPrice(config.chainPrefix + account)) ?? {};
    if (!price) {
      return;
    }

    const sibling = document.querySelector(SELECTOR_ERC20_TOKEN_INFO_LINK);
    const priceSpan = document.createElement("span");
    priceSpan.setAttribute("data-original-title", "Price from DeFiLlama API");
    priceSpan.setAttribute("data-toggle", "tooltip");
    priceSpan.setAttribute("title", "");
    const icon = createInlineLlamaIcon(gib, symbol, 16, "ml-2");
    const priceTextSpan = document.createElement("span");
    priceTextSpan.className = "text-secondary ml-1";
    priceTextSpan.innerText = `${formatPrice(price)}`;
    priceSpan.append(icon, priceTextSpan);
    sibling.parentNode.append(priceSpan);
  }
}

function getElements(selectors: string[], root: Element | Document = document, isList = false) {
  let data;
  for (const selector of selectors) {
    if (isList) data = Array.from(root.querySelectorAll(selector));
    else data = root.querySelector(selector);
    if (isList ? data.length > 0 : data) return data;
  }
  data;
}
