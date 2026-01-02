# Photo Butler

🎨 **基于豆包API的智能AI图片生成应用**

Photo Butler是一个现代化的AI图片生成Web应用，让用户能够轻松上传参考图片，选择精美的艺术风格模板，并通过AI技术生成高质量的艺术作品。

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.7+-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-15+-black.svg)

## ✨ 核心功能

### 🖼️ 智能图片处理
- **多格式支持**: JPG、PNG格式，最大支持10MB文件
- **智能压缩**: 自动优化图片大小，提升处理速度
- **预览功能**: 实时预览上传的参考图片

### 🎭 丰富的艺术模板
- **18+精选模板**: 包含古典旗袍、星河听梦、沙漠星空等多种风格
- **中文命名**: 直观的中文模板名称，易于理解和选择
- **风格多样**: 涵盖人像、风景、抽象等多种艺术类型

### ✏️ 智能提示词系统
- **模板提示词**: 每个模板都有精心设计的提示词
- **自由编辑**: 支持用户自定义和调整生成提示词
- **实时预览**: 提示词修改后即时显示效果

### 🤖 AI图片生成
- **豆包API集成**: 基于字节跳动豆包API的高质量图片生成
- **实时进度**: WebSocket实时显示生成进度
- **批量生成**: 支持多张图片连续生成

### 📱 现代化用户体验
- **响应式设计**: 完美适配桌面、平板和移动设备
- **任务管理**: 智能任务队列，支持查看生成历史
- **一键下载**: 快速下载生成的高清图片
- **本地存储**: 自动保存生成历史，支持离线查看

## 🏗️ 技术架构

### 前端技术栈
- **Next.js 15+** - 现代React全栈框架
- **React 18+** - 组件化用户界面
- **TypeScript** - 类型安全的开发体验
- **Tailwind CSS** - 实用优先的样式框架
- **Zustand** - 轻量级状态管理
- **Axios** - HTTP客户端

### 后端技术栈
- **Node.js 18+** - 高性能JavaScript运行时
- **Express.js** - 轻量级Web框架
- **TypeScript** - 类型安全的后端开发
- **SQLite3** - 轻量级数据库
- **Sharp** - 高性能图片处理
- **WebSocket** - 实时通信
- **Multer** - 文件上传处理

### 开发工具
- **Jest** - 单元测试框架
- **Playwright** - 端到端测试
- **ESLint** - 代码质量检查
- **Helmet** - 安全中间件

## 🚀 快速开始

### 环境要求

确保您的开发环境满足以下要求：

- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Git**: 用于版本控制

### 1. 克隆项目

```bash
git clone https://github.com/Jokerealm/Photo-Butler.git
cd Photo-Butler
```

### 2. 安装依赖

```bash
# 安装根目录依赖（用于E2E测试）
npm install

# 安装后端依赖
cd backend
npm install
cd ..

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 3. 环境配置

#### 后端环境配置

复制环境变量模板并配置：

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env` 文件，配置必要的环境变量：

```env
# 豆包API配置（必需）
DOUBAO_API_KEY=your_doubao_api_key_here

# 服务器配置
PORT=3001
NODE_ENV=development

# 文件上传配置
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# 数据库配置
DB_PATH=data/photo-butler.db
```

#### 前端环境配置

```bash
cp frontend/.env.example frontend/.env.local
```

编辑 `frontend/.env.local` 文件：

```env
# API服务器地址
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 4. 获取豆包API密钥

1. 访问 [豆包API官网](https://www.volcengine.com/product/doubao)
2. 注册并创建应用
3. 获取API密钥
4. 将密钥配置到 `backend/.env` 文件中

### 5. 启动应用

#### 方式一：使用启动脚本（推荐）

```bash
# Windows用户
start-dev.bat

# Linux/Mac用户
./scripts/dev.sh
```

#### 方式二：手动启动

```bash
# 终端1: 启动后端服务
cd backend
npm run dev

