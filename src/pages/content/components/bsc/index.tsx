import { EtherscanAlikeExplorerConfig, injectPrice } from "../etherscanInjector";

const config: EtherscanAlikeExplorerConfig = {
  name: "BscScan",
  indexTotalAmountTextSplit: 1,
  selectorTokenList: "li.list-custom.list-custom-ERC20 > a",
  chainPrefix: "bsc:",
};

injectPrice(config);
