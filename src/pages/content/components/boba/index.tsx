import { EtherscanAlikeExplorerConfig, injectPrice } from "../../../libs/etherscanInjector";

const config: EtherscanAlikeExplorerConfig = {
  name: "BobaScan",
  indexTotalAmountTextSplit: 2,
  selectorTokenList: "li.list-custom.list-custom-ERC20 > a",
  chainPrefix: "boba:",
};

injectPrice(config);
