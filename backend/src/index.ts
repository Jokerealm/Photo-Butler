import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import templateRoutes from './routes/templateRoutes';
import uploadRoutes from './routes/uploadRoutes';
import generateRoutes from './routes/generateRoutes';
import downloadRoutes from './routes/downloadRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import { cleanupService } from './services/cleanupService';
import storageRoutes from './routes/storageRoutes';
import taskRoutes from './routes/taskRoutes';
import { databaseService } from './services/databaseService';
import { websocketService } from './services/websocketService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { 
  helmetConfig, 
  corsConfig, 
  generalRateLimit, 
  sanitizeInput, 
  requestLogger,
  validateEnvironmentVariables 
} from './middleware/security';
import { logger } from './utils/logger';

dotenv.config();

// Validate environment variables before starting the server
validateEnvironmentVariables();

const app: Express = express();
const server = createServer(app);
const port = process.env.PORT || 3001;

// Security middleware (must be first)
app.use(helmetConfig);
app.use(cors(corsConfig));
app.use(generalRateLimit);
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '1mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Limit URL-encoded payload size

// Input sanitization
app.use(sanitizeInput);

// Static file serving for template images
const imageDir = path.join(process.cwd(), '..', 'image');
app.use('/image', express.static(imageDir));
app.use('/images', express.static(imageDir)); // 添加 /images 路径支持

// Static file serving for uploaded images (with subdirectories)
const uploadDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Static file serving for downloads
const downloadDir = path.join(process.cwd(), '..', 'downloads');
app.use('/downloads', express.static(downloadDir));

// API Routes
app.use('/api/templates', templateRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/storage', storageRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Photo Butler API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      templates: '/api/templates',
      tasks: '/api/tasks',
      upload: '/api/upload',
      generate: '/api/generate',
      download: '/api/download',
      maintenance: '/api/maintenance'
    }
  });
});

// Health check route
app.get('/health', async (_req: Request, res: Response) => {
  const dbHealth = await databaseService.healthCheck();
  res.json({ 
    status: 'ok', 
    message: 'Photo Butler API is running',
    database: {
      available: databaseService.isAvailable(),
      healthy: dbHealth
    }
  });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize database (non-blocking)
async function initializeApp() {
  logger.info('Initializing Photo Butler API...');
  
  // Initialize database (this should not block the application)
  try {
    await databaseService.initialize();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed, continuing without database:', error);
  }
  
  // Initialize WebSocket service
  websocketService.initialize(server);
  
  // Start server
  server.listen(port, () => {
    logger.info(`⚡️[server]: Server is running at http://localhost:${port}`);
    logger.info(`WebSocket server is running at ws://localhost:${port}/ws`);
    logger.info(`Database status: ${databaseService.isAvailable() ? 'Available' : 'Not available (using localStorage only)'}`);
    
    // 启动清理服务
    cleanupService.start();
  });
}

// Initialize the application
initializeApp().catch((error) => {
  logger.error('Failed to initialize application:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Graceful shutdown...');
  websocketService.close();
  await databaseService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Graceful shutdown...');
  websocketService.close();
  await databaseService.close();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise: promise.toString() });
  process.exit(1);
});

export default app;
