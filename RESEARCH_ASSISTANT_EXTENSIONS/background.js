console.log("Research Assistant background script loaded");

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(error => console.error("Side panel setup error:", error));

// Fallback: open side panel on action click
chrome.action.onClicked.addListener((tab) => {
    if (tab?.windowId !== undefined) {
        chrome.sidePanel.open({ windowId: tab.windowId })
            .catch(error => console.error("Error opening side panel:", error));
    }
});

// Create context menu for text selection
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "researchAssistant",
        title: "Research with Assistant",
        contexts: ["selection"]
    });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.windowId) return;
    if (info.menuItemId === "researchAssistant" && info.selectionText) {
        chrome.storage.local.set({ 
            currentSelection: info.selectionText,
            selectionTimestamp: Date.now()
        });
        chrome.sidePanel.open({ windowId: tab.windowId })
            .catch(error => console.error("Error opening side panel:", error));
    }
});
