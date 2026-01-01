import { Router } from 'express';
import { upload, uploadImage, handleMulterError } from '../controllers/uploadController';
import { uploadRateLimit, validateFileUpload } from '../middleware/security';

const router = Router();

// POST /api/upload - Upload image file with security checks
router.post('/', 
  uploadRateLimit,           // Rate limiting for uploads
  upload.single('image'),    // Multer file upload
  validateFileUpload,        // Additional file security checks
  uploadImage,               // Upload controller
  handleMulterError          // Error handling
);

export default router;