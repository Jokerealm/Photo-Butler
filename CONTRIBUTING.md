# 贡献指南

感谢您对 Photo Butler 项目的关注！我们欢迎各种形式的贡献。

## 如何贡献

### 报告问题

如果您发现了bug或有功能建议，请：

1. 检查 [Issues](../../issues) 确认问题尚未被报告
2. 创建新的 Issue，包含：
   - 清晰的标题和描述
   - 重现步骤（如果是bug）
   - 期望的行为
   - 实际的行为
   - 环境信息（操作系统、Node.js版本等）
   - 截图（如果适用）

### 提交代码

1. **Fork 项目**
   ```bash
   git clone https://github.com/your-username/photo-butler.git
   cd photo-butler
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **设置开发环境**
   ```bash
   # 安装依赖
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   
   # 配置环境变量
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   
   # 启动开发服务器
   ./scripts/dev.sh
   ```

4. **进行更改**
   - 遵循现有的代码风格
   - 添加必要的测试
   - 更新相关文档

5. **运行测试**
   ```bash
   # 代码检查
   cd backend && npm run lint
   cd ../frontend && npm run lint
   
   # 单元测试
   cd backend && npm test
   cd ../frontend && npm test
   
   # E2E测试
   cd .. && npm run test:e2e
   ```

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

7. **推送到分支**
   ```bash
   git push origin feature/amazing-feature
   ```

8. **创建 Pull Request**

## 代码规范

### 提交信息格式

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修复bug的代码变动）
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(auth): add user authentication system
fix(upload): resolve file size validation issue
docs: update API documentation
```

### 代码风格

- **TypeScript**: 使用严格模式
- **ESLint**: 遵循项目配置
- **Prettier**: 自动格式化代码
- **命名**: 使用有意义的变量和函数名
- **注释**: 为复杂逻辑添加注释

### 文件结构

```
src/
├── components/          # React组件
│   ├── ui/             # 基础UI组件
│   └── features/       # 功能组件
├── hooks/              # 自定义Hooks
├── utils/              # 工具函数
├── types/              # TypeScript类型定义
├── services/           # API服务
└── constants/          # 常量定义
```

## 测试指南

### 单元测试

- 为新功能编写测试
- 测试覆盖率应保持在80%以上
- 使用描述性的测试名称

```typescript
describe('ImageUpload', () => {
  it('should validate file size correctly', () => {
    // 测试逻辑
  });
});
```

### E2E测试

- 为关键用户流程编写E2E测试
- 使用Page Object模式
- 确保测试在不同浏览器中通过

## 文档

- 更新相关的README文件
- 为新的API端点添加文档
- 更新CHANGELOG.md

## 发布流程

1. 更新版本号（遵循语义化版本）
2. 更新CHANGELOG.md
3. 创建发布标签
4. 自动化构建和部署

## 社区准则

- 保持友善和专业
- 尊重不同的观点和经验
- 专注于对项目最有利的事情
- 遵循 [Code of Conduct](CODE_OF_CONDUCT.md)

## 获得帮助

如果您需要帮助：

1. 查看现有的文档和Issues
2. 在Discussions中提问
3. 联系维护者

## 许可证

通过贡献代码，您同意您的贡献将在与项目相同的 [ISC许可证](LICENSE) 下授权。

---

再次感谢您的贡献！🎉