# DefiLlama Extension

A browser extension that gives you godmode on Etherscan (and other blockchain explorers), while protecting you from suspicious URLs you visit.

## Features

### Wallet tags on Etherscan

Llamas have done their analysis and tagged tens on millions of addresses with behavioral or entity tags, allowing you to unmask the mysterious figures behind each crypto wallet, right inside your favorite blockchain explorers.

### Accurate pricing for exotic tokens on Etherscan

This extension wields the limitless llama power to show you accurate pricing of any tokens that are missing prices on Etherscan. It also re-calculates the token balances after refilling the missing prices.

### Phishing link warning

The cute llama icon on your browser extension tool bar is an unintrusive indicator that will turn red when you are visiting a suspicious website, or turn green when you are visiting a trusted website. Stay safe with the llamas!

## Privacy

We do not track you in any way in the extension, and we only request access to Etherscan and similar blockchain explorers, in order to inject llama token prices and wallet tags.

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
