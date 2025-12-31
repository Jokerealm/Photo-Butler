import express from 'express';
import cors from 'cors';
import path from 'path';
import uploadRoutes from './routes/uploadRoutes';

// Create test app
const app = express();
const port = 3002; // Use different port for testing

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded images
const uploadDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/upload', uploadRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Upload test server is running',
    uploadEndpoint: '/api/upload',
    staticFiles: '/uploads'
  });
});

// Start test server
app.listen(port, () => {
  console.log(`🧪 [test-server]: Upload test server is running at http://localhost:${port}`);
  console.log(`📁 Upload endpoint: http://localhost:${port}/api/upload`);
  console.log(`🖼️  Static files: http://localhost:${port}/uploads`);
  console.log(`✅ Test endpoint: http://localhost:${port}/test`);
});

export default app;