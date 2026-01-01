import { Router } from 'express';
import { templateController } from '../controllers/templateController';
import { 
  validateTemplateQuery, 
  handleValidationErrors 
} from '../middleware/security';

/**
 * Template routes
 * 模板路由
 */
const router = Router();

// GET /api/templates - 获取模板列表 with security checks
router.get('/', 
  validateTemplateQuery,     // Validate query parameters
  handleValidationErrors,    // Handle validation errors
  templateController.getTemplates.bind(templateController)
);

// GET /api/templates/:id - 根据ID获取模板 with security checks
router.get('/:id', 
  templateController.getTemplateById.bind(templateController)
);

export default router;