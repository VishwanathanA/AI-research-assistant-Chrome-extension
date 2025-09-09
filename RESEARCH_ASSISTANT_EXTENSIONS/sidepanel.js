const API_BASE = "http://localhost:8080/api/research";
let currentSummary = "";
let selectedText = "";

document.addEventListener('DOMContentLoaded', function() {
    loadSavedNotes();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
    document.getElementById('appendBtn').addEventListener('click', appendToNotes);
    document.getElementById('saveBtn').addEventListener('click', saveNotes);
    document.getElementById('historyBtn').addEventListener('click', openHistory);
}

async function summarizeText() {
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if we have permission to access this page
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
            showStatus('Cannot access browser pages. Please try on a regular website.', 'error');
            return;
        }

        // Execute script to get selected text directly from the page
        let result;
        try {
            [{ result }] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => window.getSelection().toString().trim()
            });
            selectedText = result || "";
        } catch (error) {
            showStatus('Cannot access this page. Please try on a different website.', 'error');
            return;
        }

        if (!selectedText) {
            showStatus('Please select some text on the page first!', 'error');
            return;
        }

        showStatus('Summarizing...', 'success');

        // Send to backend for processing - matches ResearchRequest structure
        const requestBody = {
            content: selectedText,
            operation: 'summarize',
            context: 'research',
            saveToDatabase: false
        };

        const response = await fetch(`${API_BASE}/process`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.text();
        currentSummary = data;
        
        // Display with bold tags rendered properly
        document.getElementById('summaryResult').innerHTML = data.replace(/\n/g, '<br>');
        
        // Enable append button
        document.getElementById('appendBtn').disabled = false;
        
        showStatus('Summary complete!', 'success');

    } catch (error) {
        console.error('Error:', error);
        showStatus('Error: ' + error.message, 'error');
        
        // Fallback
        if (selectedText) {
            currentSummary = selectedText.split(' ').slice(0, 30).join(' ') + '...';
            document.getElementById('summaryResult').textContent = currentSummary;
            document.getElementById('appendBtn').disabled = false;
        }
    }
}

function appendToNotes() {
    if (!currentSummary) {
        showStatus('No summary to append!', 'error');
        return;
    }

    try {
        const notesArea = document.getElementById('notes');
        
        // Convert HTML to plain text for notes
        const plainTextSummary = currentSummary
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<b>/gi, '')
            .replace(/<\/b>/gi, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/<[^>]*>/g, '');

        const separator = notesArea.value ? '\n' : '';
        notesArea.value += separator + plainTextSummary + '\n';
        
        // Scroll to bottom and focus
        notesArea.focus();
        notesArea.scrollTop = notesArea.scrollHeight;
        
        showStatus('Summary appended to notes!', 'success');
        
    } catch (error) {
        console.error('Append error:', error);
        showStatus('Error appending notes: ' + error.message, 'error');
    }
}

async function saveNotes() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('notes').value.trim();
    
    if (!title) {
        showStatus('Please add a title for your research!', 'error');
        return;
    }
    
    if (!content) {
        showStatus('Please add some notes!', 'error');
        return;
    }

    try {
        // CORRECTED: Match backend Research entity structure exactly
        const researchData = {
            title: title,
            content: content
            // Don't include selectedText, sourceUrl, or date fields
            // Backend will handle date automatically
        };

        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(researchData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Save failed: ${response.status} - ${errorText}`);
        }
        
        const savedResearch = await response.json();
        console.log('Saved successfully:', savedResearch);
        
        // Save notes to local storage as well
        chrome.storage.local.set({ researchNotes: content });
        
        showStatus('Notes saved to database successfully!', 'success');
        
        // Clear form
        document.getElementById('noteTitle').value = '';
        document.getElementById('notes').value = '';
        
        // Reset states
        currentSummary = "";
        selectedText = "";
        document.getElementById('summaryResult').textContent = 'Select text and click summarize to get results';
        document.getElementById('appendBtn').disabled = true;
        
    } catch (error) {
        console.error('Save error:', error);
        showStatus('Error saving: ' + error.message, 'error');
    }
}

function loadSavedNotes() {
    chrome.storage.local.get(['researchNotes'], function(result) {
        if (result.researchNotes) {
            document.getElementById('notes').value = result.researchNotes;
        }
    });
}

function openHistory() {
    // Open the history page
    chrome.tabs.create({ url: 'history.html' });
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    
    setTimeout(() => {
        statusDiv.className = 'status';
    }, 3000);
}