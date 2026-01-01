# Photo Butler v1.0.0 发布说明

## 🎉 首次发布

Photo Butler 是一个基于豆包API的AI图片生成网页应用，提供直观的用户界面和强大的图片生成功能。

## ✨ 主要功能

### 核心功能
- **AI图片生成**: 基于豆包API的高质量图片生成
- **图片上传**: 支持JPG/PNG格式，最大10MB
- **模板系统**: 多种预设艺术风格模板
- **提示词编辑**: 灵活的提示词自定义功能
- **历史记录**: 本地存储生成历史
- **响应式设计**: 完美适配桌面和移动设备

### 用户体验
- **流程指示器**: 清晰的操作步骤指导
- **智能提示**: 根据当前状态提供操作建议
- **快速操作**: 便捷的操作按钮和快捷方式
- **一键下载**: 简单的图片保存功能

## 🛠️ 技术栈

### 前端
- Next.js 15+ (React全栈框架)
- React 18+ (用户界面库)
- TypeScript (类型安全)
- Tailwind CSS (样式框架)

### 后端
- Node.js 18+ (运行时)
- Express.js (Web框架)
- TypeScript (类型安全)
- Sharp (图片处理)

### 开发工具
- Jest (单元测试)
- Playwright (E2E测试)
- ESLint (代码检查)
- Prettier (代码格式化)

## 📦 部署方式

### 开发环境
```bash
# 克隆项目
git clone <repository-url>
cd photo-butler

# 配置环境变量
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 启动开发服务器
./scripts/dev.sh
```

### 生产环境
```bash
# 构建生产版本
./scripts/build.sh

# 部署生产包
tar -xzf photo-butler-production-*.tar.gz
cd dist
./start.sh
```

## 🔧 配置要求

### 系统要求
- Node.js 18.0.0 或更高版本
- npm 8.0.0 或更高版本
- 2GB+ 可用内存
- 1GB+ 可用磁盘空间

### API配置
- 豆包API密钥（必需）
- 网络连接（用于API调用）

## 📚 文档

- [API文档](docs/API.md) - 详细的后端API接口文档
- [部署指南](docs/DEPLOYMENT.md) - 完整的部署说明
- [环境配置](docs/ENVIRONMENT.md) - 环境变量配置指南
- [故障排除](docs/TROUBLESHOOTING.md) - 常见问题解决方案
- [贡献指南](CONTRIBUTING.md) - 如何参与项目开发

## 🚀 快速开始

1. **获取API密钥**: 在豆包平台申请API密钥
2. **克隆项目**: `git clone <repository-url>`
3. **配置环境**: 编辑 `.env` 文件，填入API密钥
4. **启动应用**: 运行 `./scripts/dev.sh`
5. **访问应用**: 打开 http://localhost:3000

## 🔮 未来计划

- 用户认证系统
- 更多艺术风格模板
- 高级参数调节
- 批量图片生成
- 云端存储集成
- 移动端APP

## 🤝 贡献

我们欢迎各种形式的贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解详情。

## 📄 许可证

本项目采用 [ISC许可证](LICENSE)。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**下载地址**: [GitHub Releases](../../releases)  
**问题反馈**: [GitHub Issues](../../issues)  
**讨论交流**: [GitHub Discussions](../../discussions)