# Professional Image Metadata Viewer

A comprehensive web-based application for professional photographers to upload, view, edit, validate, and export IPTC, EXIF, and XMP metadata. Built with industry-standard tools and compliance checking.

## Features

### Core Functionality
- **Upload & Analysis**: Drag & drop or browse to upload image files with instant metadata extraction
- **Multiple Format Support**: Works with JPEG, PNG, and TIFF files (up to 50MB)
- **Professional Standards**: Uses ExifTool for comprehensive metadata extraction

### Advanced Features

#### 1. **Metadata Reading & Display**
- **Comprehensive Extraction**: Extracts IPTC, EXIF, XMP, IIM, and camera metadata
- **Organized Categories**:
  - Camera & Technical Data (Make, Model, Lens, Exposure settings)
  - IPTC Metadata (Title, Description, Keywords, Creator info)
  - Location Information (City, State, Country, GPS coordinates)
  - Copyright & Rights (Copyright notice, usage terms, credit)
  - XMP Metadata (Extended metadata properties)
  - IIM Metadata (Legacy IPTC format)

#### 2. **IPTC Standards Validation**
- Validates metadata against official IPTC Photo Metadata Standard
- Identifies compliance errors and warnings
- Ensures professional metadata quality
- Real-time validation feedback with color-coded indicators

#### 3. **XMP/IIM Format Synchronization**
- Checks synchronization between XMP and IIM (legacy) formats
- Identifies value mismatches between formats
- Ensures metadata consistency across embedded formats
- Helps maintain compatibility with older software

#### 4. **Multilingual Metadata Support**
- Detects and displays XMP LangAlt properties
- Shows metadata in multiple languages
- Supports internationalization of titles, descriptions, and captions

#### 5. **Metadata Editing & Embedding**
- **Edit Metadata**: User-friendly form to edit common IPTC fields
  - Title, Description, Keywords
  - Creator/Photographer name
  - Copyright, Credit, Source
  - Location (City, State, Country)
  - Instructions, Headline
- **Save to Image**: Embeds edited metadata back into image files
- **Download**: Download images with updated metadata
- **Standards Compliant**: Writes to both XMP and IIM formats

#### 6. **Export Capabilities**
- **JSON Export**: Export all metadata as structured JSON
- **CSV Export**: Export metadata in CSV format for spreadsheet analysis
- Preserves data structure and types
- Perfect for batch processing and documentation

#### 7. **Multi-Image Comparison**
- **Compare Mode**: Upload 2-10 images simultaneously
- **Side-by-Side Analysis**: View metadata differences across images
- **Statistics Dashboard**:
  - Total fields analyzed
  - Number of differing fields
  - Number of matching fields
- **Difference Highlighting**: Clearly shows which fields differ between images
- **Quality Control**: Perfect for checking consistency in photo series

### User Experience

- **Dual Mode Interface**: Toggle between Single Image and Comparison modes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Drag & Drop**: Intuitive file upload experience
- **Visual Feedback**: Real-time loading indicators and status messages
- **Professional UI**: Clean, modern interface optimized for photographers

## Technical Architecture

### Backend Stack
- **Node.js** with Express.js framework
- **ExifTool-Vendored**: Industry-standard metadata extraction (more comprehensive than exifr)
- **IPTC Photo Metadata Engine**: Official IPTC validation library
- **Multer**: Secure file upload handling
- **PapaParse**: CSV generation
- **Archiver**: File compression for downloads

### Frontend Stack
- **Vanilla JavaScript**: No framework dependencies for faster loading
- **Modern CSS**: Responsive design with flexbox and grid
- **HTML5**: Semantic markup with accessibility features

### Security Features
- File type validation (JPEG, PNG, TIFF only)
- File size limits (50MB maximum)
- Temporary file storage with automatic cleanup
- Files auto-deleted after 1 hour
- No persistent storage of user images

## Installation

### Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **ExifTool** is automatically installed via exiftool-vendored package

### Setup Steps

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage Guide

### Single Image Mode

1. **Upload an Image**
   - Drag & drop an image onto the upload area
   - Or click to browse and select a file
   - Click "Upload & Analyze Image"

2. **View Metadata**
   - Review validation status (✅ compliant or ❌ errors)
   - Check XMP/IIM synchronization status
   - Browse metadata organized by category
   - View multilingual fields if present

3. **Edit Metadata** (Optional)
   - Click "Edit Metadata" button
   - Fill in or modify IPTC fields
   - Click "Save Metadata to Image"
   - Download the updated image

4. **Export Metadata**
   - Click "Export JSON" for structured data
   - Click "Export CSV" for spreadsheet analysis

### Comparison Mode

1. **Upload Multiple Images**
   - Switch to "Compare Images" mode
   - Select 2-10 images
   - Click "Upload & Compare Images"

2. **Analyze Differences**
   - View comparison statistics
   - Review side-by-side metadata differences
   - Identify inconsistencies across images
   - Use for quality control in photo series

## Supported Metadata Standards

### IPTC Fields
- **Creator Information**: Photographer name, contact, job title, URL
- **Content Description**: Title, headline, description, keywords
- **Copyright**: Copyright notice, usage terms, credit line, source
- **Location**: City, state/province, country, sublocation, GPS coordinates
- **Administrative**: Date created, instructions, special instructions
- **Categories**: Category codes, supplemental categories

