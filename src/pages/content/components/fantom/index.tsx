import {
  createInlineLlamaIcon,
  formatPrice,
  getBatchTokenPrices,
  getTokenPrice,
  logImage,
} from "@src/pages/libs/helpers";
import { ETHEREUM_SELECTORS } from "@src/pages/libs/selectors";
import { createRoot } from "react-dom/client";

import gib from "@src/assets/img/memes/gib-128.png";

// const root = document.createElement("span");
// root.id = "defillama-extension-content-view-root";
// document.body.append(root);

// createRoot(root).render(<App />);

// if URL has /address/, get the 0x address as string, then call the price API, then render the price
// to render the price, first remove the existing price, then create a new span, append to correct element

logImage(gib, "Llama Power activated on FtmScan");

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
  const listItems = document.querySelectorAll<HTMLAnchorElement>(ETHEREUM_SELECTORS.address.tokenList.select);
  const listItemsMap = Array.from(listItems).reduce((acc, item) => {
    const url = new URL(item.href);
    const address = url.pathname.split("/")[2];
    const prefixedAddress = "fantom:" + address;
    acc[prefixedAddress] = item;
    return acc;
  }, {} as Record<string, HTMLAnchorElement>);

  const totalAmountTextNode = document.querySelector("a#availableBalanceDropdown").childNodes[0];
  const hasMoreTokens = totalAmountTextNode.textContent.includes(">");
  let totalAmount = parseFloat(totalAmountTextNode.textContent.split("\n")[1].replace(/,/g, "").replace(/.*\$/g, ""));

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

        // // somehow the tooltip doesn't work
        // textRightDiv.setAttribute("data-original-title", "Price from DeFiLlama API");
        // textRightDiv.setAttribute("data-toggle", "tooltip");
        textRightDiv.setAttribute("title", "Price from DeFiLlama API");
      }
    }
  }

  totalAmountTextNode.textContent = "\n" + (hasMoreTokens ? ">" : "") + formatPrice(totalAmount) + "\n";

  const sortButton = document.querySelector<HTMLButtonElement>("button#btn_ERC20_sort");
  // double click - a hack to re-sort the list
  sortButton.click();
  sortButton.click();
}

async function renderErc20PriceOnAddressPage() {
  const { price, symbol } = (await getTokenPrice("fantom:" + account)) ?? {};
  if (!price) {
    console.log("Llama doesn't know the price of this token");
    return;
  }
  if (!document.querySelector(ETHEREUM_SELECTORS.address.erc20.test)) {
    console.log("Llama thinks this is not an ERC20 token");
    return;
  }
  if (document.querySelector(ETHEREUM_SELECTORS.address.erc20.select)) {
    console.log("Llama thinks Etherscan already has the price");
    return;
  }

  const sibling = document.querySelector(ETHEREUM_SELECTORS.address.erc20.appendTo);
  const icon = createInlineLlamaIcon(gib, symbol, 16, "ml-2");
  // // somehow the tooltip doesn't work
  // icon.setAttribute("data-original-title", "Price from DeFiLlama API");
  // icon.setAttribute("data-toggle", "tooltip");
  icon.setAttribute("title", "Price from DeFiLlama API");
  const priceSpan = document.createElement("span");
  priceSpan.className = "text-secondary ml-1";
  priceSpan.innerText = `${formatPrice(price)}`;
  sibling.parentNode.append(icon, priceSpan);
}
