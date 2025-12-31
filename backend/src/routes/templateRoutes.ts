import { Router } from 'express';
import { templateController } from '../controllers/templateController';

/**
 * Template routes
 * 模板路由
 */
const router = Router();

// GET /api/templates - 获取模板列表
router.get('/', templateController.getTemplates.bind(templateController));

// GET /api/templates/:id - 根据ID获取模板
router.get('/:id', templateController.getTemplateById.bind(templateController));

export default router;