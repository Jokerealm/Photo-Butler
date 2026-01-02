# 提示词模板系统实现文档

## 概述

本文档描述了提示词模板系统的核心结构和接口实现。该系统旨在将现有的纯文本提示词转换为结构化的JSON格式，并提供完整的模板管理功能。

## 已实现的核心结构

### 1. 类型定义 (`frontend/types/`)

#### `promptTemplate.ts`
- **PromptTemplate**: 核心模板数据结构
- **CreateTemplateRequest**: 创建模板请求接口
- **UpdateTemplateRequest**: 更新模板请求接口
- **TemplateSearchParams**: 搜索参数接口
- **MigrationResult**: 数据迁移结果接口
- **组件Props接口**: 所有UI组件的属性定义
- **状态管理接口**: Store状态和操作定义

#### `promptTemplateErrors.ts`
- **TemplateErrorType**: 错误类型枚举
- **ErrorSeverity**: 错误严重程度枚举
- **各种错误接口**: ValidationError, FileError, NetworkError等
- **TemplateErrorFactory**: 错误对象创建工厂
- **ERROR_MESSAGES**: 预定义错误消息

### 2. 验证工具 (`frontend/utils/promptTemplateValidation.ts`)

#### 验证规则
- **VALIDATION_RULES**: 完整的验证规则常量
- **字段验证函数**: validateTitle, validateDescription, validateContent等
- **文件验证**: validateThumbnailFile
- **请求验证**: validateCreateTemplateRequest, validateUpdateTemplateRequest

#### 工具函数
- **sanitizeTags**: 标签清理和标准化
- **sanitizeText**: 文本内容清理
- **formatValidationErrors**: 错误消息格式化
- **isLatestVersion**: 版本兼容性检查

### 3. 服务接口 (`frontend/services/promptTemplateService.ts`)

#### 核心服务接口
- **IPromptTemplateService**: 主要业务逻辑接口
- **ITemplateStorageService**: 本地存储服务接口
- **IFileHandlingService**: 文件处理服务接口
- **IMigrationService**: 数据迁移服务接口
- **ISearchService**: 搜索服务接口
- **ICacheService**: 缓存服务接口
- **IEventService**: 事件服务接口

#### 配置接口
- **ServiceConfig**: 服务配置结构
- **IServiceFactory**: 服务工厂接口

### 4. 状态管理 (`frontend/stores/promptTemplateStore.ts`)

#### Zustand Store实现
- **完整的状态管理**: 模板数据、加载状态、错误处理
- **CRUD操作**: 创建、读取、更新、删除模板
- **搜索和筛选**: 实时搜索、标签筛选
- **数据持久化**: 使用persist中间件
- **开发工具集成**: devtools中间件

#### 辅助函数
- **filterTemplates**: 模板过滤逻辑
- **useAvailableTags**: 获取可用标签Hook
- **useTemplateStats**: 模板统计信息Hook

### 5. 数据迁移工具 (`frontend/utils/promptTemplateMigration.ts`)

#### 解析功能
- **parsePromptFile**: 解析prompt.txt文件
- **extractTitle**: 从内容提取标题
- **extractTags**: 智能标签提取
- **matchThumbnail**: 缩略图匹配逻辑

#### 转换功能
- **convertToTemplate**: 将解析项目转换为模板
- **migratePromptData**: 完整迁移流程
- **generateMigrationReport**: 迁移报告生成

#### 验证和清理
- **validateMigrationResult**: 迁移结果验证
- **cleanupMigrationData**: 数据清理
- **needsMigration**: 迁移需求检查

### 6. 配置管理 (`frontend/config/promptTemplateConfig.ts`)

#### 配置结构
- **DEFAULT_CONFIG**: 默认配置
- **ENVIRONMENT_CONFIG**: 环境特定配置
- **APP_CONFIG**: 应用配置常量
- **FEATURE_FLAGS**: 功能开关

#### 配置功能
- **getConfig**: 获取当前环境配置
- **isFeatureEnabled**: 功能启用检查
- **getEnvironmentConfig**: 环境变量配置

### 7. 组件结构 (`frontend/components/promptTemplate/`)

#### 组件导出文件
- **index.ts**: 统一组件导出
- **README.md**: 组件使用文档

#### 工具导出
- **utils/promptTemplate/index.ts**: 工具函数统一导出

## 数据模型

### PromptTemplate 核心结构
```typescript
interface PromptTemplate {
  id: string                    // 唯一标识符
  title: string                 // 模板标题
  description: string           // 模板描述
  content: string              // 提示词内容
  tags: string[]               // 用户自定义标签
  thumbnailPath: string        // 缩略图路径
  createdAt: string           // 创建时间 (ISO 8601)
  updatedAt: string           // 更新时间 (ISO 8601)
  version: number             // 版本号，用于向后兼容
  
  // 预留字段，为未来扩展做准备
  authorId?: string           // 作者ID (未来用户系统)
  category?: string           // 模板分类
  usageCount?: number         // 使用次数
  rating?: number             // 评分
}
```

## 验证规则

### 字段限制
- **标题**: 1-100字符，必需
- **描述**: 1-500字符，必需  
- **内容**: 10-5000字符，必需
- **标签**: 最多10个，每个最多20字符
- **文件**: JPG/PNG格式，最大5MB

### 数据完整性
- 所有必需字段验证
- 时间戳格式验证
- 版本号验证
- 文件格式和大小验证

## 迁移策略

### 解析逻辑
1. 按编号识别提示词项目 (1. 2. 3. ...)
2. 提取标题（冒号前内容或前30字符）
3. 智能标签提取（基于内容关键词）
4. 缩略图匹配（基于内容关键词）

### 转换流程
1. 读取prompt.txt文件
2. 解析为ParsedPromptItem数组
3. 转换为PromptTemplate对象
4. 验证和清理数据
5. 生成迁移报告

## 错误处理

### 错误分类
- **验证错误**: 数据格式和规则验证
- **文件错误**: 文件格式和大小问题
- **网络错误**: API调用失败
- **存储错误**: 本地存储问题
- **迁移错误**: 数据迁移问题

### 错误恢复
- 自动重试机制
- 用户友好的错误消息
- 详细的错误日志
- 恢复建议提供

## 性能优化

### 状态管理
- 使用Zustand轻量级状态管理
- 数据持久化到localStorage
- 智能的重新渲染优化

### 搜索优化
- 客户端搜索和筛选
- 防抖搜索输入
- 搜索结果缓存

### 文件处理
- 文件大小和格式验证
- 图片压缩和缩略图生成
- 异步文件上传

## 扩展性设计

### 预留字段
- authorId: 用户系统集成
- category: 模板分类
- usageCount: 使用统计
- rating: 评分系统

### 服务接口
- 模块化的服务接口设计
- 可插拔的存储后端
- 事件驱动的架构

### 配置管理
- 环境特定配置
- 功能开关控制
- 运行时配置更新

## 下一步实现

根据任务列表，接下来需要实现：

1. **TemplateService核心业务逻辑** (任务2.1)
2. **Zustand模板存储具体实现** (任务3.1)
3. **prompt.txt解析器实现** (任务4.1)
4. **UI组件实现** (任务5-6)
5. **集成测试和优化** (任务8)

每个任务都有详细的子任务和属性测试要求，确保系统的正确性和可靠性。