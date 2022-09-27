import { formatPrice, getTokenPrice, logImage } from "@src/pages/libs/helpers";
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
  const { price } = (await getTokenPrice("ethereum:" + account)) ?? {};
  if (!price) return;

  try {
    document.querySelector(ETHEREUM_SELECTORS.address.remove).remove();
  } catch (error) {
    console.log("token price not on native explorer");
  }
  const sibling = document.querySelector(ETHEREUM_SELECTORS.address.appendTo);

  const priceElement = document.createElement("span");
  priceElement.className = "text-secondary";
  priceElement.innerText = `${formatPrice(price)}`;
  priceElement.style.marginLeft = "8px";

  sibling.parentNode.append(priceElement);
}
