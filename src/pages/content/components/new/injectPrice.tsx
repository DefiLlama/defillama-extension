import {
  createInlineLlamaIcon,
  formatPrice,
  getBatchTokenPrices,
  getStorage,
  getTokenPrice,
  logImage,
} from "@src/pages/libs/helpers";
import gib from "@src/assets/img/memes/gib-128.png";

export async function injectPrice() {
  const priceInjector = await getStorage("local", "settings:priceInjector", true);
  if (!priceInjector) {
    return;
  }

  logImage(gib, `Llama Power activated on Etherscan!`);

  const urlType = window.location.pathname.split("/")[1];
  const account = window.location.pathname.split("/")[2];
  // TODO: fix ENS names

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
    const tokenList = document.querySelectorAll<HTMLAnchorElement>("li.nav-item.list-custom-ERC20 > a");
    const tokenListArray = Array.from(tokenList);
    const tokensToInject: { [address: string]: { amount: number } } = {};
    // the token address is in the href /token/0x...?a=0x..., the first 0x part is the token address
    for (const token of tokenListArray) {
      const tokenAddress = token.href.split("/")[4].split("?")[0];
      // token value is either a $x.xx format, or a &nbsp; (empty)
      const tokenHasValue = token.querySelector(".list-usd-value").innerHTML.startsWith("$");
      if (!tokenHasValue) {
        const address = "ethereum:" + tokenAddress;
        const tokenAmountRaw = token.querySelector("span.text-muted").innerHTML;
        const tokenAmount = parseFloat(tokenAmountRaw.split(" ")[0].replace(/,/g, ""));
        tokensToInject[address] = { amount: tokenAmount };
      }
    }

    // select //*[@id="dropdownMenuBalance"]/text() and add the new balances and replace the text content
    const totalAmountTextNode = document.querySelector("#dropdownMenuBalance").childNodes[0];
    const hasMoreTokens = totalAmountTextNode.textContent.includes(">");
    let totalAmount = parseFloat(totalAmountTextNode.textContent.split("\n")[1].replace(/,/g, "").replace(/.*\$/g, ""));
    console.log(totalAmount);

    const tokenPrices = await getBatchTokenPrices(Object.keys(tokensToInject));
    for (const token of tokenListArray) {
      const tokenAddress = token.href.split("/")[4].split("?")[0];
      const address = "ethereum:" + tokenAddress;
      if (tokenPrices[address]) {
        const price = tokenPrices[address].price;
        const amount = tokensToInject[address].amount;
        const tokenValue = price * amount;
        totalAmount += tokenValue;
        const formattedPrice = formatPrice(price, "@");
        const formattedTokenValue = formatPrice(tokenValue, "$", true);
        token.querySelector(".list-usd-value").innerHTML = formattedTokenValue;
        const priceDiv = document.createElement("div");
        priceDiv.classList.add("list-usd-rate", "small", "text-muted");
        priceDiv.innerHTML = formattedPrice;
        const icon = createInlineLlamaIcon(gib, "priced by defillama", 12, "mx-1");
        priceDiv.prepend(icon);
        token.querySelector(".text-end").appendChild(priceDiv);
      }
    }

    totalAmountTextNode.textContent = "\n" + (hasMoreTokens ? ">" : "") + formatPrice(totalAmount) + "\n";
    const biggerIcon = createInlineLlamaIcon(gib, "priced by defillama", 16);
    document.querySelector("#dropdownMenuBalance").append(biggerIcon);

    // click on button #btn_ERC20_sort twice to sort by price
    const sortButton = document.querySelector<HTMLButtonElement>("#btn_ERC20_sort");
    sortButton.click();
    sortButton.click();
  }

  async function renderErc20PriceOnAddressPage() {}
}
