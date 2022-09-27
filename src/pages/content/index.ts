switch (new URL(document.baseURI).hostname) {
  case "etherscan.io":
    import("./components/ethereum");
    break;
  case "bscscan.com":
    import("./components/bsc");
    break;
  case "snowtrace.io":
    import("./components/avax");
    break;
  case "ftmscan.com":
    import("./components/fantom");
    break;
  case "arbiscan.io":
    import("./components/arbitrum");
    break;
  case "polygonscan.com":
    import("./components/polygon");
    break;
  case "optimistic.etherscan.io":
    import("./components/optimism");
    break;
  case "cronoscan.com":
    import("./components/cronos");
    break;
  case "moonriver.moonscan.io":
    import("./components/moonriver");
    break;
  case "moonbeam.moonscan.io":
  case "moonscan.io":
    import("./components/moonbeam");
    break;
  case "gnosisscan.io":
    import("./components/gnosis");
    break;
  case "bobascan.com":
    import("./components/boba");
    break;
  default:
    break;
}

// /**
//  * @description
//  * Chrome extensions don't support modules in content scripts.
//  */
// import("./components/Demo");
