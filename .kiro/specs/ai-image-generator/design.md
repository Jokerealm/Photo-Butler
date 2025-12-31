# 设计文档

## 概述

本系统是一个基于Next.js和Node.js的全栈Web应用，集成豆包AI图片生成API。系统采用前后端分离架构，前端使用React构建用户界面，后端使用Express处理API请求和业务逻辑。用户可以上传参考图片，选择艺术风格模板，编辑提示词，生成AI艺术图片，并管理生成历史。

## 架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器客户端                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Next.js 前端应用 (React)                │   │
│  │  - 图片上传组件                                    │   │
│  │  - 模板选择组件                                    │   │
│  │  - 提示词编辑器                                    │   │
│  │  - 图片展示组件                                    │   │
│  │  - 历史记录组件                                    │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                               │
│                  localStorage (历史记录)                  │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                   Node.js 后端服务器                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Express API 服务                      │   │
│  │  - /api/upload (图片上传)                          │   │
│  │  - /api/templates (模板列表)                       │   │
│  │  - /api/generate (图片生成)                        │   │
│  │  - /api/download (图片下载)                        │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │            业务逻辑层                               │   │
│  │  - 图片处理服务                                    │   │
│  │  - 模板管理服务                                    │   │
│  │  - API集成服务                                     │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │         数据访问层 (预留)                           │   │
│  │  - SQLite 数据库                                   │   │
│  │  - 用户表 (预留)                                   │   │
│  │  - 订单表 (预留)                                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌─────────────────────────────────────────────────────────┐
│                    豆包 API 服务                          │
│              (图片生成服务)                               │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

**前端：**
- Next.js 14+ (React 18+)
- TypeScript
- Tailwind CSS (样式)
- Axios (HTTP客户端)
- React Hook Form (表单管理)

**后端：**
- Node.js 18+
- Express.js
- TypeScript
- Multer (文件上传)
- Axios (API调用)
- SQLite3 (数据库，预留)

**开发工具：**
- ESLint (代码检查)
- Prettier (代码格式化)

## 组件和接口

### 前端组件

#### 1. ImageUploader 组件
**职责：** 处理用户图片上传

**Props：**
```typescript
interface ImageUploaderProps {
  onImageUpload: (file: File, previewUrl: string) => void;
  acceptedFormats: string[];
}
```

**状态：**
- `isDragging`: boolean - 拖拽状态
- `previewUrl`: string | null - 预览图URL
- `error`: string | null - 错误信息

**方法：**
- `handleFileSelect(event)` - 处理文件选择
- `handleDrop(event)` - 处理拖放上传
- `validateFile(file)` - 验证文件格式和大小

#### 2. TemplateGallery 组件
**职责：** 显示和管理模板选择

**Props：**
```typescript
interface TemplateGalleryProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template) => void;
}

interface Template {
  id: string;
  name: string;
  previewUrl: string;
  prompt: string;
}
```

**状态：**
- `templates`: Template[] - 模板列表
- `selectedId`: string | null - 选中的模板ID

#### 3. PromptEditor 组件
**职责：** 提示词编辑和管理

**Props：**
```typescript
interface PromptEditorProps {
  initialPrompt: string;
  onPromptChange: (prompt: string) => void;
  disabled: boolean;
}
```

**状态：**
- `prompt`: string - 当前提示词
- `charCount`: number - 字符计数

**方法：**
- `handleChange(event)` - 处理文本变化
- `resetPrompt()` - 重置为初始提示词

#### 4. ImageGenerator 组件
**职责：** 协调图片生成流程

**Props：**
```typescript
interface ImageGeneratorProps {
  referenceImage: File | null;
  prompt: string;
  onGenerationComplete: (result: GenerationResult) => void;
}

interface GenerationResult {
  imageUrl: string;
  timestamp: number;
  template: string;
  prompt: string;
}
```

**状态：**
- `isGenerating`: boolean - 生成状态
- `progress`: number - 进度百分比
- `generatedImage`: string | null - 生成的图片URL
- `error`: string | null - 错误信息

**方法：**
- `handleGenerate()` - 触发生成
- `cancelGeneration()` - 取消生成

#### 5. HistoryViewer 组件
**职责：** 显示生成历史记录

