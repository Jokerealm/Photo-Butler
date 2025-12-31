# Generate API Documentation

## POST /api/generate

Generates an AI image based on a reference image, prompt, and template using the Doubao Vision API.

### Request Body

```json
{
  "imageId": "string",     // ID of the uploaded reference image
  "prompt": "string",      // Chinese text prompt for image generation
  "templateId": "string"   // ID of the selected template
}
```

### Response

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "generatedImageUrl": "string",  // URL of the generated image
    "generationId": "string",       // Unique ID for this generation
    "description": "string"         // AI-generated description (optional)
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid parameters
```json
{
  "success": false,
  "error": "缺少有效的图片ID参数" // or other validation error
}
```

**404 Not Found** - Reference image or template not found
```json
{
  "success": false,
  "error": "参考图片不存在，请重新上传" // or template not found
}
```

**500 Internal Server Error** - API call failure
```json
{
  "success": false,
  "error": "图片生成失败" // or specific API error
}
```

**503 Service Unavailable** - Network connection issues
```json
{
  "success": false,
  "error": "网络连接失败，请检查网络连接"
}
```

**504 Gateway Timeout** - Request timeout
```json
{
  "success": false,
  "error": "请求超时，请稍后重试"
}
```

### Example Usage

```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageId: 'abc123',
    prompt: '一幅美丽的风景画，包含山川和河流',
    templateId: 'landscape-template'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Generated image URL:', result.data.generatedImageUrl);
  console.log('AI Description:', result.data.description);
} else {
  console.error('Generation failed:', result.error);
}
```

### Implementation Details

- **Parameter Validation**: All required parameters are validated for presence and type
- **Image Validation**: Checks that the reference image exists in the uploads directory
- **Template Validation**: Verifies that the specified template exists
- **Vision API Integration**: Uses Doubao's vision model to understand reference images
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
- **Logging**: Detailed logging for debugging and monitoring
- **Timeout Handling**: 30-second timeout for API calls with retry logic
- **Security**: Input sanitization and validation to prevent injection attacks

### API Integration Details

The implementation uses the Doubao Vision API with the following format:

```json
{
  "model": "doubao-seed-1-6-251015",
  "max_completion_tokens": 65535,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/reference-image.jpg"
          }
        },
        {
          "type": "text",
          "text": "请基于这张图片，按照以下描述生成一张新的图片：[用户提示词]"
        }
      ]
    }
  ],
  "reasoning_effort": "medium"
}
```

### Important Notes

1. **Image Upload**: Reference images need to be uploaded to a publicly accessible URL for the Doubao API to process them.

2. **Vision vs Generation**: The current Doubao API is primarily for image understanding rather than image generation. For actual image generation, you may need to:
   - Use a dedicated image generation service
   - Combine the vision API output with an image generation model
   - Use the AI description to guide image generation tools

3. **Cloud Storage**: In production, implement proper cloud storage (OSS, COS, etc.) for image hosting.

### Dependencies

- DoubaoAPIClient: Handles communication with the Doubao Vision API
- TemplateService: Manages template data and validation
- File System: Reads reference images from the uploads directory
- Cloud Storage: Required for hosting images accessible to the Doubao API

### Environment Variables Required

- `DOUBAO_API_KEY`: API key for the Doubao service
- `DOUBAO_API_URL`: Base URL for the Doubao API (defaults to https://ark.cn-beijing.volces.com/api/v3)