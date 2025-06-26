// server/middleware/fileUpload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Define allowed file types and their limits
const FILE_CONFIGS = {
  image: {
    types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['.jpg', '.jpeg', '.png', '.gif']
  },
  document: {
    types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['.pdf', '.doc', '.docx', '.txt']
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Create path based on entity type (project, story, chapter)
      const entityType = req.params.entityType;
      const uploadPath = path.join('uploads', entityType);
      
      // Create directory if it doesn't exist
      await fs.mkdir(uploadPath, { recursive: true });
      
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    // Clean filename of potentially dangerous characters
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '');
    
    cb(null, `${uniqueSuffix}-${cleanBaseName}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('Validating file:', file.originalname, 'MIME type:', file.mimetype);
  
  // Determine file category based on MIME type
  let fileCategory = null;
  let config = null;
  
  if (FILE_CONFIGS.image.types.includes(file.mimetype)) {
    fileCategory = 'image';
    config = FILE_CONFIGS.image;
  } else if (FILE_CONFIGS.document.types.includes(file.mimetype)) {
    fileCategory = 'document';
    config = FILE_CONFIGS.document;
  }
  
  if (!config) {
    console.log('❌ File type not allowed:', file.mimetype);
    return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
  
  // Check file extension as additional security
  const extension = path.extname(file.originalname).toLowerCase();
  if (!config.extensions.includes(extension)) {
    console.log('❌ File extension not allowed:', extension);
    return cb(new Error(`File extension ${extension} is not allowed`), false);
  }
  
  console.log('✅ File validation passed:', file.originalname);
  
  // Add file category to request for later use
  req.fileCategory = fileCategory;
  
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max (will be checked per type later)
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// Middleware to check file size based on category
const checkFileSize = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  const config = FILE_CONFIGS[req.fileCategory];
  if (req.file.size > config.maxSize) {
    // Delete the uploaded file since it's too large
    fs.unlink(req.file.path).catch(console.error);
    
    const maxSizeMB = config.maxSize / (1024 * 1024);
    return res.status(400).json({
      message: `File too large. ${req.fileCategory} files must be ${maxSizeMB}MB or smaller.`
    });
  }
  
  next();
};

module.exports = {
  upload,
  checkFileSize,
  FILE_CONFIGS
};