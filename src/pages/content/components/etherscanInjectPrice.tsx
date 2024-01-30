import {
  createInlineLlamaIcon,
  formatPrice,
  getBatchTokenPrices,
  getStorage,
  getTokenPrice,
  logImage,
} from "@src/pages/libs/helpers";
import gib from "@src/assets/img/memes/gib-128.png";

export type EtherscanAlikeExplorerConfig = {
  name: string;
  indexTotalAmountTextSplit: number;
  selectorTokenList: string;
  chainPrefix: string;
};

const SELECTOR_ERC20_TOKEN_INFO_ROW = "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-4.mb-1.mb-md-0 > span";
const SELECTOR_ERC20_TOKEN_INFO_PRICE = "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > span";
const SELECTOR_ERC20_TOKEN_INFO_LINK = "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > a";

export async function injectPrice(config: EtherscanAlikeExplorerConfig) {
  const priceInjector = await getStorage("local", "settings:priceInjector", true);
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

  async function renderMissingPricesInDropdownOnAddressPage() {
    const listItems = document.querySelectorAll<HTMLAnchorElement>(config.selectorTokenList);
    const listItemsMap = Array.from(listItems).reduce(
      (acc, item) => {
        const url = new URL(item.href);
        const address = url.pathname.split("/")[2];
        const prefixedAddress = config.chainPrefix + address;
        acc[prefixedAddress] = item;
        return acc;
      },
      {} as Record<string, HTMLAnchorElement>,
    );

    if (listItems.length === 0) {
      return;
    }

    const totalAmountTextNode = document.querySelector("a#availableBalanceDropdown").childNodes[0];
    const hasMoreTokens = totalAmountTextNode.textContent.includes(">");
    let totalAmount = parseFloat(
      totalAmountTextNode.textContent
        .split("\n")
        [config.indexTotalAmountTextSplit].replace(/,/g, "")
        .replace(/.*\$/g, ""),
    );

    const prices = await getBatchTokenPrices(Object.keys(listItemsMap));
    for (const [address, { price, symbol }] of Object.entries(prices)) {
      const listItem = listItemsMap[address];
      if (listItem) {
        const amountSpan = listItem.querySelector("span.list-amount");
        if (!amountSpan) {
          continue;
        }
        const amount = parseFloat(amountSpan.textContent.split(" ")[0].replace(/,/g, ""));
        const textRightDiv = listItem.querySelector("div.text-right");
        const usdValueSpan = textRightDiv.querySelector("span.list-usd-value");
        if (usdValueSpan.innerHTML === "&nbsp;") {
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
    // known bug: the llama tooltips won't render in list
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
