# DefiLlama Extension

A browser extension that gives you godmode on Etherscan (and other blockchain explorers), while protecting you from suspicious URLs you visit.

## Features

### Wallet tags on Etherscan

Llamas have done their analysis and tagged tens on millions of addresses with behavioral or entity tags, allowing you to unmask the mysterious figures behind each crypto wallet, right inside your favorite blockchain explorers.

### Accurate pricing for exotic tokens on Etherscan

This extension wields the limitless llama power to show you accurate pricing of any tokens that are missing prices on Etherscan. It also re-calculates the token balances after refilling the missing prices.

### Phishing link warning

The cute llama icon on your browser extension tool bar is an unintrusive indicator that will turn red when you are visiting a suspicious website, or turn green when you are visiting a trusted website. Stay safe with the llamas!

The popup also shows the verdict for the current tab, lets you search the DefiLlama directory, and lets you save up to 9 protocols from search results as quick links.

## How the whitelist and blacklist work

The extension merges several lists, refreshed hourly in the background:

| Source | Contributes to | Maintained by |
| --- | --- | --- |
| [DefiLlama/url-directory `domains.json`](https://github.com/DefiLlama/url-directory) | curated whitelist, blacklist, fuzzy targets | DefiLlama, manually reviewed |
| [MetaMask eth-phishing-detect](https://github.com/MetaMask/eth-phishing-detect) | whitelist, blacklist, fuzzy targets | MetaMask |
| DefiLlama protocol list (`api.llama.fi/lite/protocols2`) | whitelist (each protocol's hostname and its registrable root), fuzzy targets | derived automatically |
| `EXPLORER_CHAIN_PREFIX_MAP` in `src/pages/libs/constants.ts` | whitelist | this repo |
| `LOCAL_BLOCKED_DOMAINS` in `src/pages/libs/db.ts` | blacklist | this repo |

A visited hostname (with a leading `www.` removed) is checked in this order, most specific first. The first match wins:

1. exact hostname in the url-directory whitelist
2. exact hostname in a blacklist
3. registrable root in the url-directory whitelist
4. registrable root in a blacklist
5. hostname or root in the derived whitelist (protocols, MetaMask whitelist, explorers)
6. fuzzy match against known domains, only if the user enabled it in settings

Consequences of that order:

- The url-directory whitelist is the only allow source that can override a blacklist. It is manually reviewed, so a legitimate site wrongly flagged by a third-party blacklist can be cleared by adding it there.
- A curated root such as `medium.com` does not clear an exactly blacklisted subdomain such as `scam-airdrop.medium.com`.
- Domains derived from the protocol list can never override a blacklist, because a listed protocol's domain may itself be compromised.

### Adding or removing a domain

- To whitelist a legitimate site that is being flagged, or a high-value site with no DefiLlama metric (an explorer, a docs site), open a PR adding it to the `whitelist` array in [`domains.json`](https://github.com/DefiLlama/url-directory/blob/master/domains.json).
- To blacklist a phishing site, add it to the `blacklist` array in the same file. Prefer the exact hostname over the root where the root is a shared platform.
- Protocols listed on DefiLlama with a URL are whitelisted automatically. No extra step needed.
- New Etherscan-family explorers go in `EXPLORER_CHAIN_PREFIX_MAP` in `src/pages/libs/constants.ts`, keyed by hostname with the DefiLlama chain slug as value. That both enables tag and price injection and whitelists the domain.

Changes to `domains.json` reach users on the next hourly refresh. Changes to the repo constants ship with the next release.

Saved quick links in the popup are re-checked against these lists every time the popup opens. A link whose exact hostname is no longer whitelisted, or is blacklisted, renders greyed out and cannot be opened, only removed.

## Privacy

We do not track you in any way in the extension.

The extension is completely open source, and we encourage curious users or auditors to unpack the `.crx` file you get from the Chrome Web Store (it's just a zip file!) to verify no tracking or malicious code is added during the build process.

## Installation (prepare for chrome web store)

Run these commands to prepare a zip file to be uploaded to the Chrome Web Store.

```bash
yarn
yarn prep
```

You will find the prepared zip file at `./packed/extension.zip`.

## Installation (dev)

First, run these command to install deps and build bundle.

```bash
yarn
yarn dev
```

Then, go to your browser's extensions page, enable `Developer Mode`.

Then, click `Load unpacked` to navigate to the `/dist` directory and load it up.

Now when you open a new tab, you should be prompted whether you want to use this extension or not.

Have fun!
