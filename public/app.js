// State management
let currentFileId = null;
let currentMetadata = null;
let selectedFiles = [];
let selectedFilesMultiple = [];

// DOM Elements - Single Mode
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');

// DOM Elements - Compare Mode
const uploadAreaMultiple = document.getElementById('uploadAreaMultiple');
const fileInputMultiple = document.getElementById('fileInputMultiple');
const uploadMultipleBtn = document.getElementById('uploadMultipleBtn');
const loadingIndicatorCompare = document.getElementById('loadingIndicatorCompare');
const errorMessageCompare = document.getElementById('errorMessageCompare');
const comparisonResults = document.getElementById('comparisonResults');

// Mode Switching
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;

        // Update button states
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update content visibility
        document.querySelectorAll('.mode-content').forEach(content => {
            content.classList.remove('active');
        });

        if (mode === 'single') {
            document.getElementById('singleMode').classList.add('active');
        } else {
            document.getElementById('compareMode').classList.add('active');
        }
    });
});

// ============= SINGLE IMAGE MODE =============

// Click to browse
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// File selection
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file);
    }
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file) {
        handleFileSelect(file);
    }
});

// Handle file selection
function handleFileSelect(file) {
    if (!validateFile(file)) return;

    selectedFiles = [file];
    uploadBtn.disabled = false;

    const uploadText = uploadArea.querySelector('.upload-text');
    uploadText.textContent = `Selected: ${file.name}`;
    uploadArea.style.borderColor = '#4caf50';
}

// Validate file
function validateFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif'];
    if (!validTypes.includes(file.type)) {
        showError('Please select a valid image file (JPEG, PNG, or TIFF)', 'single');
        return false;
    }

    if (file.size > 50 * 1024 * 1024) {
        showError('File size must be less than 50MB', 'single');
        return false;
    }

    return true;
}

// Upload button click
uploadBtn.addEventListener('click', () => {
    if (selectedFiles.length > 0) {
        uploadImage(selectedFiles[0]);
    }
});

