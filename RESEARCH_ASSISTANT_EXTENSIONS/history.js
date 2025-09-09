const API_BASE = "http://localhost:8080/api/research";
let researchData = [];
let currentEditId = null;

// Run when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadResearchHistory();
    setupEventListeners();
});

// Set up all button click events
function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', loadResearchHistory);
    document.getElementById('searchBtn').addEventListener('click', searchResearch);
    document.getElementById('filterDateBtn').addEventListener('click', filterByDate);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('backBtn').addEventListener('click', goBack);

    // Handle clicks on table buttons
    document.getElementById('historyTable').addEventListener('click', function(event) {
        const button = event.target;
        const researchId = button.getAttribute('data-id');
        
        if (!researchId) return;
        
        if (button.classList.contains('edit-btn')) {
            showEditModal(researchId);
        } else if (button.classList.contains('delete-btn')) {
            deleteResearch(researchId);
        } else if (button.classList.contains('download-btn')) {
            downloadPdf(researchId);
        }
    });
}

// Load all research entries
async function loadResearchHistory() {
    showLoading(true);
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error('Failed to load research');
        
        researchData = await response.json();
        displayResearchTable(researchData);
    } catch (error) {
        showAlert('Failed to load research history', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// Display research data in table
function displayResearchTable(data) {
    const tableBody = document.querySelector('#historyTable tbody');
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No research entries found</td></tr>';
        return;
    }

    data.forEach(function(item) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id);
        
        const contentPreview = item.content 
            ? (item.content.length > 80 ? item.content.substring(0, 80) + '...' : item.content)
            : 'No content';
            
        row.innerHTML = `
            <td>${item.title || 'Untitled'}</td>
            <td>${contentPreview}</td>
            <td>${item.date || '-'}</td>
            <td>
                <button class="download-btn" data-id="${item.id}">Download PDF</button>
                <button class="edit-btn" data-id="${item.id}">Edit</button>
                <button class="delete-btn danger" data-id="${item.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Show edit modal
function showEditModal(researchId) {
    const research = researchData.find(function(item) {
        return item.id == researchId;
    });
    
    if (!research) {
        showAlert('Research entry not found', 'warning');
        return;
    }

    currentEditId = researchId;

    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <label>Title</label>
        <input type="text" id="editTitle" value="${research.title || ''}">
        <label>Content</label>
        <textarea id="editContent">${research.content || ''}</textarea>
        <div class="modal-actions">
            <button id="modalSaveBtn" class="primary-btn">Save</button>
            <button id="modalCancelBtn" class="secondary-btn">Cancel</button>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('show');

    document.getElementById('modalSaveBtn').addEventListener('click', saveResearchEdit);
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
}

// Save edited research
async function saveResearchEdit() {
    const title = document.getElementById('editTitle').value.trim();
    const content = document.getElementById('editContent').value.trim();

    if (!currentEditId) {
        showAlert('No research selected for editing', 'warning');
        return;
    }

    try {
        const response = await fetch(API_BASE + '/' + currentEditId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Update failed: ' + errorText);
        }

        // Update local data
        const researchIndex = researchData.findIndex(function(item) {
            return item.id == currentEditId;
        });
        
        if (researchIndex !== -1) {
            researchData[researchIndex].title = title;
            researchData[researchIndex].content = content;
        }

        // Update table display
        const row = document.querySelector('tr[data-id="' + currentEditId + '"]');
        if (row) {
            const contentPreview = content.length > 80 ? content.substring(0, 80) + '...' : content;
            row.cells[0].textContent = title || 'Untitled';
            row.cells[1].textContent = contentPreview || 'No content';
        }

        showAlert('Research updated successfully', 'success');
        closeModal();
    } catch (error) {
        showAlert(error.message, 'error');
        console.error(error);
    }
}

// Delete research entry
async function deleteResearch(researchId) {
    if (!confirm('Are you sure you want to delete this research entry?')) {
        return;
    }

    try {
        const response = await fetch(API_BASE + '/' + researchId, { 
            method: 'DELETE' 
        });
        
        if (!response.ok) throw new Error('Delete failed');

        // Remove from local data
        researchData = researchData.filter(function(item) {
            return item.id != researchId;
        });

        // Remove from table
        const row = document.querySelector('tr[data-id="' + researchId + '"]');
        if (row) row.remove();

        if (researchData.length === 0) {
            displayResearchTable([]);
        }
        
        showAlert('Research deleted successfully', 'success');
    } catch (error) {
        showAlert('Failed to delete research', 'error');
        console.error(error);
    }
}

// Download PDF
function downloadPdf(researchId) {
    const downloadLink = document.createElement('a');
    downloadLink.href = API_BASE + '/' + researchId + '/pdf';
    downloadLink.download = 'research.pdf';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.add('hidden');
    modal.classList.remove('show');
    document.getElementById('modalBody').innerHTML = '';
    currentEditId = null;
}

// Go back to previous page
function goBack() {
    window.close();
}

// Search research by keyword
async function searchResearch() {
    const searchQuery = document.getElementById('searchQuery').value.trim();
    if (!searchQuery) {
        loadResearchHistory();
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(API_BASE + '/search?query=' + encodeURIComponent(searchQuery));
        if (!response.ok) throw new Error('Search failed');
        
        researchData = await response.json();
        displayResearchTable(researchData);
    } catch (error) {
        showAlert('Search failed', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// Filter by date range
async function filterByDate() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showAlert('Please select both start and end dates', 'warning');
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/search/date?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) throw new Error('Date filter failed');
        
        researchData = await response.json();
        displayResearchTable(researchData);
    } catch (error) {
        showAlert('Date filter failed', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// Show loading state
function showLoading(show) {
    const tableBody = document.querySelector('#historyTable tbody');
    if (show) {
        tableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    }
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'custom-alert ' + type;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(function() {
        alertDiv.remove();
    }, 3000);
}