# 终端2: 启动前端服务
cd frontend
npm run dev
```

### 6. 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001/api/docs

## 📖 使用指南

### 基本使用流程

1. **上传参考图片**
   - 点击上传区域或拖拽图片文件
   - 支持JPG、PNG格式，最大10MB
   - 系统会自动压缩和优化图片

2. **选择艺术模板**
   - 浏览18+精选艺术模板
   - 每个模板都有独特的艺术风格
   - 点击模板查看详细信息和示例

3. **编辑提示词**
   - 查看模板的默认提示词
   - 根据需要自定义修改提示词
   - 提示词将影响最终生成效果

4. **生成AI图片**
   - 点击"生成图片"按钮
   - 实时查看生成进度
   - 等待AI处理完成

5. **下载和管理**
   - 预览生成的图片
   - 一键下载高清图片
   - 在历史记录中管理所有作品

### 高级功能

#### 任务管理
- 查看所有生成任务的状态
- 支持任务队列和批量处理
- 自动保存生成历史

#### 模板系统
- 支持自定义模板上传
- 模板分类和标签管理
- 模板评分和推荐

#### 工作空间
- 个人作品集管理
- 项目分组和整理
- 作品分享和导出

## 🛠️ 开发指南

### 项目结构

```
Photo-Butler/
├── frontend/                    # Next.js前端应用
│   ├── app/                    # App Router页面
│   ├── components/             # React组件
│   │   ├── promptTemplate/     # 模板相关组件
│   │   └── ...                # 其他UI组件
│   ├── services/               # API服务
│   ├── stores/                 # 状态管理
│   ├── types/                  # TypeScript类型
│   └── utils/                  # 工具函数
├── backend/                     # Express后端服务
│   ├── src/
│   │   ├── controllers/        # API控制器
│   │   ├── services/           # 业务逻辑
│   │   ├── middleware/         # 中间件
│   │   ├── routes/             # 路由定义
│   │   └── types/              # 类型定义
│   ├── data/                   # 数据库文件
│   └── uploads/                # 文件上传目录
├── tests/                       # E2E测试
├── docs/                        # 项目文档
├── image/                       # 模板预览图
├── prompt/                      # 模板提示词
├── scripts/                     # 构建和部署脚本
└── .github/                     # GitHub Actions
```

### 添加新模板

1. **准备模板图片**
   ```bash
   # 将预览图添加到image目录
   cp your-template.png image/新模板名称.png
   ```

2. **配置提示词**
   ```bash
   # 编辑prompt/prompt.txt文件
   echo "新模板名称: your custom prompt here" >> prompt/prompt.txt
   ```

3. **重启服务**
   ```bash
   # 重启后端服务以加载新模板
   cd backend && npm run dev
   ```

### 运行测试

```bash
# 后端单元测试
cd backend
npm test

# 前端单元测试
cd frontend
npm test

# E2E测试
npm run test:e2e

# 测试覆盖率
cd backend && npm run test:coverage
cd frontend && npm run test:coverage
```

### 代码质量检查

```bash
# 后端代码检查
cd backend && npm run lint

# 前端代码检查
cd frontend && npm run lint

# 自动修复代码格式
cd backend && npm run lint -- --fix
cd frontend && npm run lint -- --fix
```

### 构建生产版本

```bash
# 构建后端
cd backend && npm run build

# 构建前端
cd frontend && npm run build

# 启动生产服务
cd backend && npm start
cd frontend && npm start
```

## 📚 API文档

### 核心API端点

#### 文件上传
```http
POST /api/upload
Content-Type: multipart/form-data

# 上传参考图片，返回文件ID
```

#### 模板管理
```http
GET /api/templates
# 获取所有可用模板列表

GET /api/templates/:id
# 获取特定模板详情
```

#### 图片生成
```http
POST /api/generate
Content-Type: application/json

{
  "imageId": "uploaded-image-id",
  "templateId": "template-id",
  "prompt": "custom prompt text"
}
```

#### 任务管理
```http
GET /api/tasks
# 获取用户任务列表

GET /api/tasks/:id
# 获取特定任务状态

