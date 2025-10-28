import { getStorage } from "@src/pages/libs/helpers";
import levenshtein from "fast-levenshtein";

export type EtherscanAlikeExplorerConfig = {
  name: string;
  chainPrefix: string;
};

async function waitForTxnTable() {
  let attempts = 0;
  while (attempts < 30) {
    const txnTable = (document.getElementById("tokenpageiframe") as any)?.contentDocument.getElementById(
      "theadTokenERC20Table",
    )?.parentElement;
    if (txnTable) return txnTable;
    attempts++;
    await sleep(1000 + attempts * 300);
  }
}

export async function hideSpamTxns(config: EtherscanAlikeExplorerConfig) {
  const explorerSpamHide = await getStorage("local", "settings:explorerSpamHide", false);
  if (!explorerSpamHide) {
    return;
  }

  const urlType = window.location.pathname.split("/")[1];
  let account = "";
  let txnTable: HTMLTableElement | undefined;

  if (urlType === "address") {
    // if (!window.location.href.includes('#tokentxns')) return;
    account = window.location.pathname.split("/")[2];
    txnTable = await waitForTxnTable();
  } else if (urlType === "tokentxns") {
    account = new URL(window.location.href).searchParams.get("a");
    txnTable = getTxnTable();
    if (!account) return;
  } else {
    return;
  }

  if (!txnTable) return;

  let spamTxnCounter = 0;

  const rows = Array.from(txnTable.querySelectorAll("tr"));
  const spamRows = rows.filter((row: any) => {
    const td = row.querySelector("td");
    if (td && td.getAttribute("style")?.replace(/\s/g, "").includes("opacity:50%")) return true;
    return false;
  });
  spamTxnCounter += spamRows.length;
  spamRows.forEach((row) => {
    row.remove();
  });

  const _rows = [...txnTable.querySelectorAll("tr")];
  let addressesWithValues: any = new Set();
  let addressesWithHighValueTransfer = new Set();
  let addressesWithoutValues: any = new Set();
  let probablyMaliciousAddresses: any = new Set();

  _rows.forEach((row) => {
    const valueElement = row.querySelector(".td_showAmount") || row.querySelector(".td_showValue");
    if (!valueElement) return;
    const usdValue = +valueElement.attributes["data-bs-title"]?.nodeValue.split("$")[1].replaceAll(",", "");
    const addressElement = [...row.querySelectorAll("a")].filter((i) => i.href.includes("/address/"))[0];
    const address = addressElement.href.split("/address/")[1].split("#")[0].toLowerCase();

    if (usdValue > 10000) {
      // addressElement.style.color = "#22c55e" // green color for high value transfers
      addressesWithHighValueTransfer.add(address);
    }

    if (usdValue > 100) {
      addressesWithValues.add(address);
      addressesWithoutValues.delete(address);
    } else if (!addressesWithValues.has(address)) {
      addressesWithoutValues.add(address);
    }
  });

  addressesWithValues = [...addressesWithValues];
  addressesWithoutValues = [...addressesWithoutValues];
  const tokenToHash: any = {};

  const hashFn = (address: string) => {
    address = address.slice(2);
    let startPart = address.slice(0, 3);
    let endPart = address.slice(-3);
    return startPart + endPart;
  };

  function isMalicious(safeAddress: string, address: string, threshold = 3) {
    return levenshtein.get(safeAddress, address) < threshold;
  }

  addressesWithValues.concat(addressesWithoutValues).forEach((address) => {
    if (!tokenToHash[address]) tokenToHash[address] = hashFn(address);
  });

  for (const address of addressesWithoutValues) {
    if (addressesWithValues.some((a) => isMalicious(tokenToHash[a], tokenToHash[address]))) {
      probablyMaliciousAddresses.add(address);
    }
  }

  _rows.forEach((row) => {
    const valueElement = row.querySelector(".td_showAmount") || row.querySelector(".td_showValue");
    if (!valueElement) return;
    const addressElement = [...row.querySelectorAll("a")].filter((i) => i.href.includes("/address/"))[0];
    const address = addressElement.href.split("/address/")[1].split("#")[0].toLowerCase();
    if (probablyMaliciousAddresses.has(address)) addressElement.style.color = "#f87171"; // red color for probable malicious addresses
  });

  // find table element with th element with text 'Transaction Hash'
  function getTxnTable() {
    const tables = Array.from(document.querySelectorAll("table"));
    for (const table of tables) {
      const ths = Array.from(table.querySelectorAll("th"));
      if (ths.some((th) => th.textContent.trim() === "Transaction Hash")) return table;
    }
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
