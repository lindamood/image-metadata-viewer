// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');
const uploadAnotherBtn = document.getElementById('uploadAnotherBtn');

let selectedFile = null;

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
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif'];
    if (!validTypes.includes(file.type)) {
        showError('Please select a valid image file (JPEG, PNG, or TIFF)');
        return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
        showError('File size must be less than 50MB');
        return;
    }

    selectedFile = file;
    uploadBtn.disabled = false;

    // Update upload area text
    const uploadText = uploadArea.querySelector('.upload-text');
    uploadText.textContent = `Selected: ${file.name}`;
    uploadArea.style.borderColor = '#4caf50';
}

// Upload button click
uploadBtn.addEventListener('click', () => {
    if (selectedFile) {
        uploadImage(selectedFile);
    }
});

// Upload image
async function uploadImage(file) {
    hideError();
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

        displayMetadata(data);
    } catch (error) {
        showError('Error: ' + error.message);
        uploadBtn.disabled = false;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Display metadata
function displayMetadata(data) {
    const filename = document.getElementById('filename');
    filename.textContent = `File: ${data.filename}`;

    // Clear previous content
    document.getElementById('iptcContent').innerHTML = '';
    document.getElementById('exifContent').innerHTML = '';
    document.getElementById('xmpContent').innerHTML = '';
    document.getElementById('otherContent').innerHTML = '';

    const metadata = data.metadata;

    // Check if there's any metadata
    const hasMetadata = Object.keys(metadata).length > 0;
    document.getElementById('noMetadata').style.display = hasMetadata ? 'none' : 'block';

    if (hasMetadata) {
        // Display IPTC
        if (metadata.iptc && Object.keys(metadata.iptc).length > 0) {
            document.getElementById('iptcSection').style.display = 'block';
            displayMetadataSection('iptcContent', metadata.iptc);
        } else {
            document.getElementById('iptcSection').style.display = 'none';
        }

        // Display EXIF
        if (metadata.exif && Object.keys(metadata.exif).length > 0) {
            document.getElementById('exifSection').style.display = 'block';
            displayMetadataSection('exifContent', metadata.exif);
        } else {
            document.getElementById('exifSection').style.display = 'none';
        }

        // Display XMP
        if (metadata.xmp && Object.keys(metadata.xmp).length > 0) {
            document.getElementById('xmpSection').style.display = 'block';
            displayMetadataSection('xmpContent', metadata.xmp);
        } else {
            document.getElementById('xmpSection').style.display = 'none';
        }

        // Display Other
        if (metadata.other && Object.keys(metadata.other).length > 0) {
            document.getElementById('otherSection').style.display = 'block';
            displayMetadataSection('otherContent', metadata.other);
        } else {
            document.getElementById('otherSection').style.display = 'none';
        }
    }

    resultsSection.style.display = 'block';
}

// Display metadata section
function displayMetadataSection(elementId, data) {
    const container = document.getElementById(elementId);

    // Sort keys alphabetically
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

        // Format value based on type
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

// Format key for display
function formatKey(key) {
    // Add spaces before capital letters
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

// Upload another image
uploadAnotherBtn.addEventListener('click', () => {
    resetUpload();
});

// Reset upload
function resetUpload() {
    selectedFile = null;
    fileInput.value = '';
    uploadBtn.disabled = true;
    resultsSection.style.display = 'none';

    const uploadText = uploadArea.querySelector('.upload-text');
    uploadText.textContent = 'Drag & drop an image here or click to browse';
    uploadArea.style.borderColor = '#667eea';
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide error
function hideError() {
    errorMessage.style.display = 'none';
}
