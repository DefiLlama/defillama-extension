import { EtherscanAlikeExplorerConfig, injectPrice } from "../../../libs/etherscanInjector";

// const NAME_EXPLORER = "Etherscan";
// const INDEX_TOTAL_AMOUNT_TEXT_SPLIT = 1;
// const SELECTOR_TOKEN_LIST = "li.list-custom.list-custom-ERC20 > a";
// const SELECTOR_ERC20_TOKEN_INFO_CARD = ETHEREUM_SELECTORS.address.erc20.test;
// const SELECTOR_ERC20_TOKEN_INFO_LINK = ETHEREUM_SELECTORS.address.erc20.appendTo;
// const SELECTOR_ERC20_TOKEN_INFO_PRICE = ETHEREUM_SELECTORS.address.erc20.select;

const config: EtherscanAlikeExplorerConfig = {
  name: "Etherscan",
  indexTotalAmountTextSplit: 1,
  selectorTokenList: "li.list-custom.list-custom-ERC20 > a",
  selectorErc20TokenInfoCard: "#ContentPlaceHolder1_tr_tokeninfo",
  selectorErc20TokenInfoLink: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > a",
  selectorErc20TokenInfoPrice: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > span",
  chainPrefix: "ethereum:",
};

injectPrice(config);
