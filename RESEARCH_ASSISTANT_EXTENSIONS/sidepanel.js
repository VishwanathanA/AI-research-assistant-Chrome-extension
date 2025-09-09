const API_BASE = "http://localhost:8080/api/research";
let currentSummary = "";
let selectedText = "";

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    loadSavedNotes();
    setupEventListeners();
});

// Set up all button click events
function setupEventListeners() {
    document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
    document.getElementById('appendBtn').addEventListener('click', appendToNotes);
    document.getElementById('saveBtn').addEventListener('click', saveNotes);
    document.getElementById('historyBtn').addEventListener('click', openHistory);
}

// Get selected text and send to backend for summarization
async function summarizeText() {
    try {
        // Get the current browser tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        // Check if we can access this page
        if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('edge://')) {
            showStatus('Cannot access browser pages. Please try on a regular website.', 'error');
            return;
        }

        // Get selected text from the page
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                function: getSelectedText
            });
            selectedText = results[0].result || "";
        } catch (error) {
            showStatus('Cannot access this page. Please try on a different website.', 'error');
            return;
        }

        // Check if text was selected
        if (!selectedText) {
            showStatus('Please select some text on the page first!', 'error');
            return;
        }

        showStatus('Summarizing...', 'success');

        // Prepare data to send to backend
        const requestData = {
            content: selectedText,
            operation: 'summarize',
            context: 'research',
            saveToDatabase: false
        };

        // Send request to backend
        const response = await fetch(API_BASE + '/process', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        // Check if request was successful
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        
        // Get the summary from response
        const summary = await response.text();
        currentSummary = summary;
        
        // Display the summary
        document.getElementById('summaryResult').innerHTML = summary.replace(/\n/g, '<br>');
        
        // Enable the append button
        document.getElementById('appendBtn').disabled = false;
        
        showStatus('Summary complete!', 'success');

    } catch (error) {
        console.error('Error:', error);
        showStatus('Error: ' + error.message, 'error');
        
        // Fallback: show first few words of selected text
        if (selectedText) {
            currentSummary = selectedText.split(' ').slice(0, 30).join(' ') + '...';
            document.getElementById('summaryResult').textContent = currentSummary;
            document.getElementById('appendBtn').disabled = false;
        }
    }
}

// Function to get selected text (runs on the webpage)
function getSelectedText() {
    return window.getSelection().toString().trim();
}

// Add summary to notes
function appendToNotes() {
    if (!currentSummary) {
        showStatus('No summary to append!', 'error');
        return;
    }

    try {
        const notesTextarea = document.getElementById('notes');
        
        // Convert HTML to plain text
        const plainText = currentSummary
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<b>/gi, '')
            .replace(/<\/b>/gi, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/<[^>]*>/g, '');

        // Add separator if notes already exist
        const separator = notesTextarea.value ? '\n\n' : '';
        notesTextarea.value += separator + plainText + '\n';
        
        // Scroll to bottom and focus
        notesTextarea.focus();
        notesTextarea.scrollTop = notesTextarea.scrollHeight;
        
        showStatus('Summary appended to notes!', 'success');
        
    } catch (error) {
        console.error('Append error:', error);
        showStatus('Error appending notes: ' + error.message, 'error');
    }
}

// Save notes to database
async function saveNotes() {
    const titleInput = document.getElementById('noteTitle');
    const notesTextarea = document.getElementById('notes');
    
    const title = titleInput.value.trim();
    const content = notesTextarea.value.trim();
    
    // Validate inputs
    if (!title) {
        showStatus('Please add a title for your research!', 'error');
        return;
    }
    
    if (!content) {
        showStatus('Please add some notes!', 'error');
        return;
    }

    try {
        // Prepare data for saving
        const researchData = {
            title: title,
            content: content
        };

        // Send save request
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(researchData)
        });

        // Check if save was successful
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Save failed: ' + errorText);
        }
        
        // Save was successful
        const savedData = await response.json();
        console.log('Saved successfully:', savedData);
        
        // Also save to browser storage
        chrome.storage.local.set({ researchNotes: content });
        
        showStatus('Notes saved to database successfully!', 'success');
        
        // Clear the form
        titleInput.value = '';
        notesTextarea.value = '';
        
        // Reset summary section
        currentSummary = "";
        selectedText = "";
        document.getElementById('summaryResult').textContent = 'Select text and click summarize to get results';
        document.getElementById('appendBtn').disabled = true;
        
    } catch (error) {
        console.error('Save error:', error);
        showStatus('Error saving: ' + error.message, 'error');
    }
}

// Load saved notes from browser storage
function loadSavedNotes() {
    chrome.storage.local.get(['researchNotes'], function(result) {
        if (result.researchNotes) {
            document.getElementById('notes').value = result.researchNotes;
        }
    });
}

// Open history page
function openHistory() {
    chrome.tabs.create({ url: 'history.html' });
}

// Show status message
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    
    // Hide status after 3 seconds
    setTimeout(function() {
        statusDiv.className = 'status';
    }, 3000);
}