**Props：**
```typescript
interface HistoryViewerProps {
  history: HistoryItem[];
  onItemClick: (item: HistoryItem) => void;
}

interface HistoryItem {
  id: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  template: string;
  prompt: string;
  timestamp: number;
}
```

**状态：**
- `history`: HistoryItem[] - 历史记录列表
- `selectedItem`: HistoryItem | null - 选中的记录

**方法：**
- `loadHistory()` - 从localStorage加载历史
- `clearHistory()` - 清空历史记录

### 后端API接口

#### 1. POST /api/upload
**描述：** 上传参考图片

**请求：**
```typescript
Content-Type: multipart/form-data
Body: {
  image: File
}
```

**响应：**
```typescript
{
  success: boolean;
  data: {
    imageId: string;
    imageUrl: string;
  };
  error?: string;
}
```

#### 2. GET /api/templates
**描述：** 获取模板列表

**响应：**
```typescript
{
  success: boolean;
  data: {
    templates: Array<{
      id: string;
      name: string;
      previewUrl: string;
      prompt: string;
    }>;
  };
  error?: string;
}
```

#### 3. POST /api/generate
**描述：** 生成AI图片

**请求：**
```typescript
{
  imageId: string;
  prompt: string;
  templateId: string;
}
```

**响应：**
```typescript
{
  success: boolean;
  data: {
    generatedImageUrl: string;
    generationId: string;
  };
  error?: string;
}
```

#### 4. GET /api/download/:imageId
**描述：** 下载生成的图片

**响应：**
```
Content-Type: image/jpeg 或 image/png
Body: 图片二进制数据
```

### 豆包API集成

#### API调用封装

```typescript
class DoubaoAPIClient {
  private apiKey: string;
  private baseUrl: string;
  
  async generateImage(params: {
    referenceImage: Buffer;
    prompt: string;
  }): Promise<GeneratedImage>;
  
  async checkStatus(taskId: string): Promise<TaskStatus>;
}

interface GeneratedImage {
  imageUrl: string;
  taskId: string;
}

interface TaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: string;
  error?: string;
}
```

## 数据模型

### 前端数据模型

#### Template (模板)
```typescript
interface Template {
  id: string;              // 唯一标识符
  name: string;            // 模板名称
  previewUrl: string;      // 预览图URL
  prompt: string;          // 提示词内容
  category?: string;       // 分类（预留）
}
```

#### HistoryItem (历史记录)
```typescript
interface HistoryItem {
  id: string;                    // 唯一标识符
  originalImageUrl: string;      // 原图URL
  generatedImageUrl: string;     // 生成图URL
  template: string;              // 使用的模板名称
  prompt: string;                // 使用的提示词
  timestamp: number;             // 生成时间戳
}
```

#### GenerationRequest (生成请求)
```typescript
interface GenerationRequest {
  referenceImage: File;     // 参考图片文件
  prompt: string;           // 提示词
  templateId: string;       // 模板ID
}
```

### 后端数据模型

#### UploadedImage (上传图片)
```typescript
interface UploadedImage {
  id: string;              // 图片ID
  filename: string;        // 文件名
  path: string;            // 存储路径
  mimetype: string;        // MIME类型
  size: number;            // 文件大小
  uploadedAt: Date;        // 上传时间
}
```

### 数据库模型（预留）

