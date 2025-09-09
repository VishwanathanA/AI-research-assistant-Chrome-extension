let currentSelection = '';

// Store selection immediately when user selects text
document.addEventListener('mouseup', function() {
    const selection = window.getSelection().toString().trim();
    if (selection && selection !== currentSelection) {
        currentSelection = selection;
        chrome.storage.local.set({ 
            currentSelection: selection,
            selectionTimestamp: Date.now()
        });
    }
});

// Also listen for selection changes
document.addEventListener('selectionchange', function() {
    const selection = window.getSelection().toString().trim();
    if (selection && selection !== currentSelection) {
        currentSelection = selection;
        chrome.storage.local.set({ 
            currentSelection: selection,
            selectionTimestamp: Date.now()
        });
    }
});

// Get initial selection if any
function checkInitialSelection() {
    const selection = window.getSelection().toString().trim();
    if (selection) {
        currentSelection = selection;
        chrome.storage.local.set({ 
            currentSelection: selection,
            selectionTimestamp: Date.now()
        });
    }
}

// Run after page loads
setTimeout(checkInitialSelection, 1000);