switch (new URL(document.baseURI).hostname) {
  case "etherscan.io":
    import("./components/explorers/ethereum");
    break;
  case "bscscan.com":
    import("./components/explorers/bsc");
    break;
  case "ftmscan.com":
    import("./components/explorers/fantom");
    break;
  case "arbiscan.io":
    import("./components/explorers/arbitrum");
    break;
  case "polygonscan.com":
    import("./components/explorers/polygon");
    break;
  case "optimistic.etherscan.io":
    import("./components/explorers/optimism");
    break;
  case "cronoscan.com":
    import("./components/explorers/cronos");
    break;
  case "moonriver.moonscan.io":
    import("./components/explorers/moonriver");
    break;
  case "moonbeam.moonscan.io":
  case "moonscan.io":
    import("./components/explorers/moonbeam");
    break;
  case "gnosisscan.io":
    import("./components/explorers/gnosis");
    break;
  case "bobascan.com":
    import("./components/explorers/boba");
    break;
  case "zkevm.polygonscan.com":
  case "nova.arbiscan.io":
  case "celoscan.com":
  case "bttcscan.com":
  case "scrollscan.com":
  case "lineascan.build":
  case "basescan.org":
  case "era.zksync.network":
  case "kromascan.com":
    import("./components/explorers/genericEtherscanComponent");
    break;
  case "twitter.com":
  case "x.com":
    import("./components/twitter");
    break;
  default:
    break;
}