#### User (用户表)
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Order (订单表)
```sql
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 正确性属性分析前置工作

现在让我分析每个验收标准的可测试性：


## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1：有效图片格式接受
*对于任何* JPG或PNG格式的图片文件，系统应当接受该文件并显示预览
**验证：需求 1.3**

### 属性 2：无效图片格式拒绝
*对于任何* 非JPG或PNG格式的文件，系统应当拒绝该文件并显示错误提示
**验证：需求 1.4**

### 属性 3：上传成功显示预览
*对于任何* 成功上传的有效图片，系统应当在上传区域显示缩略图预览
**验证：需求 1.5**

### 属性 4：模板显示完整性
*对于任何* 显示的模板，系统应当同时展示模板名称和预览图
**验证：需求 2.3**

### 属性 5：模板选择高亮
*对于任何* 被用户点击的模板，系统应当高亮显示该模板并标记为已选中
**验证：需求 2.4**

### 属性 6：模板提示词加载
*对于任何* 被选中的模板，系统应当将该模板对应的提示词正确加载到提示词编辑区域
**验证：需求 2.5, 3.1**

### 属性 7：提示词可编辑性
*对于任何* 显示在输入框中的提示词，系统应当允许用户自由编辑文本内容
**验证：需求 3.2**

### 属性 8：提示词实时保存
*对于任何* 用户对提示词的编辑操作，系统应当实时保存修改到应用状态中
**验证：需求 3.3**

### 属性 9：非空提示词启用生成
*对于任何* 包含有效文本的提示词输入框，系统应当启用图片生成按钮
**验证：需求 3.5**

### 属性 10：API调用参数完整性
*对于任何* 图片生成请求，系统应当调用豆包API并传入参考图片和提示词
**验证：需求 4.1, 8.2**

### 属性 11：API调用加载状态
*对于任何* API调用期间，系统应当显示加载状态指示器
**验证：需求 4.2**

### 属性 12：API成功响应处理
*对于任何* API返回的成功响应，系统应当在结果区域显示生成的图片
**验证：需求 4.3, 8.3**

### 属性 13：API失败响应处理
*对于任何* API调用失败，系统应当显示错误信息并允许用户重试
**验证：需求 4.4, 8.5**

### 属性 14：生成记录持久化
*对于任何* 成功的图片生成，系统应当将生成记录保存到浏览器本地存储
**验证：需求 4.5**

### 属性 15：下载按钮显示
*对于任何* 成功生成的图片，系统应当在生成图片下方显示下载按钮
**验证：需求 5.1**

### 属性 16：下载功能触发
*对于任何* 用户点击下载按钮的操作，系统应当触发浏览器下载功能
**验证：需求 5.2**

### 属性 17：下载文件命名
*对于任何* 图片下载，系统应当使用有意义的文件名（包含时间戳和模板名称）
**验证：需求 5.3**

### 属性 18：下载后状态不变性
*对于任何* 完成的下载操作，系统应当保持当前页面状态不变
**验证：需求 5.4**

### 属性 19：历史记录完整性
*对于任何* 显示的历史记录项，系统应当展示原图缩略图、生成图缩略图、模板名称、提示词和生成时间
**验证：需求 6.2**

### 属性 20：历史记录时间排序
*对于任何* 历史记录列表，系统应当将最新的记录显示在最前面（按时间戳倒序）
**验证：需求 6.4**

### 属性 21：历史记录点击展示
*对于任何* 用户点击的历史记录项，系统应当显示该图片的完整视图
**验证：需求 6.5**

### 属性 22：模板文件名解析
*对于任何* 添加到image文件夹的模板预览图，系统应当使用文件名（去除扩展名）作为模板名称
**验证：需求 7.1, 7.2**

### 属性 23：模板配置加载
*对于任何* 模板，系统应当从prompt.txt文件中加载对应序号的提示词
**验证：需求 7.3**

### 属性 24：模板列表动态更新
*对于任何* 模板数量的变化，系统应当在下次加载时自动更新模板列表
**验证：需求 7.4**

### 属性 25：响应式布局调整
*对于任何* 屏幕尺寸的改变，系统应当自动调整布局和元素大小
**验证：需求 9.3**

## 错误处理

### 前端错误处理

#### 1. 文件上传错误
- **错误类型：** 文件格式不支持
- **处理方式：** 显示Toast提示"仅支持JPG和PNG格式"
- **用户操作：** 允许重新选择文件

- **错误类型：** 文件大小超限（>10MB）
- **处理方式：** 显示Toast提示"文件大小不能超过10MB"
- **用户操作：** 允许重新选择文件

#### 2. API调用错误
- **错误类型：** 网络连接失败
- **处理方式：** 显示错误提示"网络连接失败，请检查网络"
- **用户操作：** 提供"重试"按钮

- **错误类型：** API超时（>30秒）
- **处理方式：** 显示错误提示"请求超时，请稍后重试"
- **用户操作：** 提供"重试"按钮

- **错误类型：** API返回错误（4xx, 5xx）
- **处理方式：** 显示错误提示"生成失败：{错误信息}"
- **用户操作：** 提供"重试"按钮

#### 3. 本地存储错误
- **错误类型：** localStorage已满
- **处理方式：** 显示提示"存储空间已满，请清理历史记录"
- **用户操作：** 提供"清理历史"按钮

- **错误类型：** localStorage不可用
- **处理方式：** 显示警告"浏览器不支持历史记录功能"
- **用户操作：** 功能降级，不保存历史

### 后端错误处理

#### 1. 文件上传错误
```typescript
try {
  // 文件上传逻辑
} catch (error) {
  if (error instanceof MulterError) {
    return res.status(400).json({
      success: false,
      error: '文件上传失败：' + error.message
    });
  }
}
```

#### 2. 豆包API错误
```typescript
try {
  const result = await doubaoClient.generateImage(params);
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    return res.status(504).json({
      success: false,
      error: 'API请求超时'
    });
  }
  if (error.response?.status === 401) {
    return res.status(500).json({
      success: false,
      error: 'API认证失败'
    });
  }
  return res.status(500).json({
    success: false,
    error: '图片生成失败'
  });
}
```

#### 3. 数据库错误（预留）
```typescript
try {
  await db.query(sql, params);
} catch (error) {
  logger.error('Database error:', error);
  return res.status(500).json({
    success: false,
    error: '数据库操作失败'
  });
}
```

### 错误日志

所有错误应当记录到日志系统：

```typescript
interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
}
```

## 测试策略

### 单元测试

#### 前端组件测试
使用 **Jest** 和 **React Testing Library** 进行组件测试：

**ImageUploader 组件测试：**
- 测试文件选择功能
- 测试拖放上传功能
- 测试文件格式验证
- 测试预览显示

**TemplateGallery 组件测试：**
- 测试模板列表渲染
- 测试模板选择交互
- 测试空状态显示

**PromptEditor 组件测试：**
- 测试文本编辑功能
- 测试字符计数
- 测试提示词重置

**HistoryViewer 组件测试：**
- 测试历史记录加载
- 测试空状态显示
- 测试记录排序

#### 后端API测试
使用 **Jest** 和 **Supertest** 进行API测试：

**上传接口测试：**
- 测试有效文件上传
- 测试无效格式拒绝
- 测试文件大小限制

**模板接口测试：**
- 测试模板列表获取
- 测试模板数据完整性

**生成接口测试：**
- 测试生成请求处理
- 测试参数验证
- 测试错误响应

#### 工具函数测试
- 测试文件名解析函数
- 测试图片处理函数
- 测试数据验证函数

### 属性测试

使用 **fast-check** 库进行属性测试：

#### 属性测试 1：文件格式验证
```typescript
// 验证属性 1 和 2
fc.assert(
  fc.property(
    fc.oneof(
      fc.constant('image/jpeg'),
      fc.constant('image/png'),
      fc.string()
    ),
    (mimetype) => {
      const isValid = ['image/jpeg', 'image/png'].includes(mimetype);
      const result = validateFileFormat(mimetype);
      return result === isValid;
    }
  ),
  { numRuns: 100 }
);
```
**验证：属性 1, 2**

#### 属性测试 2：模板提示词加载
```typescript
// 验证属性 6
fc.assert(
  fc.property(
    fc.record({
      id: fc.string(),
      name: fc.string(),
      prompt: fc.string()
    }),
    (template) => {
      const loadedPrompt = loadTemplatePrompt(template);
      return loadedPrompt === template.prompt;
    }
  ),
  { numRuns: 100 }
);
```
**验证：属性 6**

#### 属性测试 3：历史记录排序
```typescript
// 验证属性 20
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        id: fc.string(),
        timestamp: fc.integer()
      })
    ),
    (historyItems) => {
      const sorted = sortHistoryByTime(historyItems);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].timestamp < sorted[i + 1].timestamp) {
          return false;
        }
      }
      return true;
    }
  ),
  { numRuns: 100 }
);
```
**验证：属性 20**

#### 属性测试 4：文件名解析
```typescript
// 验证属性 22
fc.assert(
  fc.property(
    fc.string().filter(s => s.length > 0),
    fc.constantFrom('.jpg', '.png'),
    (name, ext) => {
      const filename = name + ext;
      const parsed = parseTemplateName(filename);
      return parsed === name;
    }
  ),
  { numRuns: 100 }
);
```
**验证：属性 22**

#### 属性测试 5：下载文件命名
```typescript
// 验证属性 17
fc.assert(
  fc.property(
    fc.string(),
    fc.integer({ min: 0 }),
    (templateName, timestamp) => {
      const filename = generateDownloadFilename(templateName, timestamp);
      return filename.includes(templateName) && 
             filename.includes(timestamp.toString());
    }
  ),
  { numRuns: 100 }
);
```
**验证：属性 17**

#### 属性测试 6：历史记录完整性
```typescript
// 验证属性 19
fc.assert(
  fc.property(
    fc.record({
      originalImageUrl: fc.string(),
      generatedImageUrl: fc.string(),
      template: fc.string(),
      prompt: fc.string(),
      timestamp: fc.integer()
    }),
    (historyItem) => {
      const rendered = renderHistoryItem(historyItem);
      return rendered.includes(historyItem.originalImageUrl) &&
             rendered.includes(historyItem.generatedImageUrl) &&
             rendered.includes(historyItem.template) &&
             rendered.includes(historyItem.prompt) &&
             rendered.includes(historyItem.timestamp.toString());
    }
  ),
  { numRuns: 100 }
);
```
**验证：属性 19**

### 集成测试

#### 端到端流程测试
使用 **Playwright** 进行E2E测试：

**完整生成流程：**
1. 上传参考图片
2. 选择模板
3. 编辑提示词
4. 生成图片
5. 下载图片
6. 查看历史记录

**错误处理流程：**
1. 上传无效文件格式
2. API调用失败重试
3. 网络断开恢复

### 测试配置

**Jest 配置 (jest.config.js)：**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ]
};
```

