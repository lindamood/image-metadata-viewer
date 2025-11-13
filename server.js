const express = require('express');
const multer = require('multer');
const { exiftool } = require('exiftool-vendored');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const cors = require('cors');
const Papa = require('papaparse');
const archiver = require('archiver');
const { IpmdChecker } = require('iptc-photometadata-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static('public'));

// Ensure required directories exist
const uploadDir = 'uploads';
const tempDir = 'temp';
if (!fsSync.existsSync(uploadDir)) {
  fsSync.mkdirSync(uploadDir);
}
if (!fsSync.existsSync(tempDir)) {
  fsSync.mkdirSync(tempDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|tiff|tif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, TIFF) are allowed!'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Store uploaded files temporarily for editing
const uploadedFiles = new Map();

// Upload endpoint with enhanced metadata extraction
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileId = Date.now().toString();

    // Store file info for later operations
    uploadedFiles.set(fileId, {
      path: filePath,
      originalName: req.file.originalname,
      timestamp: Date.now()
    });

    // Extract metadata using ExifTool
    const metadata = await exiftool.read(filePath);

    // Run IPTC validation
    let validationResults = null;
    try {
      const ipmdChecker = new IpmdChecker();
      validationResults = await ipmdChecker.checkIpmdStd(filePath);
    } catch (validationError) {
      console.error('IPTC validation error:', validationError);
      // Continue without validation if it fails
    }

    // Organize metadata
    const organizedMetadata = organizeMetadataEnhanced(metadata);

    // Extract multilingual fields
    const multilingualFields = extractMultilingualFields(metadata);

    // Check XMP/IIM synchronization
    const syncStatus = checkXmpIimSync(metadata);

    res.json({
      fileId,
      filename: req.file.originalname,
      metadata: organizedMetadata,
      rawMetadata: metadata,
      validation: validationResults,
      multilingual: multilingualFields,
      synchronization: syncStatus
    });

  } catch (error) {
    console.error('Error processing image:', error);

    // Clean up file if it exists
    if (req.file && fsSync.existsSync(req.file.path)) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({ error: 'Error processing image: ' + error.message });
  }
});

// Upload multiple images for comparison
app.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      const fileId = Date.now().toString() + '-' + file.originalname;
      const filePath = file.path;

      // Store file info
      uploadedFiles.set(fileId, {
        path: filePath,
        originalName: file.originalname,
        timestamp: Date.now()
      });

      // Extract metadata
      const metadata = await exiftool.read(filePath);
      const organizedMetadata = organizeMetadataEnhanced(metadata);

      // Run validation
      let validationResults = null;
      try {
        const ipmdChecker = new IpmdChecker();
        validationResults = await ipmdChecker.checkIpmdStd(filePath);
      } catch (error) {
        console.error('Validation error:', error);
      }

      results.push({
        fileId,
        filename: file.originalname,
        metadata: organizedMetadata,
        validation: validationResults
      });
    }

    res.json({ files: results });

  } catch (error) {
    console.error('Error processing images:', error);
    res.status(500).json({ error: 'Error processing images: ' + error.message });
  }
});

// Save metadata to image
app.post('/save-metadata', async (req, res) => {
  try {
    const { fileId, metadata } = req.body;

    if (!fileId || !metadata) {
      return res.status(400).json({ error: 'Missing fileId or metadata' });
    }

    const fileInfo = uploadedFiles.get(fileId);
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const originalPath = fileInfo.path;
    const outputPath = path.join(tempDir, `edited-${Date.now()}-${fileInfo.originalName}`);

    // Prepare metadata for ExifTool
    const exiftoolMetadata = prepareMetadataForExifTool(metadata);

    // Write metadata to a copy of the file
    await fs.copyFile(originalPath, outputPath);
    await exiftool.write(outputPath, exiftoolMetadata);

    // Update stored file path
    uploadedFiles.set(fileId, {
      ...fileInfo,
      path: outputPath,
      edited: true
    });

    res.json({
      success: true,
      message: 'Metadata saved successfully',
      fileId
    });

  } catch (error) {
    console.error('Error saving metadata:', error);
    res.status(500).json({ error: 'Error saving metadata: ' + error.message });
  }
});

// Download image with updated metadata
app.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = uploadedFiles.get(fileId);

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(fileInfo.path, fileInfo.originalName);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Error downloading file: ' + error.message });
  }
});

