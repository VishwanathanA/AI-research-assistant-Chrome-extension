let currentSelection = '';

// Listen for text selection
document.addEventListener('mouseup', function() {
    const selection = window.getSelection().toString().trim();
    if (selection && selection !== currentSelection) {
        currentSelection = selection;
        // Save to browser storage
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
        // Save to browser storage
        chrome.storage.local.set({ 
            currentSelection: selection,
            selectionTimestamp: Date.now()
        });
    }
});

// Check for existing selection when page loads
function checkInitialSelection() {
    const selection = window.getSelection().toString().trim();
    if (selection) {
        currentSelection = selection;
        // Save to browser storage
        chrome.storage.local.set({ 
            currentSelection: selection,
            selectionTimestamp: Date.now()
        });
    }
}

// Wait a bit after page load to check for selection
setTimeout(checkInitialSelection, 1000);