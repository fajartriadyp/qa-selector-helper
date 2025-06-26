console.log("QA Selector Helper: Content Script Loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("QA Selector Helper: Message received in content script:", request);

  if (request.action === "ping_content_script") {
    console.log("QA Selector Helper: Received ping from popup.");
    sendResponse({ status: "success", message: "Pong from content script!" });
    return true; // Indicates that the response is sent asynchronously (or will be)
  }
  
  // Future actions will be handled here
  // e.g., scanning the page, highlighting elements, etc.

  // Default response if action is not handled
  // sendResponse({ status: "error", message: "Unknown action." });
  return true; // Keep channel open for future async responses if any other handlers are added
});
