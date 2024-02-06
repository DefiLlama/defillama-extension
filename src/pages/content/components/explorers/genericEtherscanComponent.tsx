import { EtherscanAlikeExplorerConfig, injectPrice } from "../etherscanInjectPrice";
import { injectTags } from "../etherscanInjectTags";

function injectExplorerComponent() {
  let name = new URL(document.baseURI).hostname;
  let chainPrefix: string;

  switch (name) {
    case "etherscan.io":
      chainPrefix = "ethereum:";
      break;
    case "bscscan.com":
      chainPrefix = "bsc:";
      break;
    case "ftmscan.com":
      chainPrefix = "fantom:";
      break;
    case "arbiscan.io":
      chainPrefix = "arbitrum:";
      break;
    case "polygonscan.com":
      chainPrefix = "polygon:";
      break;
    case "optimistic.etherscan.io":
      chainPrefix = "optimism:";
      break;
    case "cronoscan.com":
      chainPrefix = "cronos:";
      break;
    case "moonriver.moonscan.io":
      chainPrefix = "moonriver:";
      break;
    case "moonbeam.moonscan.io":
    case "moonscan.io":
      chainPrefix = "moonbeam:";
      break;
    case "gnosisscan.io":
      chainPrefix = "xdai:";
      break;
    case "bobascan.com":
      chainPrefix = "boba:";
      break;
    case "zkevm.polygonscan.com":
      chainPrefix = "polygon_zkevm:";
      break;
    case "nova.arbiscan.io":
      chainPrefix = "arbitrum_nova:";
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
    chainPrefix,
  };

  injectPrice(config);
  injectTags();
}

injectExplorerComponent();
