# 前端电商化重构设计文档

## 概述

本设计文档描述了将现有AI图片生成应用重构为电商化界面的技术方案。新设计将提供类似在线购物的用户体验，支持异步多线程生成，并包含完整的作品管理功能。

## 架构

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   后端API       │    │   生成服务      │
│                 │    │                 │    │                 │
│ - 模板商城      │◄──►│ - 模板管理      │    │ - 异步队列      │
│ - 详情弹窗      │    │ - 任务管理      │◄──►│ - 图片生成      │
│ - 作品仓库      │    │ - 用户管理      │    │ - 状态更新      │
│ - 实时更新      │    │ - 文件服务      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 前端架构
```
┌─────────────────────────────────────────────────────────────┐
│                        前端应用                            │
├─────────────────────────────────────────────────────────────┤
│  页面层 (Pages)                                             │
│  ├── 模板商城页面 (TemplateMarketplace)                     │
│  └── 作品仓库页面 (WorkspaceGallery)                        │
├─────────────────────────────────────────────────────────────┤
│  组件层 (Components)                                        │
│  ├── 模板卡片 (TemplateCard)                               │
│  ├── 搜索栏 (SearchBar)                                    │
│  ├── 详情弹窗 (TemplateModal)                              │
│  ├── 上传组件 (ImageUploader)                              │
│  ├── 任务卡片 (TaskCard)                                   │
│  └── 状态指示器 (StatusIndicator)                          │
├─────────────────────────────────────────────────────────────┤
│  服务层 (Services)                                          │
│  ├── 模板服务 (TemplateService)                            │
│  ├── 任务服务 (TaskService)                                │
│  ├── 文件服务 (FileService)                                │
│  └── WebSocket服务 (WebSocketService)                      │
├─────────────────────────────────────────────────────────────┤
│  状态管理 (State Management)                                │
│  ├── 模板状态 (TemplateStore)                              │
│  ├── 任务状态 (TaskStore)                                  │
│  └── UI状态 (UIStore)                                      │
└─────────────────────────────────────────────────────────────┘
```

## 组件和接口

### 核心组件

#### 1. TemplateMarketplace (模板商城)
```typescript
interface TemplateMarketplaceProps {
  onTemplateSelect: (template: Template) => void;
}

interface TemplateMarketplaceState {
  templates: Template[];
  filteredTemplates: Template[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
  selectedTemplate: Template | null;
  showModal: boolean;
}
```

#### 2. TemplateCard (模板卡片)
```typescript
interface TemplateCardProps {
  template: Template;
  onClick: (template: Template) => void;
  className?: string;
}

interface TemplateCardState {
  imageLoaded: boolean;
  imageError: boolean;
}
```

#### 3. TemplateModal (模板详情弹窗)
```typescript
interface TemplateModalProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onTaskSubmit: (task: GenerationTask) => void;
}

interface TemplateModalState {
  uploadedFile: File | null;
  previewUrl: string | null;
  isSubmitting: boolean;
  submitError: string | null;
}
```

#### 4. WorkspaceGallery (作品仓库)
```typescript
interface WorkspaceGalleryProps {
  userId?: string;
}

interface WorkspaceGalleryState {
  tasks: GenerationTask[];
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  sortBy: TaskSortOption;
}
```

#### 5. TaskCard (任务卡片)
```typescript
interface TaskCardProps {
  task: GenerationTask;
  onDownload?: (task: GenerationTask) => void;
  onRetry?: (task: GenerationTask) => void;
  onDelete?: (task: GenerationTask) => void;
}
```

### 数据模型

#### Template (模板)
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  prompt: string;
  category?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### GenerationTask (生成任务)