DELETE /api/tasks/:id
# 删除任务
```

#### 文件下载
```http
GET /api/download/:imageId
# 下载生成的图片文件
```

### WebSocket事件

```javascript
// 连接WebSocket
const ws = new WebSocket('ws://localhost:3001');

// 监听生成进度
ws.on('generation-progress', (data) => {
  console.log(`进度: ${data.progress}%`);
});

// 监听生成完成
ws.on('generation-complete', (data) => {
  console.log('生成完成:', data.imageUrl);
});
```

## 🚀 部署指南

### 开发环境

使用提供的脚本快速启动开发环境：

```bash
# Windows
start-dev.bat

# Linux/Mac
./scripts/dev.sh
```

### 生产环境部署

#### Docker部署（推荐）

```bash
# 构建Docker镜像
docker build -t photo-butler .

# 运行容器
docker run -p 3000:3000 -p 3001:3001 photo-butler
```

#### 传统部署

```bash
# 1. 构建应用
npm run build

# 2. 配置生产环境变量
cp backend/.env.example backend/.env.production

# 3. 启动服务
cd backend && npm start
cd frontend && npm start
```

#### Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket支持
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🔧 故障排除

### 常见问题

#### Q: 图片生成失败，显示API错误
**A**: 检查以下配置：
- 确认豆包API密钥正确配置
- 检查网络连接是否正常
- 验证API配额是否充足

```bash
# 检查API配置
cd backend && npm run test -- --grep "API"
```

#### Q: 文件上传失败
**A**: 可能的原因：
- 文件格式不支持（仅支持JPG/PNG）
- 文件大小超过10MB限制
- 磁盘空间不足

```bash
# 检查上传目录权限
ls -la backend/uploads/
```

#### Q: 前端无法连接后端
**A**: 检查配置：
- 确认后端服务正在运行（端口3001）
- 检查防火墙设置
- 验证环境变量配置

```bash
# 检查端口占用
netstat -an | grep 3001
```

#### Q: WebSocket连接失败
**A**: 可能的解决方案：
- 检查WebSocket URL配置
- 确认代理服务器支持WebSocket
- 验证防火墙设置

### 性能优化

#### 图片处理优化
```javascript
// 调整图片压缩质量
const optimizedImage = await sharp(inputBuffer)
  .jpeg({ quality: 80 })
  .png({ compressionLevel: 6 })
  .toBuffer();
```

#### 数据库优化
```sql
-- 创建索引提升查询性能
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

### 开发流程

1. **Fork项目**
   ```bash
   # 在GitHub上Fork项目
   git clone https://github.com/your-username/Photo-Butler.git
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **开发和测试**
   ```bash
   # 编写代码
   # 运行测试
   npm test
   ```

4. **提交更改**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

5. **推送分支**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **创建Pull Request**

### 代码规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint配置的代码风格
- 编写单元测试覆盖新功能
- 更新相关文档

### 提交信息规范

```
type(scope): description

# 类型：
# feat: 新功能
# fix: 修复bug
# docs: 文档更新
# style: 代码格式调整
# refactor: 代码重构
# test: 测试相关
# chore: 构建过程或辅助工具的变动

# 示例：
feat(api): add image generation progress tracking
fix(ui): resolve template selection issue
docs(readme): update installation guide
```

## 📄 许可证

本项目采用 [ISC许可证](LICENSE)。

## 🙏 致谢

感谢以下开源项目和服务：

- **[豆包API](https://www.volcengine.com/product/doubao)** - 提供强大的AI图片生成能力
- **[Next.js](https://nextjs.org/)** - 现代化的React框架
- **[Tailwind CSS](https://tailwindcss.com/)** - 实用优先的CSS框架
- **[Sharp](https://sharp.pixelplumbing.com/)** - 高性能图片处理库
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的JavaScript

## 📞 联系我们

- **GitHub Issues**: [提交问题和建议](https://github.com/Jokerealm/Photo-Butler/issues)
- **项目主页**: https://github.com/Jokerealm/Photo-Butler

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！