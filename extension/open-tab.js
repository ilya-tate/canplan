// Opens html in a new tab
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "index.html" });
});