```typescript
interface GenerationTask {
  id: string;
  userId: string;
  templateId: string;
  template: Template;
  originalImageUrl: string;
  generatedImageUrl?: string;
  status: TaskStatus;
  progress: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

#### TaskFilter (任务过滤器)
```typescript
interface TaskFilter {
  status?: TaskStatus[];
  templateId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

enum TaskSortOption {
  CREATED_DESC = 'created_desc',
  CREATED_ASC = 'created_asc',
  STATUS = 'status',
  TEMPLATE = 'template'
}
```

### API接口

#### 模板相关API
```typescript
// 获取模板列表
GET /api/templates
Response: {
  success: boolean;
  data: {
    templates: Template[];
    total: number;
    page: number;
    limit: number;
  };
}

// 搜索模板
GET /api/templates/search?q={query}&page={page}&limit={limit}
Response: {
  success: boolean;
  data: {
    templates: Template[];
    total: number;
    query: string;
  };
}

// 获取模板详情
GET /api/templates/{id}
Response: {
  success: boolean;
  data: {
    template: Template;
  };
}
```

#### 任务相关API
```typescript
// 创建生成任务
POST /api/tasks
Body: {
  templateId: string;
  imageFile: File;
  customPrompt?: string;
}
Response: {
  success: boolean;
  data: {
    task: GenerationTask;
  };
}

// 获取用户任务列表
GET /api/tasks?status={status}&page={page}&limit={limit}
Response: {
  success: boolean;
  data: {
    tasks: GenerationTask[];
    total: number;
  };
}

// 获取任务详情
GET /api/tasks/{id}
Response: {
  success: boolean;
  data: {
    task: GenerationTask;
  };
}

// 重试失败任务
POST /api/tasks/{id}/retry
Response: {
  success: boolean;
  data: {
    task: GenerationTask;
  };
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

基于需求分析，以下是关键的正确性属性：

### 属性 1: 模板卡片完整性
*对于任何*显示的模板卡片，都应该包含模板预览图、名称和简介信息
**验证: 需求 2.1**

### 属性 2: 搜索过滤正确性
*对于任何*搜索关键词，返回的模板列表应该只包含名称或简介中包含该关键词的模板
**验证: 需求 3.1, 3.2**

### 属性 3: 模态框交互一致性
*对于任何*模板卡片点击操作，都应该弹出包含该模板详细信息的模态框
**验证: 需求 4.1, 4.2**

### 属性 4: 文件上传验证
*对于任何*上传的文件，系统应该验证其格式和大小是否符合要求
**验证: 需求 5.1**

### 属性 5: 任务提交异步性
*对于任何*提交的生成任务，系统应该立即返回任务ID而不阻塞用户界面
**验证: 需求 6.1, 6.2**

### 属性 6: 任务状态一致性
*对于任何*生成任务，其在作品仓库中显示的状态应该与后端实际状态保持一致
**验证: 需求 8.1**

### 属性 7: 响应式布局适配
*对于任何*屏幕尺寸，模板卡片的布局应该适当调整以保持良好的可用性
**验证: 需求 9.1, 9.2, 9.3**

### 属性 8: 懒加载性能优化
*对于任何*模板图片，只有当其进入视口时才应该开始加载
**验证: 需求 10.2**

### 属性 9: 错误恢复机制
*对于任何*数据加载失败的情况，系统应该提供重试选项并保持界面可用
**验证: 需求 10.5**

### 属性 10: 任务并发处理
*对于任何*数量的并发生成任务，系统应该正确管理任务队列和状态更新
**验证: 需求 6.3**

## 错误处理

### 前端错误处理策略

#### 1. 网络错误
- **连接超时**: 显示重试按钮，支持自动重试机制
- **服务器错误**: 显示友好错误信息，提供联系支持选项
- **网络中断**: 缓存用户操作，网络恢复后自动重试

#### 2. 文件上传错误
- **格式不支持**: 显示支持的格式列表
- **文件过大**: 显示大小限制和压缩建议
- **上传失败**: 提供重新选择文件选项

#### 3. 任务处理错误
- **任务创建失败**: 显示错误原因，支持重新提交
- **生成失败**: 在作品仓库中显示失败状态和重试选项
- **状态同步失败**: 提供手动刷新功能

#### 4. UI错误
- **组件渲染错误**: 使用错误边界捕获，显示降级UI
- **状态管理错误**: 重置相关状态，保持应用可用
- **路由错误**: 重定向到首页或显示404页面

### 错误恢复机制

#### 自动恢复
```typescript
interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
}

class ErrorRecoveryService {
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    // 实现指数退避重试逻辑
  }
}
```

#### 用户主导恢复
- 提供明确的重试按钮
- 显示错误详情和建议操作
- 支持部分功能降级使用

## 测试策略

### 双重测试方法

本项目将采用单元测试和基于属性的测试相结合的方法：

#### 单元测试
单元测试验证特定示例、边界情况和错误条件：
- 组件渲染测试
- 用户交互测试
- API调用测试
- 错误处理测试

#### 基于属性的测试
基于属性的测试验证应该在所有输入中保持的通用属性：
- 使用 **fast-check** 作为属性测试库
- 每个属性测试运行最少 **100** 次迭代
- 每个属性测试必须用注释明确引用设计文档中的正确性属性

#### 测试配置要求
- 属性测试库: fast-check (JavaScript/TypeScript)
- 最小迭代次数: 100次
- 属性测试标记格式: `**Feature: frontend-ecommerce-redesign, Property {number}: {property_text}**`

#### 测试覆盖范围
- **单元测试**: 覆盖具体的用户交互场景和边界情况
- **属性测试**: 验证系统在各种输入下的通用正确性
- **集成测试**: 测试组件间的协作和数据流
- **端到端测试**: 验证完整的用户工作流程

### 测试实现示例

#### 属性测试示例
```typescript
// **Feature: frontend-ecommerce-redesign, Property 1: 模板卡片完整性**
test('template cards should always contain required information', () => {
  fc.assert(fc.property(
    fc.array(templateArbitrary, { minLength: 1 }),
    (templates) => {
      const { container } = render(<TemplateMarketplace templates={templates} />);
      const cards = container.querySelectorAll('[data-testid="template-card"]');
      
      cards.forEach(card => {
        expect(card.querySelector('[data-testid="template-image"]')).toBeInTheDocument();
        expect(card.querySelector('[data-testid="template-name"]')).toBeInTheDocument();
        expect(card.querySelector('[data-testid="template-description"]')).toBeInTheDocument();
      });
    }
  ), { numRuns: 100 });
});
```

#### 单元测试示例
```typescript
test('should display error message when template loading fails', async () => {
  const mockError = 'Failed to load templates';
  jest.spyOn(templateService, 'getTemplates').mockRejectedValue(new Error(mockError));
  
  render(<TemplateMarketplace />);
  
  await waitFor(() => {
    expect(screen.getByText(/加载失败/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });
});
```