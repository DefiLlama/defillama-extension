(async () => {
  const src = chrome.runtime.getURL("src/pages/content/index.js");
  await import(src);
})();
