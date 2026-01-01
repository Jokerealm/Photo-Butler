import { Router } from 'express';
import { maintenanceController } from '../controllers/maintenanceController';

const router = Router();

/**
 * Maintenance routes for system monitoring and cleanup
 */

// GET /api/maintenance/stats - Get storage statistics
router.get('/stats', maintenanceController.getStorageStats);

// POST /api/maintenance/cleanup - Force cleanup of old files
router.post('/cleanup', maintenanceController.forceCleanup);

// GET /api/maintenance/health - Health check endpoint
router.get('/health', maintenanceController.healthCheck);

export default router;