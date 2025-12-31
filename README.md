# Photo Butler - AI图片生成应用

基于豆包API的AI图片生成网页应用。用户可以上传参考图片，选择预设的风格模板，编辑提示词，然后生成具有特定艺术风格的图片。

## 项目结构

```
Photo-Butler/
├── frontend/          # Next.js前端应用
├── backend/           # Express后端服务器
├── uploads/           # 临时文件存储
├── tests/             # 测试文件
├── docs/              # 项目文档
├── image/             # 模板预览图
├── prompt/            # 模板提示词
└── .env.example       # 环境变量示例
```

## 技术栈

### 前端
- Next.js 15+ (React 18+)
- TypeScript
- Tailwind CSS
- Axios

### 后端
- Node.js 18+
- Express.js
- TypeScript
- Multer (文件上传)

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 配置环境变量

后端和前端的环境变量已配置完成，豆包API密钥已设置。

### 3. 启动开发服务器

```bash
# 启动后端服务器（在backend目录）
cd backend
npm run dev

# 启动前端服务器（在frontend目录，新终端）
cd frontend
npm run dev
```

前端应用将在 http://localhost:3000 运行  
后端API将在 http://localhost:3001 运行

## 开发指南

详细的开发文档请参考 `docs/` 目录。

## Git工作流

每完成一个任务后，请提交代码到Git：

```bash
git add .
git commit -m "完成任务X: 描述"
git push
```

## 许可证

ISC
This repo is for my friend. It is dedicated to providing composition and photo post-processing.
