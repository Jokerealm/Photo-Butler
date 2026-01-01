# 环境变量配置指南

本文档详细说明 Photo Butler 应用的环境变量配置。

## 目录

- [概述](#概述)
- [后端环境变量](#后端环境变量)
- [前端环境变量](#前端环境变量)
- [开发环境配置](#开发环境配置)
- [生产环境配置](#生产环境配置)
- [安全注意事项](#安全注意事项)

## 概述

Photo Butler 使用环境变量来配置不同环境下的应用行为。主要包括：

- 服务器配置（端口、CORS等）
- API集成配置（豆包API）
- 文件上传配置
- 数据库配置
- 安全配置

## 后端环境变量

### 基础配置文件

**文件位置**: `backend/.env`

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 安全配置
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
VALID_API_KEYS=

# 豆包API配置
DOUBAO_API_KEY=your_doubao_api_key_here
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_API_TIMEOUT=30000
DOUBAO_MAX_RETRIES=3

# 文件上传配置
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png
UPLOAD_DIR=./uploads

# 数据库配置（预留）
DATABASE_PATH=./data/photo-butler.db
```

### 详细说明

#### 服务器配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `PORT` | number | 3001 | 后端服务器监听端口 |
| `NODE_ENV` | string | development | 运行环境：development/production |

#### 安全配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ALLOWED_ORIGINS` | string | localhost:3000 | CORS允许的源，多个用逗号分隔 |
| `VALID_API_KEYS` | string | - | 有效的API密钥列表（预留） |

#### 豆包API配置

| 变量名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `DOUBAO_API_KEY` | string | ✅ | 豆包API密钥 |
| `DOUBAO_API_URL` | string | ✅ | 豆包API基础URL |
| `DOUBAO_API_TIMEOUT` | number | - | API调用超时时间（毫秒） |
| `DOUBAO_MAX_RETRIES` | number | - | API调用最大重试次数 |

#### 文件上传配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `MAX_FILE_SIZE` | number | 10485760 | 最大文件大小（字节），默认10MB |
| `ALLOWED_FILE_TYPES` | string | image/jpeg,image/png | 允许的文件类型 |
| `UPLOAD_DIR` | string | ./uploads | 文件上传目录 |

#### 数据库配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_PATH` | string | ./data/photo-butler.db | SQLite数据库文件路径 |

## 前端环境变量

### 基础配置文件

**开发环境**: `frontend/.env.local`
**生产环境**: `frontend/.env.production`

```env
# API配置
NEXT_PUBLIC_API_URL=http://localhost:3001

# 功能开关（可选）
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### 详细说明

| 变量名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `NEXT_PUBLIC_API_URL` | string | ✅ | 后端API基础URL |
| `NEXT_PUBLIC_ENABLE_DEBUG` | boolean | - | 是否启用调试模式 |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | boolean | - | 是否启用分析功能 |

**注意**: Next.js 中只有以 `NEXT_PUBLIC_` 开头的环境变量才能在客户端访问。

## 开发环境配置

### 快速配置

```bash
# 复制示例文件
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 编辑后端配置
nano backend/.env
```

### 开发环境示例

**backend/.env**:
```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DOUBAO_API_KEY=your_development_api_key
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
DATABASE_PATH=./data/photo-butler.db
```

**frontend/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_DEBUG=true
```

## 生产环境配置

### 安全配置

**backend/.env**:
```env
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DOUBAO_API_KEY=your_production_api_key
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_API_TIMEOUT=30000
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/photo-butler/uploads
DATABASE_PATH=/var/www/photo-butler/data/photo-butler.db
```

**frontend/.env.production**:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 使用系统环境变量

在生产环境中，建议使用系统环境变量而不是文件：

```bash
# 设置系统环境变量
export PORT=3001
export NODE_ENV=production
export DOUBAO_API_KEY="your_production_api_key"
export ALLOWED_ORIGINS="https://yourdomain.com"

# 或使用 systemd 服务文件
# /etc/systemd/system/photo-butler.service
[Service]
Environment=PORT=3001
Environment=NODE_ENV=production
Environment=DOUBAO_API_KEY=your_production_api_key
```

## 环境变量验证

### 后端验证

在 `backend/src/config/env.ts` 中验证环境变量：

```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DOUBAO_API_KEY: z.string().min(1, 'DOUBAO_API_KEY is required'),
  DOUBAO_API_URL: z.string().url('DOUBAO_API_URL must be a valid URL'),
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
```

### 前端验证

在 `frontend/src/config/env.ts` 中验证环境变量：

```typescript
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('API URL must be valid'),
  NEXT_PUBLIC_ENABLE_DEBUG: z.string().transform(val => val === 'true').optional(),
});

export const env = envSchema.parse(process.env);
```

## 配置管理工具

### 使用 dotenv-cli

```bash
# 安装
npm install -g dotenv-cli

# 使用不同环境文件运行
dotenv -e .env.development npm run dev
dotenv -e .env.production npm start
```

### 使用 cross-env

```bash
# 安装
npm install --save-dev cross-env

# package.json 脚本
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development npm run start:dev",
    "prod": "cross-env NODE_ENV=production npm start"
  }
}
```

## 安全注意事项

### 1. 敏感信息保护

- ❌ **不要**将 `.env` 文件提交到版本控制
- ✅ **要**将 `.env.example` 文件提交作为模板
- ✅ **要**在 `.gitignore` 中排除 `.env` 文件

```gitignore
# 环境变量文件
.env
.env.local
.env.production
.env.development
backend/.env
frontend/.env.local
```

### 2. API密钥管理

- 使用不同的API密钥用于开发和生产环境
- 定期轮换API密钥
- 监控API密钥使用情况
- 限制API密钥权限

### 3. 生产环境最佳实践

```bash
# 使用专用用户运行应用
sudo useradd -r -s /bin/false photo-butler

# 设置环境变量文件权限
chmod 600 /var/www/photo-butler/.env
chown photo-butler:photo-butler /var/www/photo-butler/.env

# 使用系统密钥管理服务
# AWS: AWS Secrets Manager
# Azure: Azure Key Vault
# Google Cloud: Secret Manager
```

### 4. 环境隔离

```bash
# 开发环境
DOUBAO_API_KEY=dev_key_xxx
ALLOWED_ORIGINS=http://localhost:3000

# 测试环境
DOUBAO_API_KEY=test_key_xxx
ALLOWED_ORIGINS=https://test.yourdomain.com

# 生产环境
DOUBAO_API_KEY=prod_key_xxx
ALLOWED_ORIGINS=https://yourdomain.com
```

## 故障排除

### 常见问题

#### 1. 环境变量未生效

```bash
# 检查文件是否存在
ls -la backend/.env frontend/.env.local

# 检查文件内容
cat backend/.env

# 检查进程环境变量
ps eww $(pgrep node) | tr ' ' '\n' | grep -E '^[A-Z_]+=.*'
```

#### 2. API密钥错误

```bash
# 验证API密钥格式
echo $DOUBAO_API_KEY | wc -c  # 检查长度

# 测试API连接
curl -H "Authorization: Bearer $DOUBAO_API_KEY" \
     https://ark.cn-beijing.volces.com/api/v3/models
```

#### 3. CORS配置问题

```bash
# 检查CORS配置
echo $ALLOWED_ORIGINS

# 测试CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:3001/api/upload
```

### 调试工具

```javascript
// 在应用中打印环境变量（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  console.log('Environment variables:', {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    DOUBAO_API_URL: process.env.DOUBAO_API_URL,
    // 不要打印敏感信息如API密钥
  });
}
```

## 配置模板

### 开发环境完整配置

**backend/.env**:
```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 安全配置
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# 豆包API配置
DOUBAO_API_KEY=your_development_api_key_here
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_API_TIMEOUT=30000
DOUBAO_MAX_RETRIES=3

# 文件上传配置
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png
UPLOAD_DIR=./uploads

# 数据库配置
DATABASE_PATH=./data/photo-butler.db

# 调试配置
DEBUG=photo-butler:*
LOG_LEVEL=debug
```

**frontend/.env.local**:
```env
# API配置
NEXT_PUBLIC_API_URL=http://localhost:3001

# 开发配置
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# 功能开关
NEXT_PUBLIC_ENABLE_HISTORY=true
NEXT_PUBLIC_MAX_HISTORY_ITEMS=100
```

### 生产环境完整配置

**backend/.env**:
```env
# 服务器配置
PORT=3001
NODE_ENV=production

# 安全配置
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 豆包API配置
DOUBAO_API_KEY=your_production_api_key_here
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_API_TIMEOUT=30000
DOUBAO_MAX_RETRIES=3

# 文件上传配置
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png
UPLOAD_DIR=/var/www/photo-butler/uploads

# 数据库配置
DATABASE_PATH=/var/www/photo-butler/data/photo-butler.db

# 生产配置
LOG_LEVEL=info
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**frontend/.env.production**:
```env
# API配置
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# 生产配置
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# 功能配置
NEXT_PUBLIC_ENABLE_HISTORY=true
NEXT_PUBLIC_MAX_HISTORY_ITEMS=50
```

---

**注意**: 请根据实际需求调整配置值，并确保在生产环境中使用安全的配置。