// Upload image
async function uploadImage(file) {
    hideError('single');
    resultsSection.style.display = 'none';
    loadingIndicator.style.display = 'block';
    uploadBtn.disabled = true;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        currentFileId = data.fileId;
        currentMetadata = data;
        displayMetadata(data);
    } catch (error) {
        showError('Error: ' + error.message, 'single');
        uploadBtn.disabled = false;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Display metadata
function displayMetadata(data) {
    document.getElementById('filename').textContent = `File: ${data.filename}`;

    // Display validation results
    if (data.validation) {
        displayValidation(data.validation);
    }

    // Display synchronization status
    if (data.synchronization) {
        displaySyncStatus(data.synchronization);
    }

    // Display multilingual fields
    if (data.multilingual && Object.keys(data.multilingual).length > 0) {
        displayMultilingual(data.multilingual);
    }

    // Clear previous metadata sections
    clearMetadataSections();

    const metadata = data.metadata;
    const hasMetadata = Object.keys(metadata).length > 0;
    document.getElementById('noMetadata').style.display = hasMetadata ? 'none' : 'block';

    if (hasMetadata) {
        // Display each category
        displayCategory('camera', metadata.camera, 'cameraSection', 'cameraContent');
        displayCategory('iptc', metadata.iptc, 'iptcSection', 'iptcContent');
        displayCategory('location', metadata.location, 'locationSection', 'locationContent');
        displayCategory('copyright', metadata.copyright, 'copyrightSection', 'copyrightContent');
        displayCategory('exif', metadata.exif, 'exifSection', 'exifContent');
        displayCategory('xmp', metadata.xmp, 'xmpSection', 'xmpContent');
        displayCategory('iim', metadata.iim, 'iimSection', 'iimContent');
        displayCategory('other', metadata.other, 'otherSection', 'otherContent');
    }

    resultsSection.style.display = 'block';
}

// Display category
function displayCategory(name, data, sectionId, contentId) {
    const section = document.getElementById(sectionId);
    const content = document.getElementById(contentId);

    if (data && Object.keys(data).length > 0) {
        section.style.display = 'block';
        content.innerHTML = '';
        displayMetadataSection(contentId, data);
    } else {
        section.style.display = 'none';
    }
}

// Display validation results
function displayValidation(validation) {
    const section = document.getElementById('validationSection');
    const icon = document.getElementById('validationIcon');
    const content = document.getElementById('validationContent');

    section.style.display = 'block';
    content.innerHTML = '';

    // Determine validation status
    const hasErrors = validation && validation.errors && validation.errors.length > 0;
    const hasWarnings = validation && validation.warnings && validation.warnings.length > 0;

    if (hasErrors) {
        section.classList.add('error');
        icon.textContent = '❌';
        content.innerHTML = '<p><strong>Validation Errors Found:</strong></p>';
        validation.errors.forEach(error => {
            content.innerHTML += `<div class="validation-item error">${error}</div>`;
        });
    } else if (hasWarnings) {
        section.classList.remove('error');
        icon.textContent = '⚠️';
        content.innerHTML = '<p><strong>Validation Warnings:</strong></p>';
        validation.warnings.forEach(warning => {
            content.innerHTML += `<div class="validation-item warning">${warning}</div>`;
        });
    } else {
        section.classList.add('success');
        icon.textContent = '✅';
        content.innerHTML = '<div class="validation-item success">All IPTC metadata is compliant with standards!</div>';
    }
}

// Display synchronization status
function displaySyncStatus(syncStatus) {
    const section = document.getElementById('syncSection');
    const icon = document.getElementById('syncIcon');
    const content = document.getElementById('syncContent');

    section.style.display = 'block';
    content.innerHTML = '';

    if (syncStatus.synchronized) {
        section.classList.add('success');
        icon.textContent = '✅';
        content.innerHTML = '<div class="sync-item success">XMP and IIM metadata are fully synchronized!</div>';
    } else {
        section.classList.remove('success');
        icon.textContent = '⚠️';
        content.innerHTML = '<p><strong>Synchronization Issues:</strong></p>';

        syncStatus.issues.forEach(issue => {
            content.innerHTML += `
                <div class="sync-item warning">
                    <strong>${issue.field}:</strong><br>
                    XMP: ${JSON.stringify(issue.xmpValue)}<br>
                    IIM: ${JSON.stringify(issue.iimValue)}<br>
                    <em>${issue.message}</em>
                </div>
            `;
        });
    }
}

// Display multilingual fields
function displayMultilingual(multilingual) {
    const section = document.getElementById('multilingualSection');
    const content = document.getElementById('multilingualContent');

    section.style.display = 'block';
    content.innerHTML = '';

    for (const [key, languages] of Object.entries(multilingual)) {
        const item = document.createElement('div');
        item.className = 'metadata-item';

        const keyEl = document.createElement('div');
        keyEl.className = 'metadata-key';
        keyEl.textContent = formatKey(key);

        const valueEl = document.createElement('div');
        valueEl.className = 'metadata-value';

        let langHtml = '';
        for (const [lang, value] of Object.entries(languages)) {
            langHtml += `<div><strong>${lang}:</strong> ${value}</div>`;
        }
        valueEl.innerHTML = langHtml;

        item.appendChild(keyEl);
        item.appendChild(valueEl);
        content.appendChild(item);
    }
}

// Display metadata section
function displayMetadataSection(elementId, data) {
    const container = document.getElementById(elementId);
    const sortedKeys = Object.keys(data).sort();

    sortedKeys.forEach(key => {
        const value = data[key];
        const item = document.createElement('div');
        item.className = 'metadata-item';

        const keyEl = document.createElement('div');
        keyEl.className = 'metadata-key';
        keyEl.textContent = formatKey(key);

        const valueEl = document.createElement('div');
        valueEl.className = 'metadata-value';

        if (Array.isArray(value)) {
            valueEl.classList.add('array');
            valueEl.textContent = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
            valueEl.textContent = JSON.stringify(value, null, 2);
        } else if (value instanceof Date) {
            valueEl.textContent = value.toLocaleString();
        } else {
            valueEl.textContent = String(value);
        }

        item.appendChild(keyEl);
        item.appendChild(valueEl);
        container.appendChild(item);
    });
}

// Clear metadata sections
function clearMetadataSections() {
    ['cameraContent', 'iptcContent', 'locationContent', 'copyrightContent',
     'exifContent', 'xmpContent', 'iimContent', 'otherContent'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });
}

// Format key for display
function formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}

// Edit Mode
document.getElementById('editModeBtn').addEventListener('click', () => {
    const editSection = document.getElementById('editSection');
    const isVisible = editSection.style.display === 'block';

    if (isVisible) {
        editSection.style.display = 'none';
    } else {
        populateEditForm();
        editSection.style.display = 'block';
        editSection.scrollIntoView({ behavior: 'smooth' });
    }
});

