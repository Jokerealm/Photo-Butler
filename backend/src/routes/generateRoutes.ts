import { Router } from 'express';
import { getGenerateController } from '../controllers/generateController';

/**
 * Generate routes
 * 图片生成路由
 */
const router = Router();

// POST /api/generate - 生成AI图片
router.post('/', (req, res) => {
  const controller = getGenerateController();
  controller.generateImage.bind(controller)(req, res);
});

export default router;