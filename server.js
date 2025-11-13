const express = require('express');
const multer = require('multer');
const exifr = require('exifr');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from public directory
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
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

// Upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    // Extract all metadata including IPTC
    const metadata = await exifr.parse(filePath, {
      iptc: true,
      exif: true,
      icc: true,
      jfif: true,
      xmp: true,
      tiff: true
    });

    // Clean up the uploaded file after extraction
    fs.unlinkSync(filePath);

    if (!metadata) {
      return res.json({
        filename: req.file.originalname,
        message: 'No metadata found in this image',
        metadata: {}
      });
    }

    // Organize metadata by category
    const organizedMetadata = organizeMetadata(metadata);

    res.json({
      filename: req.file.originalname,
      metadata: organizedMetadata
    });

  } catch (error) {
    console.error('Error processing image:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Error processing image: ' + error.message });
  }
});

// Helper function to organize metadata
function organizeMetadata(metadata) {
  const organized = {
    iptc: {},
    exif: {},
    xmp: {},
    other: {}
  };

  // IPTC fields (common IPTC/IIM fields)
  const iptcFields = [
    'ObjectName', 'Caption', 'Keywords', 'DateCreated', 'TimeCreated',
    'ByLine', 'ByLineTitle', 'Credit', 'Source', 'CopyrightNotice',
    'Contact', 'City', 'State', 'Country', 'Category', 'SupplementalCategories',
    'Urgency', 'Headline', 'SpecialInstructions', 'Writer', 'ImageType',
    'orientation', 'language'
  ];

  // EXIF fields (common camera/technical data)
  const exifFields = [
    'Make', 'Model', 'ExposureTime', 'FNumber', 'ISO', 'DateTimeOriginal',
    'CreateDate', 'ShutterSpeedValue', 'ApertureValue', 'ExposureCompensation',
    'MeteringMode', 'Flash', 'FocalLength', 'WhiteBalance', 'LensModel',
    'ColorSpace', 'ExifImageWidth', 'ExifImageHeight', 'Orientation',
    'XResolution', 'YResolution', 'ResolutionUnit', 'Software'
  ];

  // Categorize metadata
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;

    if (iptcFields.includes(key)) {
      organized.iptc[key] = value;
    } else if (exifFields.includes(key)) {
      organized.exif[key] = value;
    } else if (key.startsWith('xmp')) {
      organized.xmp[key] = value;
    } else {
      organized.other[key] = value;
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