// Populate edit form
function populateEditForm() {
    if (!currentMetadata || !currentMetadata.rawMetadata) return;

    const metadata = currentMetadata.rawMetadata;
    const form = document.getElementById('editForm');

    // Map ExifTool tags to form fields
    const fieldMappings = {
        'title': ['XMP-dc:Title', 'IPTC:ObjectName', 'Title'],
        'description': ['XMP-dc:Description', 'IPTC:Caption-Abstract', 'Description'],
        'keywords': ['XMP-dc:Subject', 'IPTC:Keywords', 'Keywords'],
        'creator': ['XMP-dc:Creator', 'IPTC:By-line', 'Creator'],
        'copyright': ['XMP-dc:Rights', 'IPTC:CopyrightNotice', 'Copyright'],
        'credit': ['XMP-photoshop:Credit', 'IPTC:Credit', 'Credit'],
        'source': ['XMP-photoshop:Source', 'IPTC:Source', 'Source'],
        'city': ['XMP-photoshop:City', 'IPTC:City', 'City'],
        'state': ['XMP-photoshop:State', 'IPTC:Province-State', 'State'],
        'country': ['XMP-photoshop:Country', 'IPTC:Country-PrimaryLocationName', 'Country'],
        'instructions': ['XMP-photoshop:Instructions', 'IPTC:SpecialInstructions', 'Instructions'],
        'headline': ['XMP-photoshop:Headline', 'IPTC:Headline', 'Headline']
    };

    // Populate form fields
    for (const [fieldName, tagNames] of Object.entries(fieldMappings)) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (input) {
            let value = '';
            for (const tag of tagNames) {
                if (metadata[tag]) {
                    value = Array.isArray(metadata[tag]) ? metadata[tag].join(', ') : metadata[tag];
                    break;
                }
            }
            input.value = value || '';
        }
    }
}

// Save metadata
document.getElementById('saveMetadataBtn').addEventListener('click', async () => {
    if (!currentFileId) return;

    const form = document.getElementById('editForm');
    const formData = new FormData(form);
    const metadata = {};

    for (const [key, value] of formData.entries()) {
        if (value.trim()) {
            // Split keywords by comma
            if (key === 'keywords') {
                metadata[key] = value.split(',').map(k => k.trim()).filter(k => k);
            } else {
                metadata[key] = value.trim();
            }
        }
    }

    try {
        const response = await fetch('/save-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: currentFileId, metadata })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save metadata');
        }

        alert('✅ Metadata saved successfully! You can now download the updated image.');
        document.getElementById('downloadBtn').style.display = 'inline-block';
        document.getElementById('editSection').style.display = 'none';

    } catch (error) {
        alert('❌ Error saving metadata: ' + error.message);
    }
});

// Cancel edit
document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editSection').style.display = 'none';
});

// Export JSON
document.getElementById('exportJsonBtn').addEventListener('click', () => {
    if (currentFileId) {
        window.location.href = `/export/json/${currentFileId}`;
    }
});

// Export CSV
document.getElementById('exportCsvBtn').addEventListener('click', () => {
    if (currentFileId) {
        window.location.href = `/export/csv/${currentFileId}`;
    }
});

// Download image
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (currentFileId) {
        window.location.href = `/download/${currentFileId}`;
    }
});

// Upload another
document.getElementById('uploadAnotherBtn').addEventListener('click', () => {
    resetUpload();
});

// Reset upload
function resetUpload() {
    selectedFiles = [];
    fileInput.value = '';
    uploadBtn.disabled = true;
    resultsSection.style.display = 'none';
    document.getElementById('editSection').style.display = 'none';
    document.getElementById('downloadBtn').style.display = 'none';
    currentFileId = null;
    currentMetadata = null;

    const uploadText = uploadArea.querySelector('.upload-text');
    uploadText.textContent = 'Drag & drop an image here or click to browse';
    uploadArea.style.borderColor = '#667eea';
}

// ============= COMPARE MODE =============

// Click to browse multiple
uploadAreaMultiple.addEventListener('click', () => {
    fileInputMultiple.click();
});

// Multiple file selection
fileInputMultiple.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleMultipleFileSelect(files);
    }
});

// Drag and drop multiple
uploadAreaMultiple.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadAreaMultiple.classList.add('dragover');
});

uploadAreaMultiple.addEventListener('dragleave', () => {
    uploadAreaMultiple.classList.remove('dragover');
});

uploadAreaMultiple.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadAreaMultiple.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        handleMultipleFileSelect(files);
    }
});

