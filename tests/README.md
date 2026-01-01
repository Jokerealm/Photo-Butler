# 测试目录

本目录用于存放项目的测试文件。

## 测试类型

- 单元测试：测试单个组件和函数
- 属性测试：使用fast-check进行属性测试
- 集成测试：测试组件间的交互
- 端到端测试：使用Playwright测试完整流程

## 端到端测试

### 配置

端到端测试使用Playwright框架，配置文件为根目录的 `playwright.config.ts`。

### 测试文件

- `e2e/complete-generation-flow.spec.ts` - 完整图片生成流程测试
- `e2e/error-handling-flow.spec.ts` - 错误处理流程测试
- `e2e/responsive-layout.spec.ts` - 响应式布局测试
- `e2e/fixtures.ts` - 测试工具和辅助函数

### 运行测试

```bash
# 运行所有E2E测试
npm run test:e2e

# 使用UI模式运行测试
npm run test:e2e:ui

# 运行测试并显示浏览器
npm run test:e2e:headed

# 调试模式运行测试
npm run test:e2e:debug

# 查看测试报告
npm run test:e2e:report
```

### 测试覆盖范围

#### 完整生成流程测试
- 图片上传到下载的完整流程
- 状态一致性验证
- 多次生成序列测试

#### 错误处理流程测试
- 无效文件上传处理
- 空提示词验证
- API失败处理
- 网络超时处理
- 本地存储错误处理
- 模板缺失处理
- 错误恢复和重试

#### 响应式布局测试
- 桌面端多列布局
- 移动端单列布局
- 屏幕尺寸变化适应
- 移动端图片上传
- 跨设备可用性
- 方向变化处理
- 触摸目标大小验证

### 测试数据

测试使用项目中的示例图片：
- `image/film-grid-rainy-night.jpg` - 有效JPG文件
- `image/placeholder.png` - 有效PNG文件
- `README.md` - 无效文件格式（用于错误测试）

### 注意事项

1. E2E测试需要前端和后端服务同时运行
2. 测试会自动启动开发服务器（配置在playwright.config.ts中）
3. 某些测试可能需要真实的API响应，建议在测试环境中配置mock服务
4. 移动端测试使用模拟的移动设备视口
5. 响应式测试覆盖多种屏幕尺寸和设备类型
