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

logImage(gib, "Llama Power activated on Etherscan");

const urlType = window.location.pathname.split("/")[1];
const account = window.location.pathname.split("/")[2];

switch (urlType) {
  case "address":
    renderPriceOnAddressPage();
    break;
  // case "token":
  //   renderPriceOnTokenPage();
  //   break;
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
    const prefixedAddress = "ethereum:" + address;
    acc[prefixedAddress] = item;
    return acc;
  }, {} as Record<string, HTMLAnchorElement>);

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
        usdValueSpan.textContent = formatPrice(amount * price);
        const priceDiv = document.createElement("div");
        priceDiv.className = "d-flex justify-content-end align-items-center";
        const priceTextSpan = document.createElement("span");
        priceTextSpan.textContent = "@" + formatPrice(price, "");
        priceTextSpan.className = "list-usd-rate link-hover__item";
        const icon = createInlineLlamaIcon(gib, symbol);
        priceDiv.append(icon, priceTextSpan);
        textRightDiv.append(priceDiv);

        // somehow the tooltip doesn't work
        textRightDiv.setAttribute("data-original-title", "Price from DeFiLlama API");
        textRightDiv.setAttribute("data-toggle", "tooltip");
        textRightDiv.setAttribute("title", "");
      }
    }
  }
}

async function renderErc20PriceOnAddressPage() {
  const { price } = (await getTokenPrice("ethereum:" + account)) ?? {};
  if (!price) return;

  try {
    document.querySelector(ETHEREUM_SELECTORS.address.erc20.remove).remove();
  } catch (error) {
    console.log("token price not on native explorer");
  }
  const sibling = document.querySelector(ETHEREUM_SELECTORS.address.erc20.appendTo);

  const priceElement = document.createElement("span");
  priceElement.className = "text-secondary";
  priceElement.innerText = `${formatPrice(price)}`;
  priceElement.style.marginLeft = "8px";

  sibling.parentNode.append(priceElement);
}
