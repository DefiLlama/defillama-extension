import { getStorage } from "@src/pages/libs/helpers";
import levenshtein from "fast-levenshtein";

initPhishingHandleDetector();
const debouncedVerifyHandleOnTweetPage = debounce(verifyHandleOnTweetPage, 200);
const debouncedVerifyHandleOnTweetPage2 = debounce(verifyHandleOnTweetPage, 2000); // maybe tweets take some time to load if you scroll too fast
const debouncedVerifyHandleOnTweetPage3 = debounce(verifyHandleOnTweetPage, 5000); // maybe tweets take some time to load if you scroll too fast

async function initPhishingHandleDetector() {
  const phishingHandleDetector = await getStorage("local", "settings:phishingHandleDetector", true);
  if (!phishingHandleDetector) return;

  verifyHandleOnTweetPage();
  window.addEventListener("scroll", () => {
    debouncedVerifyHandleOnTweetPage();
    debouncedVerifyHandleOnTweetPage2();
    debouncedVerifyHandleOnTweetPage3();
  });
}

//

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
  // else if (action === "yellow")
}

async function handleHomePage(twitterConfig) {
  return; // disable for now
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

  let element = Array.from(tweet.querySelectorAll<HTMLElement>('a[role="link"]'));
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
