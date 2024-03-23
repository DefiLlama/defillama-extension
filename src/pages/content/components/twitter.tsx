import { getStorage } from "@src/pages/libs/helpers";
import levenshtein from "fast-levenshtein";

initPhishingHandleDetector();

async function initPhishingHandleDetector() {
  const phishingHandleDetector = await getStorage("local", "settings:phishingHandleDetector", true);
  if (!phishingHandleDetector) return;

  const handlePage = getHandlerForTwitterPageVariant();
  handlePage(); // initial run on load

  window.addEventListener("scroll", () => {
    debounce(handlePage, 200)();
    // consecutive debounces in case of tweets loading in slower on fast scrolling
    debounce(handlePage, 2000)();
    debounce(handlePage, 5000)();
  });
}

// type TwitterPageVariant = "home" | "status";

//

function getHandlerForTwitterPageVariant() {
  const pathname = window.location.pathname;
  console.log("dl_dev", window.location.pathname, pathname.split("/")[2] === "status", pathname === "/home");

  if (pathname.split("/")[2] === "status") return verifyHandleOnTweetPage;
  else if (pathname === "/home") handleHomePage;
}

const handleToName = {} as Record<string, string>;
async function verifyHandleOnTweetPage() {
  // check that the current page is a tweet page (not home/feed page)
  const isTweetPage = window.location.pathname.split("/")[2] === "status";
  if (!isTweetPage) return;

  // safe handle = original poster handle shown in the url
  const safeHandle = window.location.pathname.split("/")[1].toLowerCase();

  // analyze each tweet presented in the batch found on "scroll"
  const tweets = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="tweet"]'));

  tweets.forEach((tweet, index) => {
    const { tweetHandle, displayName, tweetText, isRepliedTo } = getTweetInfo(tweet);

    handleAdTweet(tweet);

    // if the tweet text content consists of only numbers, then it's sus. Add red background the tweet
    if (/^[0-9]+$/.test(tweetText)) {
      return handleSusTweet(tweet, "BG_RED");
    }

    // if the tweet handle is the same as the page handle, then it's not a phishing handle (add to safe handle list)
    if (tweetHandle.toLowerCase() === safeHandle) {
      handleToName[safeHandle] = displayName.toLowerCase();
      return;
    }

    // if the tweet handle is similar to the page handle, then it's sus. Add red background the tweet
    if (handleToName[safeHandle]) {
      const distance = levenshtein.get(handleToName[safeHandle], displayName.toLowerCase());
      if (distance <= 1) {
        if (index === 0 && isRepliedTo) {
          tweets.forEach((tweet2) => {
            if (getTweetInfo(tweet2).tweetHandle.toLowerCase() == safeHandle) {
              handleSusTweet(tweet2, "BG_RED");
            }
          });
        } else {
          handleSusTweet(tweet, "BG_RED");
        }
        return;
      }
    }
  });
}

function handleSusTweet(tweet: HTMLElement, action: "BG_RED" | "HIDE") {
  if (action === "BG_RED") tweet.style.background = "#ff000069"; // set background as light red
}

/**
 * Hides the tweet if it's an ad.
 * Determined by the presence of the "Ad" text on the top right corner of the tweet.
 */
function handleAdTweet(tweet: HTMLElement) {
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

  console.log(adIndicator.textContent, adIndicator.textContent === "Ad");

  // hide the ad tweet
  if (adIndicator.textContent === "Ad") {
    tweet.style.display = "none";
  }
}

async function handleHomePage(/* twitterConfig */) {
  const isHomePage = window.location.pathname.split("/")[2] === "status";
  if (!isHomePage) return;

  const tweets = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="tweet"]'));

  tweets.forEach((tweet, index) => {
    handleAdTweet(tweet);
  });

  // return; // disable for now
  /*
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  for (const tweet of tweets) {
    const { comments, likes, retweets, tweetHandle } = getTweetInfo(tweet);
    // if (comments === 0 && (likes > 10 || retweets > 5)) handleSusTweets(tweet);
    if (twitterConfig.blacklistSet.has(tweetHandle)) handleSusTweets(tweet);
    else if (twitterConfig.whitelistSet.has(tweetHandle)) continue;
    else if (twitterConfig.whitelist.some((i) => areHandlesSimilar(i, tweetHandle, 3))) handleSusTweets(tweet);
  }

  function handleSusTweets(tweet: any) {
    (tweet as any).style.background = "#ff000069"; // set background as light red
  }
  */
}

function getTweetInfo(tweet: HTMLElement) {
  const getNumber = (id: string) => {
    const element = tweet.querySelector(`[data-testid="${id}"]`);
    if (!element) return 0;
    return +element.getAttribute("aria-label").split(" ")[0];
  };

  let element = Array.from(tweet.querySelectorAll<HTMLElement>('a[role="link"]')); //? better error handling: check for .innerText
  if (element[0].innerText.endsWith("retweeted") || element[0].innerText.endsWith("reposted"))
    element = Array.from(element).slice(1);

  const tweetText = tweet.querySelectorAll<HTMLElement>('[data-testid="tweetText"]')[0].innerText;
  const isRepliedTo = tweet.querySelector('[data-testid="Tweet-User-Avatar"]')?.parentElement?.children?.length > 1;

  return {
    tweetHandle: element[2].innerText.replace("@", ""),
    displayName: element[1].innerText,
    tweetText,
    isRepliedTo,
  };
}

//

const debounceTimers = {} as Record<number, NodeJS.Timeout>;
function debounce(func, delay) {
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimers[delay]);
    debounceTimers[delay] = setTimeout(() => func.apply(context, args), delay);
  };
}
