const API_BASE = "http://localhost:8080/api/research";
let currentData = [];
let currentEntryId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadHistory();

    document.getElementById('refreshBtn').addEventListener('click', loadHistory);
    document.getElementById('searchBtn').addEventListener('click', searchByKeyword);
    document.getElementById('filterDateBtn').addEventListener('click', filterByDate);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);

    // Back button functionality
    document.getElementById('backBtn').addEventListener('click', () => {
        window.history.back();
    });

    // Event delegation for table buttons
    document.querySelector('#historyTable tbody').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('edit-btn')) showEditModal(id);
        else if (e.target.classList.contains('delete-btn')) deleteEntry(id);
        else if (e.target.classList.contains('download-btn')) downloadPdf(id);
    });
});

// ------------------------
// Load all entries
// ------------------------
async function loadHistory() {
    showLoading(true);
    try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        currentData = await res.json();
        renderTable(currentData);
    } catch (err) {
        showAlert('Failed to load research', 'error');
        console.error(err);
    } finally {
        showLoading(false);
    }
}

// ------------------------
// Render table
// ------------------------
function renderTable(data) {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="loading-message">No research entries found</td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        tr.innerHTML = `
            <td>${item.title || 'Untitled'}</td>
            <td>${item.content ? (item.content.length > 80 ? item.content.substring(0, 80) + '...' : item.content) : 'No content'}</td>
            <td>${item.date || '-'}</td>
            <td>
                <button class="download-btn" data-id="${item.id}">Download PDF</button>
                <button class="edit-btn" data-id="${item.id}">Edit</button>
                <button class="delete-btn danger" data-id="${item.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ------------------------
// Show Edit Modal
// ------------------------
function showEditModal(id) {
    const entry = currentData.find(x => x.id == id);
    if (!entry) return showAlert('Entry not found', 'warning');

    currentEntryId = id;

    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <label>Title</label>
        <input type="text" id="editTitle" value="${entry.title || ''}">
        <label>Content</label>
        <textarea id="editContent">${entry.content || ''}</textarea>
        <div class="modal-actions">
            <button id="modalSaveBtn" class="primary-btn">Save</button>
            <button id="modalCancelBtn" class="secondary-btn">Cancel</button>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('show');

    document.getElementById('modalSaveBtn').addEventListener('click', saveEdit);
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
}

// ------------------------
// Save Edit
// ------------------------
async function saveEdit() {
    const title = document.getElementById('editTitle').value.trim();
    const content = document.getElementById('editContent').value.trim();

    if (!currentEntryId) return showAlert('No entry selected', 'warning');

    try {
        const res = await fetch(`${API_BASE}/${currentEntryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Update failed: ${text}`);
        }

        // Update table & local data
        const index = currentData.findIndex(x => x.id == currentEntryId);
        if (index !== -1) {
            currentData[index].title = title;
            currentData[index].content = content;
        }

        const row = document.querySelector(`#historyTable tbody tr[data-id='${currentEntryId}']`);
        if (row) {
            row.cells[0].textContent = title || 'Untitled';
            row.cells[1].textContent = content.length > 80 ? content.substring(0, 80) + '...' : content || 'No content';
        }

        showAlert('Updated successfully', 'success');
        closeModal();
    } catch (err) {
        showAlert(err.message, 'error');
        console.error(err);
    }
}

// ------------------------
// Delete entry
// ------------------------
async function deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');

        currentData = currentData.filter(x => x.id != id);
        const row = document.querySelector(`#historyTable tbody tr[data-id='${id}']`);
        if (row) row.remove();

        if (currentData.length === 0) renderTable([]);
        showAlert('Deleted successfully', 'success');
    } catch (err) {
        showAlert('Failed to delete', 'error');
        console.error(err);
    }
}

// ------------------------
// Download PDF
// ------------------------
function downloadPdf(id) {
    const link = document.createElement('a');
    link.href = `${API_BASE}/${id}/pdf`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ------------------------
// Close Modal
// ------------------------
function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.add('hidden');
    modal.classList.remove('show');
    document.getElementById('modalBody').innerHTML = '';
    currentEntryId = null;
}

// ------------------------
// Loading
// ------------------------
function showLoading(show) {
    const tbody = document.querySelector('#historyTable tbody');
    if (show) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-message">Loading...</td></tr>';
    } else {
        const loadingRow = tbody.querySelector('.loading-message');
        if (loadingRow) loadingRow.remove();
    }
}

// ------------------------
// Alerts
// ------------------------
function showAlert(msg, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert ${type}`;
    alertDiv.textContent = msg;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// ------------------------
// Search & Filter
// ------------------------
async function searchByKeyword() {
    const query = document.getElementById('searchQuery').value.trim();
    if (!query) return loadHistory();

    showLoading(true);
    try {
        const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        currentData = await res.json();
        renderTable(currentData);
    } catch (err) {
        showAlert('Search failed', 'error');
        console.error(err);
    } finally {
        showLoading(false);
    }
}

async function filterByDate() {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    if (!start || !end) return showAlert('Select both start and end dates', 'warning');

    showLoading(true);
    try {
        const res = await fetch(`${API_BASE}/search/date?startDate=${start}&endDate=${end}`);
        if (!res.ok) throw new Error('Filter failed');
        currentData = await res.json();
        renderTable(currentData);
    } catch (err) {
        showAlert('Date filter failed', 'error');
        console.error(err);
    } finally {
        showLoading(false);
    }
}
document.getElementById('backBtn').addEventListener('click', () => {
    // Close the current browser tab
    window.close();
});