// Export metadata as JSON
app.get('/export/json/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = uploadedFiles.get(fileId);

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const metadata = await exiftool.read(fileInfo.path);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${path.parse(fileInfo.originalName).name}-metadata.json"`);
    res.json(metadata);

  } catch (error) {
    console.error('Error exporting JSON:', error);
    res.status(500).json({ error: 'Error exporting JSON: ' + error.message });
  }
});

// Export metadata as CSV
app.get('/export/csv/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = uploadedFiles.get(fileId);

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const metadata = await exiftool.read(fileInfo.path);

    // Convert metadata to flat array for CSV
    const csvData = Object.entries(metadata).map(([key, value]) => ({
      Property: key,
      Value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));

    const csv = Papa.unparse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${path.parse(fileInfo.originalName).name}-metadata.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Error exporting CSV: ' + error.message });
  }
});

// Compare metadata between multiple files
app.post('/compare', async (req, res) => {
  try {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 file IDs required for comparison' });
    }

    const comparisons = [];

    for (const fileId of fileIds) {
      const fileInfo = uploadedFiles.get(fileId);
      if (!fileInfo) {
        return res.status(404).json({ error: `File not found: ${fileId}` });
      }

      const metadata = await exiftool.read(fileInfo.path);
      comparisons.push({
        fileId,
        filename: fileInfo.originalName,
        metadata: organizeMetadataEnhanced(metadata)
      });
    }

    // Find common and different fields
    const allKeys = new Set();
    comparisons.forEach(comp => {
      Object.values(comp.metadata).forEach(category => {
        Object.keys(category).forEach(key => allKeys.add(key));
      });
    });

    const differences = {};
    allKeys.forEach(key => {
      const values = comparisons.map(comp => {
        // Find value in any category
        for (const category of Object.values(comp.metadata)) {
          if (category[key] !== undefined) {
            return category[key];
          }
        }
        return null;
      });

      // Check if all values are the same
      const firstValue = JSON.stringify(values[0]);
      const allSame = values.every(v => JSON.stringify(v) === firstValue);

      if (!allSame) {
        differences[key] = values;
      }
    });

    res.json({
      files: comparisons,
      differences,
      totalFields: allKeys.size,
      differingFields: Object.keys(differences).length
    });

  } catch (error) {
    console.error('Error comparing files:', error);
    res.status(500).json({ error: 'Error comparing files: ' + error.message });
  }
});

// Validate IPTC metadata
app.get('/validate/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = uploadedFiles.get(fileId);

    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    const ipmdChecker = new IpmdChecker();
    const validationResults = await ipmdChecker.checkIpmdStd(fileInfo.path);

    res.json({
      filename: fileInfo.originalName,
      validation: validationResults
    });

  } catch (error) {
    console.error('Error validating metadata:', error);
    res.status(500).json({ error: 'Error validating metadata: ' + error.message });
  }
});

// Helper function to organize metadata (enhanced)
function organizeMetadataEnhanced(metadata) {
  const organized = {
    iptc: {},
    exif: {},
    xmp: {},
    iim: {},
    camera: {},
    location: {},
    copyright: {},
    other: {}
  };

  // IPTC/XMP fields
  const iptcFields = [
    'Title', 'Description', 'Keywords', 'DateCreated', 'Creator',
    'CreatorWorkURL', 'AuthorsPosition', 'Credit', 'Source',
    'CopyrightNotice', 'RightsUsageTerms', 'Instructions',
    'Headline', 'Caption-Abstract', 'Writer-Editor'
  ];

  // EXIF/Camera fields
  const cameraFields = [
    'Make', 'Model', 'LensModel', 'SerialNumber', 'LensSerialNumber',
    'ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'ShutterSpeedValue',
    'ApertureValue', 'ExposureCompensation', 'MeteringMode', 'Flash',
    'WhiteBalance', 'ExposureProgram', 'ExposureMode', 'SceneCaptureType'
  ];

  // Location fields
  const locationFields = [
    'City', 'State', 'Country', 'CountryCode', 'Location',
    'Province-State', 'Country-PrimaryLocationName', 'Sub-location',
    'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSPosition'
  ];

  // Copyright fields
  const copyrightFields = [
    'Copyright', 'CopyrightNotice', 'Rights', 'UsageTerms',
    'Credit', 'Source', 'WebStatement', 'AttributionURL'
  ];

  // Categorize metadata
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;

    // Handle namespaced keys (e.g., XMP-dc:Creator)
    const cleanKey = key.includes(':') ? key.split(':')[1] : key;

    if (iptcFields.includes(cleanKey) || key.startsWith('IPTC:')) {
      organized.iptc[key] = value;
    } else if (key.startsWith('IFD0:') || key.startsWith('IFD1:')) {
      organized.iim[key] = value;
    } else if (cameraFields.includes(cleanKey) || key.startsWith('EXIF:')) {
      organized.camera[key] = value;
    } else if (locationFields.includes(cleanKey)) {
      organized.location[key] = value;
    } else if (copyrightFields.includes(cleanKey)) {
      organized.copyright[key] = value;
    } else if (key.startsWith('XMP:') || key.startsWith('XMP-')) {
      organized.xmp[key] = value;
    } else if (key.startsWith('File:') || key.startsWith('ExifTool:')) {
      organized.other[key] = value;
    } else {
      organized.exif[key] = value;
    }
  }

  // Remove empty categories
  Object.keys(organized).forEach(category => {
    if (Object.keys(organized[category]).length === 0) {
      delete organized[category];
    }
  });

  return organized;
}

