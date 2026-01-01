# API 文档

Photo Butler 后端API提供图片上传、模板管理、AI图片生成和下载功能。

## 基础信息

- **Base URL**: `http://localhost:3001` (开发环境)
- **Content-Type**: `application/json` (除文件上传外)
- **超时时间**: 30秒

## 认证

当前版本不需要认证。未来版本将支持API密钥认证。

## 错误响应格式

所有API错误响应遵循统一格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

### HTTP状态码

- `200` - 请求成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `413` - 文件过大
- `415` - 不支持的媒体类型
- `500` - 服务器内部错误
- `504` - 网关超时（API调用超时）

## API端点

### 1. 图片上传

上传参考图片用于AI生成。

**端点**: `POST /api/upload`

**请求格式**: `multipart/form-data`

**请求参数**:
- `image` (File, 必需) - 图片文件，支持JPG/PNG格式，最大10MB

**请求示例**:
```javascript
const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "imageId": "uuid-string",
    "imageUrl": "/uploads/uuid-string.jpg"
  }
}
```

**错误响应**:
- `400` - 文件格式不支持或参数错误
- `413` - 文件大小超过限制
- `500` - 服务器错误

### 2. 获取模板列表

获取所有可用的艺术风格模板。

**端点**: `GET /api/templates`

**请求参数**: 无

**请求示例**:
```javascript
const response = await fetch('/api/templates');
const data = await response.json();
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template-1",
        "name": "水彩画风格",
        "previewUrl": "/image/水彩画风格.jpg",
        "prompt": "水彩画风格，柔和色彩，艺术感强"
      },
      {
        "id": "template-2", 
        "name": "油画风格",
        "previewUrl": "/image/油画风格.jpg",
        "prompt": "油画风格，厚重笔触，经典艺术"
      }
    ]
  }
}
```

**错误响应**:
- `500` - 服务器错误

### 3. 生成AI图片

基于上传的参考图片和提示词生成AI艺术图片。

**端点**: `POST /api/generate`

**请求格式**: `application/json`

**请求参数**:
- `imageId` (string, 必需) - 上传图片的ID
- `prompt` (string, 必需) - 生成提示词
- `templateId` (string, 必需) - 模板ID

**请求示例**:
```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageId: 'uuid-string',
    prompt: '水彩画风格，柔和色彩，艺术感强',
    templateId: 'template-1'
  })
});
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "generatedImageUrl": "/uploads/generated-uuid.jpg",
    "generationId": "generation-uuid"
  }
}
```

**错误响应**:
- `400` - 请求参数错误或缺失
- `404` - 参考图片不存在
- `500` - 服务器错误或AI生成失败
- `504` - API调用超时

### 4. 下载图片

下载生成的AI图片。

**端点**: `GET /api/download/:imageId`

**请求参数**:
- `imageId` (string, 路径参数) - 图片ID

**请求示例**:
```javascript
// 直接访问URL或使用fetch
const response = await fetch(`/api/download/${imageId}`);
const blob = await response.blob();
```

**成功响应** (200):
- **Content-Type**: `image/jpeg` 或 `image/png`
- **Content-Disposition**: `attachment; filename="generated-image.jpg"`
- **Body**: 图片二进制数据

**错误响应**:
- `404` - 图片不存在
- `500` - 服务器错误

## 数据模型

### Template (模板)

```typescript
interface Template {
  id: string;              // 唯一标识符
  name: string;            // 模板名称
  previewUrl: string;      // 预览图URL
  prompt: string;          // 提示词内容
}
```

### UploadResponse (上传响应)

```typescript
interface UploadResponse {
  success: boolean;
  data: {
    imageId: string;       // 图片唯一ID
    imageUrl: string;      // 图片访问URL
  };
}
```

### GenerateRequest (生成请求)

```typescript
interface GenerateRequest {
  imageId: string;         // 参考图片ID
  prompt: string;          // 生成提示词
  templateId: string;      // 模板ID
}
```

### GenerateResponse (生成响应)

```typescript
interface GenerateResponse {
  success: boolean;
  data: {
    generatedImageUrl: string;  // 生成图片URL
    generationId: string;       // 生成任务ID
  };
}
```

## 使用示例

### 完整的图片生成流程

```javascript
// 1. 上传参考图片
const uploadFormData = new FormData();
uploadFormData.append('image', referenceImageFile);

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: uploadFormData
});
const uploadData = await uploadResponse.json();

if (!uploadData.success) {
  throw new Error(uploadData.error);
}

// 2. 获取模板列表
const templatesResponse = await fetch('/api/templates');
const templatesData = await templatesResponse.json();

// 3. 选择模板并生成图片
const generateResponse = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageId: uploadData.data.imageId,
    prompt: templatesData.data.templates[0].prompt,
    templateId: templatesData.data.templates[0].id
  })
});
const generateData = await generateResponse.json();

if (!generateData.success) {
  throw new Error(generateData.error);
}

// 4. 下载生成的图片
const downloadUrl = `/api/download/${generateData.data.generationId}`;
window.open(downloadUrl, '_blank');
```

## 错误处理

### 客户端错误处理示例

```javascript
async function handleApiCall(apiCall) {
  try {
    const response = await apiCall();
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    if (error.name === 'TypeError') {
      // 网络错误
      throw new Error('网络连接失败，请检查网络');
    } else if (error.message.includes('timeout')) {
      // 超时错误
      throw new Error('请求超时，请稍后重试');
    } else {
      // 其他错误
      throw error;
    }
  }
}
```

## 限制和约束

### 文件上传限制
- **支持格式**: JPG, PNG
- **最大文件大小**: 10MB
- **并发上传**: 单个用户同时最多1个上传任务

### API调用限制
- **超时时间**: 30秒
- **重试次数**: 最多3次
- **并发生成**: 单个用户同时最多1个生成任务

### 存储限制
- **临时文件**: 24小时后自动清理
- **历史记录**: 存储在客户端localStorage

## 开发和调试

### 启用调试日志

在后端 `.env` 文件中设置：

```env
NODE_ENV=development
```

### API测试工具

推荐使用以下工具测试API：

- **Postman** - GUI工具
- **curl** - 命令行工具
- **Thunder Client** - VS Code扩展

### curl示例

```bash
# 获取模板列表
curl -X GET http://localhost:3001/api/templates

# 上传图片
curl -X POST \
  -F "image=@/path/to/image.jpg" \
  http://localhost:3001/api/upload

# 生成图片
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"imageId":"uuid","prompt":"水彩画风格","templateId":"template-1"}' \
  http://localhost:3001/api/generate
```

## 版本历史

- **v1.0.0** - 初始版本，基础功能完整
  - 图片上传和下载
  - 模板管理
  - AI图片生成
  - 错误处理和日志

## 未来计划

- **v1.1.0** - 用户认证和授权
- **v1.2.0** - 批量处理功能
- **v1.3.0** - 高级模板和自定义风格