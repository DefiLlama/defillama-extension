import { EtherscanAlikeExplorerConfig, injectPrice } from "../etherscanInjectPrice";
import { injectTags } from "../etherscanInjectTags";

function injectExplorerComponent() {
  const name = new URL(document.baseURI).hostname;
  let chainPrefix: string;

  switch (name) {
    case "zkevm.polygonscan.com":
      chainPrefix = "arbitrum_nova:";
      break;
    case "nova.arbiscan.io":
      chainPrefix = "polygon_zkevm:";
      break;
    case "celoscan.com":
      chainPrefix = "celo:";
      break;
    case "bttcscan.com":
      chainPrefix = "bittorrent:";
      break;
    case "scrollscan.com":
      chainPrefix = "scroll:";
      break;
    case "lineascan.build":
      chainPrefix = "linea:";
      break;
    case "basescan.org":
      chainPrefix = "base:";
      break;
    case "era.zksync.network":
      chainPrefix = "era:";
      break;
    case "kromascan.com":
      chainPrefix = "kroma:";
      break;
    default:
      return;
  }

  const config: EtherscanAlikeExplorerConfig = {
    name,
    indexTotalAmountTextSplit: 2,
    selectorTokenList: "li.list-custom.list-custom-ERC20 > a",
    chainPrefix,
  };

  injectPrice(config);
  injectTags();
}

injectExplorerComponent();