// Extract multilingual fields
function extractMultilingualFields(metadata) {
  const multilingual = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Look for LangAlt structures (typically objects with language codes)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check if it looks like a language map
      const keys = Object.keys(value);
      if (keys.some(k => k.match(/^[a-z]{2}(-[A-Z]{2})?$/))) {
        multilingual[key] = value;
      }
    }
  }

  return multilingual;
}

// Check XMP/IIM synchronization
function checkXmpIimSync(metadata) {
  const syncStatus = {
    synchronized: true,
    issues: []
  };

  // Common fields that should be synchronized
  const syncFields = [
    { xmp: 'XMP-dc:Creator', iim: 'IPTC:By-line' },
    { xmp: 'XMP-dc:Rights', iim: 'IPTC:CopyrightNotice' },
    { xmp: 'XMP-dc:Title', iim: 'IPTC:ObjectName' },
    { xmp: 'XMP-dc:Description', iim: 'IPTC:Caption-Abstract' },
    { xmp: 'XMP-photoshop:City', iim: 'IPTC:City' },
    { xmp: 'XMP-photoshop:Country', iim: 'IPTC:Country-PrimaryLocationName' }
  ];

  for (const field of syncFields) {
    const xmpValue = metadata[field.xmp];
    const iimValue = metadata[field.iim];

    if (xmpValue && iimValue) {
      const xmpStr = JSON.stringify(xmpValue);
      const iimStr = JSON.stringify(iimValue);

      if (xmpStr !== iimStr) {
        syncStatus.synchronized = false;
        syncStatus.issues.push({
          field: field.xmp.split(':')[1],
          xmpValue,
          iimValue,
          message: `Value mismatch between XMP and IIM`
        });
      }
    }
  }

  return syncStatus;
}

// Prepare metadata for ExifTool writing
function prepareMetadataForExifTool(metadata) {
  const exiftoolTags = {};

  // Map common fields to ExifTool tags
  const fieldMapping = {
    'title': 'XMP-dc:Title',
    'description': 'XMP-dc:Description',
    'keywords': 'XMP-dc:Subject',
    'creator': 'XMP-dc:Creator',
    'copyright': 'XMP-dc:Rights',
    'credit': 'XMP-photoshop:Credit',
    'source': 'XMP-photoshop:Source',
    'city': 'XMP-photoshop:City',
    'state': 'XMP-photoshop:State',
    'country': 'XMP-photoshop:Country',
    'instructions': 'XMP-photoshop:Instructions',
    'headline': 'XMP-photoshop:Headline'
  };

  for (const [key, value] of Object.entries(metadata)) {
    const exiftoolKey = fieldMapping[key.toLowerCase()] || key;
    exiftoolTags[exiftoolKey] = value;
  }

  return exiftoolTags;
}

// Cleanup old files periodically (every hour)
setInterval(async () => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [fileId, fileInfo] of uploadedFiles.entries()) {
    if (now - fileInfo.timestamp > maxAge) {
      try {
        if (fsSync.existsSync(fileInfo.path)) {
          await fs.unlink(fileInfo.path);
        }
        uploadedFiles.delete(fileId);
      } catch (error) {
        console.error('Error cleaning up file:', error);
      }
    }
  }
}, 60 * 60 * 1000);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', exiftool: 'ready' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await exiftool.end();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Enhanced Image Metadata Viewer is running on http://localhost:${PORT}`);
  console.log('Features: Read, Write, Validate, Compare, Export (JSON/CSV)');
});