### EXIF Fields
- **Camera Information**: Make, model, serial number, firmware
- **Lens Data**: Lens model, focal length, lens serial number
- **Exposure Settings**: Shutter speed, aperture, ISO, exposure compensation
- **Technical Data**: White balance, metering mode, flash, color space
- **Image Properties**: Dimensions, resolution, orientation, bit depth
- **Software**: Editing software used, software version

### XMP Fields
- **Dublin Core**: Creator, title, description, rights, subject
- **Photoshop**: Credit, source, city, state, country, instructions
- **Rights Management**: Usage terms, copyright, web statement
- **Custom Namespaces**: Extended properties from various software

## API Endpoints

The application exposes several REST API endpoints:

- `POST /upload` - Upload and analyze a single image
- `POST /upload-multiple` - Upload multiple images for comparison
- `POST /save-metadata` - Save edited metadata to image
- `POST /compare` - Compare metadata between images
- `GET /download/:fileId` - Download image with updated metadata
- `GET /export/json/:fileId` - Export metadata as JSON
- `GET /export/csv/:fileId` - Export metadata as CSV
- `GET /validate/:fileId` - Run IPTC validation on image
- `GET /health` - Health check endpoint

## Project Structure

```
image-metadata-viewer/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML with dual-mode interface
│   ├── styles.css         # Comprehensive responsive styles
│   └── app.js             # Client-side JavaScript with all features
├── server.js              # Express server with ExifTool integration
├── package.json           # Dependencies and scripts
├── .gitignore            # Git ignore rules
├── uploads/              # Temporary upload directory (auto-created)
├── temp/                 # Edited files directory (auto-created)
└── README.md             # This file
```

## Comparison with IPTC Photo Metadata Engine

This application integrates the **IPTC Photo Metadata Engine** library to provide professional-grade features:

| Feature | This Application | IPTC Engine Alone |
|---------|-----------------|-------------------|
| Web Interface | ✅ Full UI | ❌ Library only |
| Read Metadata | ✅ ExifTool-based | ✅ ExifTool-based |
| Write Metadata | ✅ Via UI | ✅ Via code |
| IPTC Validation | ✅ Integrated | ✅ Core feature |
| XMP/IIM Sync Check | ✅ Visual display | ✅ Programmatic |
| Multilingual Support | ✅ Display | ✅ Full support |
| Comparison Tool | ✅ Multi-image UI | ✅ API only |
| CSV Export | ✅ One-click | ❌ Manual |
| JSON Export | ✅ One-click | ✅ Native format |
| Ease of Use | ✅ No coding | ❌ Developer library |

## Dependencies

### Production Dependencies
- **express** (^4.18.2): Web server framework
- **multer** (^1.4.5-lts.1): File upload handling
- **exifr** (^7.1.3): Lightweight metadata reader (legacy support)
- **cors** (^2.8.5): Cross-origin resource sharing
- **exiftool-vendored** (^25.0.0): Professional ExifTool wrapper
- **iptc-photometadata-engine** (^0.6.0): IPTC validation library
- **papaparse** (^5.4.1): CSV generation
- **archiver** (^6.0.1): File archiving

### Development Dependencies
- **nodemon** (^3.0.2): Auto-restart development server

## Configuration

### Environment Variables

```bash
# Server port (default: 3000)
PORT=3000
```

### File Upload Limits

- **Maximum file size**: 50MB
- **Accepted formats**: JPEG, JPG, PNG, TIFF, TIF
- **Maximum comparison images**: 10 files
- **File retention**: 1 hour (automatic cleanup)

## Troubleshooting

### Port Already in Use

```bash
PORT=3001 npm start
```

### No Metadata Found

Possible reasons:
- Image was processed/compressed without preserving metadata
- Image created without embedded metadata
- File format doesn't support requested metadata type

### ExifTool Errors

The exiftool-vendored package includes ExifTool binaries automatically. If you encounter issues:
1. Ensure you have sufficient disk space
2. Check file permissions on temp directories
3. Verify image file is not corrupted

### Installation Errors

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Performance Notes

- **First-time initialization**: ExifTool may take a few seconds to initialize
- **Large files**: Files near 50MB may take longer to process
- **Multiple comparisons**: Comparing 10 images processes all files sequentially
- **Memory usage**: Server cleans up temporary files hourly to manage memory

## Security Considerations

- All file uploads are validated for type and size
- Temporary files are isolated in dedicated directories
- Files are automatically cleaned up after 1 hour
- No user data is permanently stored
- CORS is enabled for API access (configure as needed)

## Future Enhancements

Potential features for future development:
- Batch processing multiple images with same edits
- Metadata templates for quick application
- GPS map visualization for location metadata
- Image preview with embedded metadata overlay
- API authentication for production deployment
- Database storage for metadata history
- Advanced search and filter capabilities
- Integration with photo management software

## Standards & Compliance

This application complies with:
- **IPTC Photo Metadata Standard** (latest version)
- **XMP Specification** by Adobe
- **EXIF 2.32** standard
- **IIM (IPTC-IIM)** for legacy compatibility

## License

ISC

## Support & Contributing

For issues, questions, or contributions:
- Open an issue in the repository
- Submit pull requests for improvements
- Check documentation at IPTC.org for metadata standards

## Credits

Built with:
- [ExifTool](https://exiftool.org/) by Phil Harvey
- [IPTC Photo Metadata Engine](https://github.com/nitmws/iptc-photometadata-engine) by IPTC
- Modern web technologies and open-source libraries

---

**Professional Image Metadata Viewer v2.0** - Built for photographers who care about metadata standards and quality.
