import { getTweetInfo, handleAdTweet, handleOpTweet, handleSusTweet, handleTweetWithAddress } from "./tweetHandlers";
import levenshtein from "fast-levenshtein";

//

/**
 * In-memory cache for holding previously analyzed links to prevent redundant analysis and reduce time to render ui modifications.
 * Also used to handle edge case of navigating back to a url that has been scrolled down (far enough down that actual original post is unmounted / not loaded yet).
 * Only storing the tweet handle and display name since they are only needed post-initial analysis actions (and to prevent memory bloat). Cleared/reset on refresh.
 */
export const tweetSafeInfoMemoryCache: {
  [pathname: string]: {
    tweetHandle: string;
    displayName: string;
  };
} = {};

/**
 * On demand initial analysis for the tweet status page.
 * Used to determine if the current linked tweet is a reply or the original post (the linked tweet cannot be assumed to be safe)
 */
export const tweetStatusPageInitialAnalysis = {
  linkedTweet: null as HTMLElement | null,
  batchNumberCounter: 0 as 0 | 1,
  isSafeTweetDetermined: false,
};

//

/**
 * Analyze tweets (op and replies) on the linked status page
 */
export async function handleTweetStatusPage() {
  const pathname = window.location.pathname;

  // check that the current page is a tweet page (not home/timeline page). Check done here in addition to in init page handler router to catch any edge cases
  const isTweetPage = pathname.split("/")[2] === "status";
  if (!isTweetPage) return;

  // get all tweets present. Redundancy in querying all tweets in each batch to mitigate edge cases and to preemtively assess tweets when they are loaded but before they are visible in the viewport (smoother ux)
  const tweetConversation = document.querySelector<HTMLElement>('[aria-label="Timeline: Conversation"]');
  const tweets = Array.from(tweetConversation.querySelectorAll<HTMLElement>('[data-testid="tweet"]'));
  // dont analyze batches of zero tweets. covers outcomes in which the page is still loading or when there are no other posts/replies (no need for further analysis)
  if (!tweets.length) return;

  // if safe tweet previously found and saved to cache, then skip analysis
  if (tweetSafeInfoMemoryCache[pathname]) {
    tweetStatusPageInitialAnalysis.isSafeTweetDetermined = true;
  }

  // analyze the tweet batch
  tweets.forEach((tweet, index) => {
    /* 
      Initial analysis: determine safe tweet if cache entry for current url not present
      - first batch will always include the linked tweet (first tweet in batch length of 1)
      - second batch will include the linked tweet and any surrounding tweets (either replies or the original post) (first tweet in batch length of > 1)
      - if no second batch (no surrounding tweets) then linked tweet is the original post and has no replies, thus does not need to be analyzed
    */
    if (!tweetStatusPageInitialAnalysis.isSafeTweetDetermined) {
      // save the first tweet in the first batch as the linked tweet (always the first tweet that is loaded on a status page)
      if (tweetStatusPageInitialAnalysis.batchNumberCounter === 0 && index == 0) {
        tweetStatusPageInitialAnalysis.linkedTweet = tweet;
        tweetStatusPageInitialAnalysis.batchNumberCounter++;
        return;
      }

      // compare the first tweet of the second batch to the linked tweet to determine if it is a reply or the original post
      if (tweetStatusPageInitialAnalysis.batchNumberCounter === 1 && index == 0) {
        // [dont need to do tweet.isEqualNode(tweetStatusPageInitialAnalysis.linkedTweet) here, can just use this first tweet of second batch]

        // save safe tweet info
        const { tweetHandle, displayName } = getTweetInfo(tweet);
        tweetSafeInfoMemoryCache[pathname] = { tweetHandle, displayName };
        tweetStatusPageInitialAnalysis.isSafeTweetDetermined = true;
      }
    }

    // once safe tweet is determined, then can proceed to do analysis and ui modifications
    if (!tweetSafeInfoMemoryCache[pathname]) return;
    // check if the tweet has already been analyzed
    if (tweet.getAttribute("data-dl-tweet-check")) return;

    const { tweetHandle, displayName, tweetText, isRepliedTo, isLinkedTweet } = getTweetInfo(tweet);

    // if the tweet handle is safe, then it's not a phishing handle (add to safe handle list)
    if (tweetHandle.toLowerCase() === tweetSafeInfoMemoryCache[pathname].tweetHandle.toLowerCase()) {
      handleOpTweet(tweet);
      return;
    } else {
      handleAdTweet(tweet);

      // if the tweet text content consists of only numbers, then it's sus. Add red background the tweet
      if (/^[0-9]+$/.test(tweetText)) {
        handleSusTweet(tweet, isLinkedTweet, "onlyNumbers", "BG_RED");
        return;
      }

      // only hide addresses if not from the op
      if (!!tweetText) handleTweetWithAddress(tweet, tweetText, isLinkedTweet);
    }

    // if the tweet handle is the same as the page handle, then it's sus. Add red background the tweet
    // [can improve due to false negatives with homoglyphic attacks in the username that cant be detected by equality. maybe use levenshtein distance fuzzy matching on username as well]
    if (displayName.toLowerCase() == tweetSafeInfoMemoryCache[pathname].displayName.toLowerCase()) {
      const distance = levenshtein.get(
        tweetSafeInfoMemoryCache[pathname].displayName.toLowerCase(),
        displayName.toLowerCase(),
      );
      if (distance <= 1) {
        if (index === 0 && isRepliedTo) {
          tweets.forEach((tweet2) => {
            if (
              getTweetInfo(tweet2).tweetHandle.toLowerCase() ==
              tweetSafeInfoMemoryCache[pathname].tweetHandle.toLowerCase()
            ) {
              handleSusTweet(tweet2, isLinkedTweet, "impersonation", "BG_RED");
            }
          });
        } else {
          handleSusTweet(tweet, isLinkedTweet, "impersonation", "BG_RED");
        }

        return;
      }
    }

    // denote that the tweet has been checked, preventing duplicate analysis
    tweet.setAttribute("data-dl-tweet-check", "true");
  });
}

//

/**
 * Analyze tweets found on the linked user timeline page
 */
export async function handleUserTimelinePage() {
  const isUserTimelinePage = !!document.querySelectorAll<HTMLElement>('[data-testid="UserName"]').length;
  if (!isUserTimelinePage) return;

  const tweets = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="tweet"]'));

  tweets.forEach((tweet, index) => {
    handleAdTweet(tweet);
  });
}

/**
 * Analyze tweets found on the home page
 */
export async function handleHomePage(/* twitterConfig */) {
  const isHomePage = window.location.pathname === "/home";
  if (!isHomePage) return;

  const tweets = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="tweet"]'));

  tweets.forEach((tweet, index) => {
    handleAdTweet(tweet);
  });

  /* // [code from previous version, potentially used for future implementation]
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    for (const tweet of tweets) {
      const { comments, likes, retweets, tweetHandle } = getTweetInfo(tweet);
      // if (comments === 0 && (likes > 10 || retweets > 5)) handleSusTweets(tweet);
      if (twitterConfig.blacklistSet.has(tweetHandle)) handleSusTweets(tweet);
      else if (twitterConfig.whitelistSet.has(tweetHandle)) continue;
      else if (twitterConfig.whitelist.some((i) => areHandlesSimilar(i, tweetHandle, 3))) handleSusTweets(tweet);
    }
  */
}
