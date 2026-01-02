# 提示词模板系统组件

## 概述

这个目录包含了提示词模板系统的所有React组件。该系统提供了完整的模板管理功能，包括浏览、搜索、上传和管理提示词模板。

## 组件结构

### 核心组件

- **TemplateList** - 模板列表展示组件
- **TemplateCard** - 单个模板卡片组件  
- **TemplateDetail** - 模板详情页面组件
- **TemplateUpload** - 模板上传表单组件

### 搜索和筛选组件

- **SearchBar** - 搜索栏组件
- **TagFilter** - 标签筛选组件

### 工具组件

- **TemplatePreview** - 模板预览组件
- **TemplateModal** - 模板弹窗组件
- **TemplateForm** - 模板表单组件

### 布局组件

- **TemplateGallery** - 模板画廊组件
- **TemplateGrid** - 模板网格布局组件

### 状态组件

- **LoadingSpinner** - 加载动画组件
- **ErrorMessage** - 错误消息组件
- **EmptyState** - 空状态组件

## 使用方式

```typescript
import { 
  TemplateList, 
  TemplateCard, 
  SearchBar, 
  TagFilter 
} from '@/components/promptTemplate'

// 在组件中使用
function MyComponent() {
  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <TagFilter tags={availableTags} onTagToggle={handleTagToggle} />
      <TemplateList templates={templates} onTemplateSelect={handleSelect} />
    </div>
  )
}
```

## 状态管理

所有组件都与 `usePromptTemplateStore` 状态管理器集成，提供统一的状态管理。

```typescript
import { usePromptTemplateStore } from '@/stores/promptTemplateStore'

function MyComponent() {
  const { 
    templates, 
    loading, 
    searchTemplates, 
    createTemplate 
  } = usePromptTemplateStore()
  
  // 使用状态和操作
}
```

## 开发指南

### 添加新组件

1. 在此目录下创建新的组件文件
2. 实现组件逻辑和UI
3. 在 `index.ts` 中导出组件
4. 添加相应的类型定义到 `types/promptTemplate.ts`
5. 更新此README文档

### 组件规范

- 所有组件都应该使用TypeScript
- 遵循现有的命名约定
- 包含适当的错误处理
- 支持响应式设计
- 包含必要的可访问性属性

### 测试

每个组件都应该包含相应的测试文件：

```
TemplateCard.tsx
TemplateCard.test.tsx
```

## 依赖关系

- React 18+
- TypeScript
- Zustand (状态管理)
- 现有的UI组件库

## 注意事项

- 组件设计要与现有的应用风格保持一致
- 确保所有组件都支持国际化
- 注意性能优化，特别是在处理大量模板时
- 遵循无障碍设计原则