import { getStorage, sleep } from "@src/pages/libs/helpers";
import {
  handleHomePage,
  handleTweetStatusPage,
  handleUserTimelinePage,
  tweetStatusPageInitialAnalysis,
} from "./pageHandlers";

//

// entry point on twitter page load
initPhishingDetector();

/**
 * Initialize the twitter phishing detector. Monitors for tweet related changes, determines which twitter page is loaded,
 * and then runs the appropriate handler for that page. Monitors for changes via tab event listeners (in background script) for tab (navigation) updates and activations
 * and a content mutation observer (here in content script) for ui updates.
 */
async function initPhishingDetector() {
  // get phishing local storage config as set in the extension popup [local storage name left as "phishingHandleDetector" for now]
  const phishingHandleDetector = await getStorage("local", "settings:phishingHandleDetector", true);
  if (!phishingHandleDetector) return;

  let handlePage = getHandlerForTwitterPageVariant();
  handlePage(); // initial run on load [might not need]

  // listen for tab ui updates or activations from the background script (more details explained there on event emitters)
  chrome.runtime.onMessage.addListener(async (request: { message: "TabUpdated" | "TabActivated" }) => {
    // new navigation detected
    if (request.message === "TabUpdated" || request.message === "TabActivated") {
      // update handlers. works best with slight delay [might not need]
      await sleep(100);
      const updatedHandlePage = getHandlerForTwitterPageVariant();
      handlePage = updatedHandlePage;
      handlePage();
    }
  });

  // create mutation observer to montior changes to ui (created and initiated after other listeners). changes are then filtered to only find new tweets that are mounted
  const uiUpdateObserver = new MutationObserver((mutationsList, observer) => {
    // Iterate over each node mutation
    for (let mutation of mutationsList) {
      [...mutation.addedNodes, ...mutation.removedNodes].forEach((node) => {
        // filter for divs
        if (node instanceof HTMLElement && node.tagName.toLowerCase() === "div") {
          // filter for tweet cells
          if (node.getAttribute("data-testid") === "cellInnerDiv") {
            // see if desired tweet article element is present
            const tweet = node.querySelector<HTMLElement>('[data-testid="tweet"]');
            if (!tweet) return;

            handlePage();
          }
        }
      });
    }
  });
  // monitor document for ui changes
  uiUpdateObserver.observe(document, { childList: true, subtree: true });
}

/**
 * "Router" for determining which handler to use based on the current twitter page. Returns the handler function. If no handler is found, returns an empty function (no action taken)
 */
function getHandlerForTwitterPageVariant() {
  const pathname = window.location.pathname;

  if (pathname === "/home") return handleHomePage;
  else if (pathname.split("/")[2] === "status") {
    // Reset global var for determining safe tweet/handle
    tweetStatusPageInitialAnalysis.linkedTweet = null;
    tweetStatusPageInitialAnalysis.batchNumberCounter = 0;
    tweetStatusPageInitialAnalysis.isSafeTweetDetermined = false;
    return handleTweetStatusPage;
  } else if (!!document.querySelectorAll<HTMLElement>('[data-testid="UserName"]').length) return handleUserTimelinePage;
  else return () => {};
}
