import { Router } from 'express';
import { upload, uploadImage, handleUploadError } from '../controllers/uploadController';

const router = Router();

// POST /api/upload - Upload image file
router.post('/', upload.single('image'), uploadImage, handleUploadError);

export default router;