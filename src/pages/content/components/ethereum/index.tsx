import { getTokenPrice, logImage } from "@src/pages/libs/helpers";
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
const address = window.location.pathname.split("/")[2];

if (urlType === "address") {
  renderPriceOnAddressPage();
}

async function renderPriceOnAddressPage() {
  console.log("ethereum:", address);
  const price = await getTokenPrice("ethereum:" + address);
  try {
    document.querySelector(ETHEREUM_SELECTORS.address.remove).remove();
  } catch (error) {
    console.log("token price not on native explorer");
  }
  const sibling = document.querySelector(ETHEREUM_SELECTORS.address.appendTo);

  const priceElement = document.createElement("span");
  priceElement.className = "text-secondary";
  priceElement.innerText = `$${price}`;
  sibling.parentNode.append(priceElement);
}
