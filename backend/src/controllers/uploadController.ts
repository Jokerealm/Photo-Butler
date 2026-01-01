import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileService } from '../services/fileService';
import { imageProcessingService } from '../services/imageProcessingService';
import { UploadResponse, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../types/upload';
import { ValidationError, FileError, asyncHandler, handleMulterError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueId = crypto.randomUUID();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});

// File filter for JPG/PNG validation with enhanced security
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    return cb(new FileError('只支持JPG和PNG格式的图片文件', 'INVALID_FILE_TYPE'));
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  if (!allowedExtensions.includes(ext)) {
    return cb(new FileError('文件扩展名与MIME类型不匹配', 'EXTENSION_MISMATCH'));
  }
  
  // Check for suspicious filenames
  const filename = file.originalname.toLowerCase();
  const suspiciousPatterns = [
    /\.php/i, /\.asp/i, /\.jsp/i, /\.exe/i, /\.bat/i, /\.cmd/i,
    /\.scr/i, /\.vbs/i, /\.js$/i, /\.html/i, /\.htm/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(filename)) {
      return cb(new FileError('文件名包含不安全的内容', 'SUSPICIOUS_FILENAME'));
    }
  }
  
  // Log security check
  logger.info('File filter security check passed', {
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  cb(null, true);
};

// Configure multer with storage, file filter, and size limits
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  }
});

// Upload controller function
export const uploadImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new ValidationError('请选择要上传的图片文件');
  }

  const imageId = path.parse(req.file.filename).name; // Remove extension for ID
  const imageUrl = `/uploads/${req.file.filename}`;
  const originalPath = req.file.path;

  try {
    // Optimize the uploaded image (compress and generate thumbnails)
    const optimization = await imageProcessingService.optimizeUploadedImage(
      originalPath,
      req.file.filename
    );

    // Get image metadata for additional info
    const metadata = await imageProcessingService.getImageMetadata(originalPath);

    logger.info('Image uploaded and optimized successfully', {
      imageId,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      dimensions: `${metadata.width}x${metadata.height}`,
      thumbnails: Object.keys(optimization.thumbnails)
    });

    res.json({
      success: true,
      data: {
        imageId: imageId,
        imageUrl: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        },
        thumbnails: optimization.thumbnails,
        compressed: true
      }
    } as UploadResponse);
  } catch (optimizationError) {
    // If optimization fails, still return the original upload
    logger.warn('Image optimization failed, returning original', {
      error: optimizationError,
      imageId,
      filename: req.file.filename
    });

    res.json({
      success: true,
      data: {
        imageId: imageId,
        imageUrl: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        compressed: false
      }
    } as UploadResponse);
  }
});

// Error handler for multer errors - use the centralized handler
export { handleMulterError };