// Handle multiple file selection
function handleMultipleFileSelect(files) {
    if (files.length < 2) {
        showError('Please select at least 2 images to compare', 'compare');
        return;
    }

    if (files.length > 10) {
        showError('Maximum 10 images allowed for comparison', 'compare');
        return;
    }

    let allValid = true;
    for (const file of files) {
        if (!validateFile(file)) {
            allValid = false;
            break;
        }
    }

    if (!allValid) return;

    selectedFilesMultiple = files;
    uploadMultipleBtn.disabled = false;

    const uploadText = uploadAreaMultiple.querySelector('.upload-text');
    uploadText.textContent = `Selected: ${files.length} images`;
    uploadAreaMultiple.style.borderColor = '#4caf50';
}

// Upload multiple button click
uploadMultipleBtn.addEventListener('click', () => {
    if (selectedFilesMultiple.length >= 2) {
        uploadMultipleImages(selectedFilesMultiple);
    }
});

// Upload multiple images
async function uploadMultipleImages(files) {
    hideError('compare');
    comparisonResults.style.display = 'none';
    loadingIndicatorCompare.style.display = 'block';
    uploadMultipleBtn.disabled = true;

    const formData = new FormData();
    files.forEach(file => {
        formData.append('images', file);
    });

    try {
        const response = await fetch('/upload-multiple', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        // Now compare the files
        const fileIds = data.files.map(f => f.fileId);
        await compareImages(fileIds);

    } catch (error) {
        showError('Error: ' + error.message, 'compare');
        uploadMultipleBtn.disabled = false;
    } finally {
        loadingIndicatorCompare.style.display = 'none';
    }
}

// Compare images
async function compareImages(fileIds) {
    try {
        const response = await fetch('/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileIds })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Comparison failed');
        }

        displayComparison(data);

    } catch (error) {
        showError('Error comparing images: ' + error.message, 'compare');
    }
}

// Display comparison
function displayComparison(data) {
    const stats = document.getElementById('comparisonStats');
    const content = document.getElementById('comparisonContent');

    // Display stats
    stats.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${data.files.length}</div>
            <div class="stat-label">Images Compared</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${data.totalFields}</div>
            <div class="stat-label">Total Fields</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${data.differingFields}</div>
            <div class="stat-label">Differing Fields</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${data.totalFields - data.differingFields}</div>
            <div class="stat-label">Matching Fields</div>
        </div>
    `;

    // Display differences table
    content.innerHTML = '<h3 style="color: #667eea; margin-bottom: 20px;">Metadata Differences</h3>';

    if (data.differingFields === 0) {
        content.innerHTML += '<p style="text-align: center; padding: 40px; font-size: 1.2rem;">All metadata fields are identical across all images!</p>';
    } else {
        const table = document.createElement('table');
        table.className = 'comparison-table';

        // Table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Field</th>';
        data.files.forEach(file => {
            headerRow.innerHTML += `<th>${file.filename}</th>`;
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement('tbody');
        for (const [field, values] of Object.entries(data.differences)) {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${formatKey(field)}</strong></td>`;

            values.forEach(value => {
                const displayValue = value ?
                    (typeof value === 'object' ? JSON.stringify(value) : String(value)) :
                    '<em style="color: #999;">Not present</em>';
                row.innerHTML += `<td class="difference-highlight">${displayValue}</td>`;
            });

            tbody.appendChild(row);
        }
        table.appendChild(tbody);

        content.appendChild(table);
    }

    comparisonResults.style.display = 'block';
}

// Compare another
document.getElementById('compareAnotherBtn').addEventListener('click', () => {
    resetCompare();
});

// Reset compare
function resetCompare() {
    selectedFilesMultiple = [];
    fileInputMultiple.value = '';
    uploadMultipleBtn.disabled = true;
    comparisonResults.style.display = 'none';

    const uploadText = uploadAreaMultiple.querySelector('.upload-text');
    uploadText.textContent = 'Upload 2-10 images to compare their metadata';
    uploadAreaMultiple.style.borderColor = '#667eea';
}

// ============= UTILITY FUNCTIONS =============

// Show error
function showError(message, mode = 'single') {
    const errorEl = mode === 'single' ? errorMessage : errorMessageCompare;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        hideError(mode);
    }, 5000);
}

// Hide error
function hideError(mode = 'single') {
    const errorEl = mode === 'single' ? errorMessage : errorMessageCompare;
    errorEl.style.display = 'none';
}
