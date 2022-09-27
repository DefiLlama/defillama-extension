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
    console.log("Llama Power is not available on ftmscan yet");
    break;
  case "arbiscan.io":
    console.log("Llama Power is not available on arbiscan yet");
    break;
  case "polygonscan.com":
    console.log("Llama Power is not available on polygonscan yet");
    break;
  case "optimistic.etherscan.io":
    console.log("Llama Power is not available on optimistic yet");
    break;
  case "cronoscan.com":
    console.log("Llama Power is not available on cronoscan yet");
    break;
  case "moonriver.moonscan.io":
    console.log("Llama Power is not available on moonriver yet");
    break;
  case "moonscan.io":
    console.log("Llama Power is not available on moonscan yet");
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
