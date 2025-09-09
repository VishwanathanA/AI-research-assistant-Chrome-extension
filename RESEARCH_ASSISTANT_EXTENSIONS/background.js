console.log("Research Assistant background script loaded");

// Set up side panel to open when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(function(error) {
        console.error("Side panel setup error:", error);
    });

// Fallback: open side panel when extension icon is clicked
chrome.action.onClicked.addListener(function(tab) {
    if (tab && tab.windowId !== undefined) {
        chrome.sidePanel.open({ windowId: tab.windowId })
            .catch(function(error) {
                console.error("Error opening side panel:", error);
            });
    }
});

// Create right-click menu option
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "researchAssistant",
        title: "Research with Assistant",
        contexts: ["selection"]
    });
});

// Handle right-click menu selection
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (!tab || !tab.windowId) return;
    
    if (info.menuItemId === "researchAssistant" && info.selectionText) {
        // Save selected text to storage
        chrome.storage.local.set({ 
            currentSelection: info.selectionText,
            selectionTimestamp: Date.now()
        });
        
        // Open side panel
        chrome.sidePanel.open({ windowId: tab.windowId })
            .catch(function(error) {
                console.error("Error opening side panel:", error);
            });
    }
});