**属性测试配置：**
- 每个属性测试运行至少100次迭代
- 使用随机种子以确保可重现性
- 失败时自动缩小反例

## 性能考虑

### 前端性能优化

1. **图片优化**
   - 上传前压缩大图片
   - 使用缩略图显示历史记录
   - 懒加载模板预览图

2. **状态管理**
   - 使用React Context避免prop drilling
   - 使用useMemo缓存计算结果
   - 使用useCallback避免不必要的重渲染

3. **代码分割**
   - 使用Next.js动态导入
   - 按路由分割代码
   - 懒加载非关键组件

### 后端性能优化

1. **文件处理**
   - 限制上传文件大小（10MB）
   - 使用流式处理大文件
   - 定期清理临时文件

2. **API调用**
   - 实现请求超时机制（30秒）
   - 使用连接池管理HTTP连接
   - 实现请求重试机制

3. **缓存策略**
   - 缓存模板列表（内存缓存）
   - 缓存静态资源（CDN）
   - 使用HTTP缓存头

## 安全考虑

### 前端安全

1. **输入验证**
   - 验证文件类型和大小
   - 清理用户输入的提示词
   - 防止XSS攻击

2. **数据保护**
   - 不在localStorage存储敏感信息
   - 使用HTTPS传输数据

### 后端安全

1. **API安全**
   - 验证所有输入参数
   - 使用环境变量存储API密钥
   - 实现速率限制（预留）

2. **文件安全**
   - 验证文件MIME类型
   - 限制文件大小
   - 使用安全的文件名
   - 隔离上传文件存储

3. **错误处理**
   - 不暴露敏感错误信息
   - 记录详细错误日志
   - 返回通用错误消息

## 部署架构

### 开发环境
```
localhost:3000 (Next.js Dev Server)
  ↓
localhost:3001 (Express API Server)
  ↓
豆包API
```

### 生产环境（预留）
```
用户浏览器
  ↓ HTTPS
CDN (静态资源)
  ↓
负载均衡器
  ↓
Next.js应用服务器 (多实例)
  ↓
Express API服务器 (多实例)
  ↓
SQLite数据库 / 云存储
  ↓
豆包API
```

## 未来扩展

### 第一阶段（当前）
- 基础图片生成功能
- 模板选择和提示词编辑
- 历史记录（本地存储）
- 图片下载

### 第二阶段（预留）
- 用户注册和登录
- 用户配额管理
- 历史记录云端同步
- 模板分类和搜索

### 第三阶段（预留）
- 付费功能
- 高级模板
- 批量生成
- 社区分享功能
