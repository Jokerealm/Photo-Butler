import { Router } from 'express';
import multer from 'multer';
import { taskController } from '../controllers/taskController';
import { handleMulterError } from '../middleware/errorHandler';

const router = Router();

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// POST /api/tasks - 创建新任务
router.post('/', 
  upload.single('imageFile'),
  handleMulterError,
  taskController.createTask.bind(taskController)
);

// GET /api/tasks - 获取任务列表
router.get('/', 
  taskController.getTasks.bind(taskController)
);

// GET /api/tasks/:id - 根据ID获取任务
router.get('/:id', 
  taskController.getTaskById.bind(taskController)
);

// DELETE /api/tasks/:id - 删除任务
router.delete('/:id', 
  taskController.deleteTask.bind(taskController)
);

export default router;