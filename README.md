# Photo Butler

基于豆包API的AI图片生成网页应用。用户可以上传参考图片，选择预设的风格模板，编辑提示词，然后生成具有特定艺术风格的图片。

## 功能特性

- 图片上传：支持JPG/PNG格式，最大10MB
- 模板选择：多种预设艺术风格模板
- 提示词编辑：自由编辑和调整生成提示词
- AI生成：基于豆包API的高质量图片生成
- 历史记录：本地存储生成历史，支持查看和管理
- 响应式设计：完美适配桌面和移动设备
- 图片下载：一键下载生成的图片

## 项目结构

```
photo-butler/
├── frontend/                    # Next.js前端应用
│   ├── app/                    # Next.js App Router
│   ├── components/             # React组件
│   └── package.json
├── backend/                     # Express后端服务器
│   ├── src/
│   │   ├── controllers/        # API控制器
│   │   ├── services/           # 业务逻辑服务
│   │   ├── middleware/         # 中间件
│   │   └── types/              # TypeScript类型定义
│   └── package.json
├── tests/                       # 端到端测试
├── docs/                        # 项目文档
├── image/                       # 模板预览图
├── prompt/                      # 模板提示词配置
├── scripts/                     # 启动和构建脚本
├── uploads/                     # 文件上传目录
├── .github/                     # GitHub Actions配置
├── README.md                    # 项目说明
├── CHANGELOG.md                 # 更新日志
├── CONTRIBUTING.md              # 贡献指南
├── LICENSE                      # 许可证
└── package.json                 # 项目配置
```

## 技术栈

### 前端
- Next.js 15+ - React全栈框架
- React 18+ - 用户界面库
- TypeScript - 类型安全的JavaScript
- Tailwind CSS - 实用优先的CSS框架

### 后端
- Node.js 18+ - JavaScript运行时
- Express.js - Web应用框架
- TypeScript - 类型安全的JavaScript
- Multer - 文件上传中间件
- Sharp - 图片处理库

### 测试
- Jest - 单元测试框架
- React Testing Library - React组件测试
- Playwright - 端到端测试

## 快速开始

### 环境要求

- Node.js 18.0.0 或更高版本
- npm 8.0.0 或更高版本

### 1. 克隆项目

```bash
git clone https://github.com/your-username/photo-butler.git
cd photo-butler
```

### 2. 安装依赖

```bash
# 安装根目录依赖（E2E测试）
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

### 3. 配置环境变量

复制环境变量示例文件并配置：

```bash
# 后端
cp backend/.env.example backend/.env

# 前端
cp frontend/.env.example frontend/.env.local
```

**重要**: 请在 `backend/.env` 中配置您的豆包API密钥：

```env
DOUBAO_API_KEY=your_actual_api_key_here
```

### 4. 启动开发服务器

使用提供的启动脚本：

```bash
# 使用启动脚本（推荐）
./scripts/dev.sh

# 或者手动启动
# 终端1: 启动后端
cd backend
npm run dev

# 终端2: 启动前端
cd frontend
npm run dev
```

### 5. 访问应用

- 前端应用: http://localhost:3000
- 后端API: http://localhost:3001

## 开发指南

### 添加新模板

1. 将模板预览图添加到 `image/` 目录
2. 在 `prompt/prompt.txt` 中添加对应的提示词
3. 重启服务器，新模板将自动加载

### 运行测试

```bash
# 单元测试
cd backend && npm test
cd ../frontend && npm test

# 端到端测试
npm run test:e2e
```

### 代码检查

```bash
# 后端代码检查
cd backend && npm run lint

# 前端代码检查
cd frontend && npm run lint
```

### 构建生产版本

```bash
# 构建后端
cd backend && npm run build

# 构建前端
cd frontend && npm run build
```

## 文档

- [API文档](docs/API.md) - 详细的后端API接口文档
- [部署指南](docs/DEPLOYMENT.md) - 开发和生产环境部署指南
- [环境配置](docs/ENVIRONMENT.md) - 环境变量配置指南
- [故障排除](docs/TROUBLESHOOTING.md) - 常见问题解决方案

### 主要API端点

- `POST /api/upload` - 上传参考图片
- `GET /api/templates` - 获取模板列表
- `POST /api/generate` - 生成AI图片
- `GET /api/download/:imageId` - 下载生成的图片

## 部署指南

### 开发环境快速启动

使用提供的启动脚本：

```bash
# 启动开发服务器
./scripts/dev.sh

# 停止开发服务器
./scripts/stop.sh
```

### 生产环境部署

```bash
# 构建生产版本
./scripts/build.sh
```

详见 [部署指南](docs/DEPLOYMENT.md)

## 故障排除

### 常见问题

**Q: 图片生成失败**  
A: 检查豆包API密钥是否正确配置，网络连接是否正常

**Q: 文件上传失败**  
A: 确认文件格式为JPG/PNG，大小不超过10MB

**Q: 前端无法连接后端**  
A: 检查后端服务是否启动，端口配置是否正确

更多问题请查看 [故障排除指南](docs/TROUBLESHOOTING.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

- [豆包API](https://www.volcengine.com/product/doubao) - AI图片生成服务
- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
