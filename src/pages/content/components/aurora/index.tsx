import { EtherscanAlikeExplorerConfig, injectPrice } from "../etherscanInjector";

const config: EtherscanAlikeExplorerConfig = {
  name: "AuroraScan",
  indexTotalAmountTextSplit: 2,
  selectorTokenList: "li.list-custom.list-custom-ERC-20 > a",
  chainPrefix: "aurora:",
};

injectPrice(config);
