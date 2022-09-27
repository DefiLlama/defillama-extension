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
    case "moonscan.io":
    import("./components/moonbeam");
    break;
  case "gnosisscan.io":
    console.log("Llama Power is not available on gnosisscan yet");
    break;
  case "bobascan.com":
    console.log("Llama Power is not available on bobascan yet");
    break;
  default:
    console.log("default");
    break;
}

// /**
//  * @description
//  * Chrome extensions don't support modules in content scripts.
//  */
// import("./components/Demo");
