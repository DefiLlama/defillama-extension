/**
 * Hides the tweet if it's an ad.
 * Determined by the presence of the "Ad" text on the top right corner of the tweet.
 */
export function handleAdTweet(tweet: HTMLElement) {
  // get Ad span element on top right corner of tweet directly via xpath from tweet article element
  const xpathArticleToAdText = "div/div/div[2]/div[2]/div[1]/div/div[2]/div/div[1]/span";
  const adIndicator = document.evaluate(
    xpathArticleToAdText,
    tweet,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
  if (!adIndicator) return;

  // hide the ad tweet
  if (adIndicator.textContent === "Ad") {
    tweet.style.display = "none";
  }

  // denote that the tweet has been checked, preventing duplicate analysis
  tweet.setAttribute("data-dl-tweet-check", "true");
}

/**
 * Record of warning message texts for suspicious tweets. Used in handleSusTweet()
 */
const staticWarningMessagesBySusMethod = {
  onlyNumbers: "This tweet contains only numbers, as is often seen in scam posts. Proceed with caution.",
  impersonation:
    "This tweet was detected to be from a phishing account, impersonating the original poster. Proceed with caution.",
  // address warning message is dynamic and calculated in handleTweetWithAddress
} as const;

/**
 * Function (kept from previous implementation) used for most cases of suspicious tweets. Adds a warning message and optionally changes the background color of the tweet.
 */
export function handleSusTweet(
  tweet: HTMLElement,
  isLinkedTweet: boolean,
  warningMessage: keyof typeof staticWarningMessagesBySusMethod,
  action: "BG_RED" /*  | "HIDE" */,
) {
  // additional check for redundancy
  if (tweet.getAttribute("data-dl-tweet-check")) return;

  if (action === "BG_RED") tweet.style.background = "#ff000069";

  insertTweetWarningMessage(tweet, isLinkedTweet, staticWarningMessagesBySusMethod[warningMessage]);

  tweet.setAttribute("data-dl-tweet-check", "true");
}

/**
 * Adds an "OP" tag next to the original poster's original post and replies
 */
export function handleOpTweet(tweet: HTMLElement) {
  // get user handle div element directly via xpath from tweet article element
  const xpathArticleToUserHandleParentDiv = "div/div/div[2]/div[2]/div[1]/div/div[1]/div/div/div[2]/div";
  const userHandleParentDiv = document.evaluate(
    xpathArticleToUserHandleParentDiv,
    tweet,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;

  // "OP" tag. Mouse hover reveals title (created as string literal here for ease)
  const opTag = document.createElement("div");
  opTag.innerHTML = `
    <div style="padding:2px 0px">
      <span style="cursor:help; background-color:#0aba04; padding: 1px 5px; border-radius:10px; color:white; font-size:small;" title="Original Poster">OP</span>
    </div>
  `;
  userHandleParentDiv.insertBefore(opTag.firstElementChild, userHandleParentDiv.childNodes[1]);

  // divider dot. Copied exactly from ui (keep innerHTML as a single line. For some reason does not work otherwise)
  const dividerDot = document.createElement("div");
  dividerDot.innerHTML = `<div dir="ltr" aria-hidden="true" class="css-1rynq56 r-bcqeeo r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-1q142lx r-s1qlax" style="text-overflow: unset; color: rgb(83, 100, 113);"><span class="css-1qaijid r-bcqeeo r-qvutc0 r-poiln3" style="text-overflow: unset;">·</span></div>`;
  userHandleParentDiv.insertBefore(dividerDot.firstElementChild, userHandleParentDiv.childNodes[1]);

  // add attribute to tweet article element to prevent duplicate insertions
  tweet.setAttribute("data-dl-tweet-check", "true");
}

/**
 * Adds a warning message to the tweet if it contains an ethereum/evm or solana address.
 */
export function handleTweetWithAddress(tweet: HTMLElement, tweetText: string, isLinkedTweet: boolean) {
  // Regex for EVM and Solana addresses, respectively
  const evmAddressRegex = /(0x[a-fA-F0-9]{40})/g;
  const solanaAddressRegex = /([1-9A-HJ-NP-Za-km-z]{32,44})/g;

  // Check if the tweet text contains an EVM address
  const hasEvmAddress = tweetText.match(evmAddressRegex);
  const hasSolAddress = tweetText.match(solanaAddressRegex);
  if (!hasEvmAddress && !hasSolAddress) return;

  // display warning message on tweet
  const dynamicWarningChainString = hasEvmAddress ? "An Ethereum/EVM" : "A Solana";
  const warningTextContent = `${dynamicWarningChainString} address was detected in this reply. Proceed with caution.`;
  insertTweetWarningMessage(tweet, isLinkedTweet, warningTextContent);
}

/**
 * Create a new div to hold the warning message and reveal button
 */
export function insertTweetWarningMessage(tweet: HTMLElement, isLinkedTweet: boolean, warningTextContent: string) {
  // Hide the original tweet text
  const tweetTextDiv = tweet.querySelector<HTMLElement>('[data-testid="tweetText"]');

  // if the tweet with the warning message is the linked tweet, then need to go one parent higher to hide the full tweet content
  const tweetContentSection = isLinkedTweet
    ? tweetTextDiv.parentElement.parentElement.parentElement
    : tweetTextDiv.parentElement.parentElement;

  // trim the children to only include the tweet content and not the tweet stats/actions (view count, like button, etc.)
  const tweetContentSectionChildrenUntrimmed = Array.from(tweetContentSection.childNodes);
  const tweetContentSectionChildren = isLinkedTweet
    ? tweetContentSectionChildrenUntrimmed.slice(0, -2)
    : tweetContentSectionChildrenUntrimmed.slice(1, -1);

  // hide the content
  tweetContentSectionChildren.forEach((node: HTMLElement) => {
    node.style.display = "none";
  });

  // get twitter color scheme/theme. Needed to be computed on demand since on navigation the value is not updated
  const twitterColorScheme = getComputedStyle(document.documentElement).getPropertyValue("color-scheme") as
    | "light"
    | "dark";

  // create warning message (div with span to hold text and button to reveal the tweet content)
  const warningDiv = document.createElement("div");
  warningDiv.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    margin-top: 4px;
    margin-bottom: 4px;
    font-size: 14px;
    font-family: 'Helvetica Neue', Roboto, Arial, sans-serif; /* Twitter uses Helvetica Neue, fall back to similar fonts */
    background-color: ${twitterColorScheme === "dark" ? "#15202b" : "#f5f8fa"};
    border-radius: 8px;
    border: 1px solid ${twitterColorScheme === "dark" ? "#38444d" : "#e1e8ed"};
  `;

  const warningSpan = document.createElement("span");
  warningSpan.style.color = twitterColorScheme === "dark" ? "#e1e8ed" : "#546370";
  warningSpan.textContent = warningTextContent;

  const warningButton = document.createElement("button");
  warningButton.style.cssText = `
        background-color: transparent;
        border-radius: 8px;
        border: none;
        color: ${twitterColorScheme === "dark" ? "#e1e8ed" : "#525558"};
        cursor: pointer;
        padding: 4px 8px;
        font-size: 14px;
        font-weight: bold;
        font-family: inherit;
        transition: background-color 200ms ease-in-out;
      `;
  warningButton.textContent = "Show";
  // hover effects for "Show" button
  warningButton.onmouseenter = function (this: HTMLButtonElement) {
    this.style.backgroundColor = twitterColorScheme === "dark" ? "#657786" : "#e0e2e3";
  };
  warningButton.onmouseleave = function (this: HTMLButtonElement) {
    this.style.backgroundColor = "transparent";
  };

  warningDiv.appendChild(warningSpan);
  warningDiv.appendChild(warningButton);

  // Insert the warning div before the tweet
  tweetContentSection.insertBefore(warningDiv, tweetContentSectionChildren[0]);

  // Add the onclick event to the button to reveal the originally hidden tweet content
  warningDiv.querySelector("button").onclick = function (this: HTMLButtonElement) {
    tweetContentSectionChildren.forEach((node: HTMLElement) => {
      node.style.display = "block";
    });
    this.parentElement.style.display = "none";
  };
}

//

export function getTweetInfo(tweet: HTMLElement) {
  // [code from previous version, potentially used for future implementation]
  // const getNumber = (id: string) => {
  //   const element = tweet.querySelector(`[data-testid="${id}"]`);
  //   if (!element) return 0;
  //   return +element.getAttribute("aria-label").split(" ")[0];
  // };

  let element = Array.from(tweet.querySelectorAll<HTMLElement>('a[role="link"]'));
  if (element[0].innerText.endsWith("retweeted") || element[0].innerText.endsWith("reposted"))
    element = Array.from(element).slice(1);

  const tweetText = tweet.querySelectorAll<HTMLElement>('[data-testid="tweetText"]')[0]?.innerText || null;
  // determines if tweet has replies by seeing if the tweet has the vertical bar under the user avatar
  const isRepliedTo = tweet.querySelector('[data-testid="Tweet-User-Avatar"]')?.parentElement?.children?.length > 1;

  // determine if the tweet is linked (the one referenced by the url) by analyzing the tweet layout
  // [checking tweet.querySelector(`a[href="${window.location.pathname}"]`) was an unreliable approach]
  //  linked:     article/div/div/children.length === 3 (content is split horizontally, located at bottom)
  //  non-linked: article/div/div/children.length === 2 (content is split vertically, located on right)
  const isLinkedTweet = tweet.firstElementChild.firstElementChild.children.length === 3;

  return {
    tweetHandle: element[2].innerText.replace("@", ""),
    displayName: element[1].innerText,
    tweetText,
    isRepliedTo,
    isLinkedTweet,
  };
}
