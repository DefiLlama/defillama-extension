import { EtherscanAlikeExplorerConfig, injectPrice } from "../../../libs/etherscanInjector";

const config: EtherscanAlikeExplorerConfig = {
  name: "BobaScan",
  indexTotalAmountTextSplit: 2,
  selectorTokenList: "li.list-custom.list-custom-ERC20 > a",
  selectorErc20TokenInfoCard: "#ContentPlaceHolder1_tr_tokeninfo",
  selectorErc20TokenInfoLink: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > a",
  selectorErc20TokenInfoPrice: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > span",
  chainPrefix: "boba:",
};

injectPrice(config);
