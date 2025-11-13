# Image Metadata Viewer

A professional web-based application for photographers to upload images and view embedded IPTC, EXIF, and XMP metadata.

## Features

- **Easy Upload**: Drag & drop or browse to select image files
- **Multiple Format Support**: Works with JPEG, PNG, and TIFF files
- **Comprehensive Metadata**: Extracts and displays:
  - IPTC metadata (copyright, keywords, captions, location, etc.)
  - EXIF data (camera settings, lens info, exposure, etc.)
  - XMP metadata
  - Additional technical metadata
- **Clean Interface**: Professional, user-friendly design
- **Responsive Design**: Works on desktop and mobile devices
- **Secure**: Files are processed and immediately deleted from the server

## Installation

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Setup

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

## Usage

### Start the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Using the Application

1. Open your web browser and navigate to `http://localhost:3000`
2. Drag and drop an image file onto the upload area, or click to browse
3. Click the "Upload Image" button
4. View the extracted metadata organized by category
5. Click "Upload Another Image" to process a new file

## Supported Image Formats

- JPEG / JPG
- PNG
- TIFF / TIF

Maximum file size: 50MB

## IPTC Metadata Fields

The application can extract various IPTC fields including:

- **Creator Information**: Photographer name, contact, job title
- **Image Information**: Caption, headline, keywords, category
- **Copyright**: Copyright notice, usage terms
- **Location**: City, state, country
- **Date/Time**: Creation date and time
- **Instructions**: Special instructions for image use

## EXIF Metadata Fields

Common EXIF fields include:

- **Camera**: Make, model, serial number
- **Exposure Settings**: Shutter speed, aperture, ISO
- **Lens Information**: Focal length, lens model
- **White Balance**: Auto/Manual settings
- **Flash**: Flash usage and mode
- **Color Space**: sRGB, Adobe RGB, etc.
- **Software**: Editing software used
- **Orientation**: Image rotation

## Project Structure

```
image-metadata-viewer/
├── public/               # Frontend files
│   ├── index.html       # Main HTML page
│   ├── styles.css       # Styling
│   └── app.js           # Client-side JavaScript
├── server.js            # Express server and metadata extraction
├── package.json         # Dependencies and scripts
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Dependencies

- **express**: Web server framework
- **multer**: File upload handling
- **exifr**: Metadata extraction library
- **cors**: Cross-origin resource sharing

## Security Notes

- Uploaded files are temporarily stored in the `uploads/` directory
- Files are automatically deleted after metadata extraction
- File type validation ensures only image files are processed
- File size limits prevent abuse

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it by setting the PORT environment variable:

```bash
PORT=3001 npm start
```

### No Metadata Found

Some images may not contain metadata if:
- The metadata was stripped during processing/compression
- The image was created without embedded metadata
- The file format doesn't support the requested metadata type

### Installation Errors

If you encounter installation errors:
1. Make sure you have Node.js 14 or higher installed
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` folder and reinstall: `rm -rf node_modules && npm install`

## Future Enhancements

Potential features for future development:
- Batch upload and processing
- Export metadata to CSV/JSON
- Edit and save metadata back to images
- Side-by-side comparison of multiple images
- Search and filter by metadata fields

## License

ISC

## Support

For issues or questions, please open an issue in the repository.
