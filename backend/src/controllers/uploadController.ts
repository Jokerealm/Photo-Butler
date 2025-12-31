import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileService } from '../services/fileService';
import { UploadResponse, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../types/upload';

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

// File filter for JPG/PNG validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error('只支持JPG和PNG格式的图片文件'));
  }
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
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '请选择要上传的图片文件'
      } as UploadResponse);
      return;
    }

    const imageId = path.parse(req.file.filename).name; // Remove extension for ID
    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        imageId: imageId,
        imageUrl: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    } as UploadResponse);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: '图片上传失败'
    } as UploadResponse);
  }
};

// Error handler for multer errors
export const handleUploadError = (error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '文件大小不能超过10MB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: '意外的文件字段'
      });
    }
  }
  
  if (error.message === '只支持JPG和PNG格式的图片文件') {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  // Handle empty form data or other parsing errors
  if (error.message && error.message.includes('Unexpected end of form')) {
    return res.status(400).json({
      success: false,
      error: '请选择要上传的图片文件'
    });
  }

  console.error('Upload middleware error:', error);
  res.status(500).json({
    success: false,
    error: '文件上传处理失败'
  });
};