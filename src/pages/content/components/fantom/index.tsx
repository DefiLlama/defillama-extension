import { EtherscanAlikeExplorerConfig, injectPrice } from "../../../libs/etherscanInjector";

const config: EtherscanAlikeExplorerConfig = {
  name: "FtmScan",
  indexTotalAmountTextSplit: 1,
  selectorTokenList: "li.list-custom.list-custom-ERC20 > a",
  chainPrefix: "fantom:",
};

injectPrice(config);
