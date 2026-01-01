# 故障排除指南

本文档提供 Photo Butler 应用常见问题的解决方案和调试方法。

## 目录

- [快速诊断](#快速诊断)
- [前端问题](#前端问题)
- [后端问题](#后端问题)
- [API集成问题](#api集成问题)
- [部署问题](#部署问题)
- [性能问题](#性能问题)
- [安全问题](#安全问题)
- [调试工具](#调试工具)

## 快速诊断

### 系统健康检查

运行以下命令快速检查系统状态：

```bash
# 检查服务状态
curl -f http://localhost:3000 && echo "前端正常" || echo "前端异常"
curl -f http://localhost:3001/api/templates && echo "后端正常" || echo "后端异常"

# 检查进程
ps aux | grep -E "(node|npm)"

# 检查端口占用
netstat -tlnp | grep -E "(3000|3001)"

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 日志快速查看

```bash
# PM2 应用日志
pm2 logs --lines 50

# 系统日志
sudo journalctl -u nginx -f
sudo tail -f /var/log/nginx/error.log

# 应用日志
tail -f backend/logs/*.log
```

## 前端问题

### 1. 页面无法加载

**症状**: 浏览器显示"无法访问此网站"或空白页面

**可能原因**:
- Next.js 开发服务器未启动
- 端口被占用
- 构建失败

**解决方案**:

```bash
# 检查 Next.js 进程
ps aux | grep next

# 检查端口占用
lsof -i :3000

# 重启前端服务
cd frontend
npm run dev

# 如果端口被占用，杀死进程
kill -9 $(lsof -t -i:3000)
```

### 2. API 调用失败

**症状**: 前端显示网络错误或 API 调用超时

**可能原因**:
- 后端服务未启动
- CORS 配置错误
- API URL 配置错误

**解决方案**:

```bash
# 检查后端服务
curl http://localhost:3001/api/templates

# 检查前端环境变量
cat frontend/.env.local
cat frontend/.env

# 检查浏览器控制台
# 打开开发者工具 -> Network 标签页
```

**前端环境变量检查**:

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. 图片上传失败

**症状**: 拖拽或选择文件后没有反应，或显示错误提示

**可能原因**:
- 文件格式不支持
- 文件大小超限
- 前端验证逻辑错误

**调试步骤**:

1. 打开浏览器开发者工具
2. 查看 Console 标签页的错误信息
3. 查看 Network 标签页的请求状态

**解决方案**:

```javascript
// 在浏览器控制台中测试文件验证
const file = document.querySelector('input[type="file"]').files[0];
console.log('文件类型:', file.type);
console.log('文件大小:', file.size);
console.log('是否为图片:', file.type.startsWith('image/'));
```

### 4. 样式显示异常

**症状**: 页面布局混乱，样式不生效

**可能原因**:
- Tailwind CSS 未正确加载
- CSS 文件缓存问题
- 构建配置错误

**解决方案**:

```bash
# 清除 Next.js 缓存
cd frontend
rm -rf .next
npm run dev

# 检查 Tailwind 配置
cat tailwind.config.ts

# 强制刷新浏览器缓存
# Ctrl+Shift+R (Windows/Linux) 或 Cmd+Shift+R (Mac)
```

### 5. 历史记录不显示

**症状**: 历史记录页面为空或显示错误

**可能原因**:
- localStorage 被清空
- 数据格式错误
- 浏览器隐私模式

**调试方案**:

```javascript
// 在浏览器控制台中检查 localStorage
console.log('历史记录:', localStorage.getItem('photo-butler-history'));

// 清空历史记录
localStorage.removeItem('photo-butler-history');

// 检查存储配额
navigator.storage.estimate().then(estimate => {
  console.log('存储使用:', estimate.usage);
  console.log('存储配额:', estimate.quota);
});
```

## 后端问题

### 1. 服务器启动失败

**症状**: `npm run dev` 或 `npm start` 命令失败

**常见错误信息**:
- `Error: listen EADDRINUSE :::3001`
- `Cannot find module`
- `SyntaxError: Unexpected token`

**解决方案**:

```bash
# 端口被占用
lsof -i :3001
kill -9 $(lsof -t -i:3001)

# 依赖缺失
cd backend
rm -rf node_modules package-lock.json
npm install

# TypeScript 编译错误
npm run build
```

### 2. 文件上传失败

**症状**: 上传请求返回 400 或 500 错误

**可能原因**:
- Multer 配置错误
- 文件权限问题
- 磁盘空间不足

**调试步骤**:

```bash
# 检查上传目录权限
ls -la backend/uploads/
chmod 755 backend/uploads/

# 检查磁盘空间
df -h

# 查看后端日志
tail -f backend/logs/info-*.log
```

**Multer 配置检查**:

```javascript
// 在 uploadController.ts 中添加调试日志
console.log('文件信息:', req.file);
console.log('请求体:', req.body);
```

### 3. 数据库连接失败

**症状**: 数据库相关操作失败

**可能原因**:
- SQLite 文件不存在
- 文件权限问题
- 数据库锁定

**解决方案**:

```bash
# 检查数据库文件
ls -la backend/data/
sqlite3 backend/data/photo-butler.db ".tables"

# 重新初始化数据库
cd backend
npm run db:init

# 检查数据库权限
chmod 644 backend/data/photo-butler.db
```

### 4. 内存泄漏

**症状**: 应用运行一段时间后变慢或崩溃

**监控方案**:

```bash
# 使用 PM2 监控内存使用
pm2 monit

# 查看进程内存使用
ps aux | grep node

# 设置内存限制
pm2 start ecosystem.config.js --max-memory-restart 1G
```

**代码优化**:

```javascript
// 及时清理事件监听器
process.on('SIGTERM', () => {
  // 清理资源
  server.close();
});

// 使用流处理大文件
const stream = fs.createReadStream(filePath);
stream.on('end', () => {
  stream.destroy();
});
```

## API集成问题

### 1. 豆包API调用失败

**症状**: 图片生成请求失败，返回认证错误或网络错误

**常见错误**:
- `401 Unauthorized`
- `403 Forbidden`
- `ETIMEDOUT`
- `ECONNREFUSED`

**解决方案**:

```bash
# 检查 API 密钥
grep DOUBAO_API_KEY backend/.env

# 测试网络连接
curl -I https://ark.cn-beijing.volces.com

# 测试 API 调用
curl -X POST https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"doubao-lite-4k","messages":[{"role":"user","content":"test"}]}'
```

**API 密钥验证**:

```javascript
// 在 doubaoAPIClient.ts 中添加调试
console.log('API Key 长度:', this.apiKey?.length);
console.log('API URL:', this.baseUrl);
```

### 2. 请求超时

**症状**: API 调用经常超时

**可能原因**:
- 网络延迟高
- API 服务器负载高
- 超时设置过短

**解决方案**:

```javascript
// 调整超时设置
const client = axios.create({
  timeout: 60000, // 增加到60秒
  retry: 3,
  retryDelay: 1000
});

// 实现重试机制
async function callAPIWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callAPI(params);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. 响应解析错误

**症状**: API 返回数据但解析失败

**调试方案**:

```javascript
// 记录原始响应
console.log('原始响应:', response.data);
console.log('响应头:', response.headers);

// 验证响应格式
if (typeof response.data !== 'object') {
  console.error('响应不是 JSON 格式');
}
```

## 部署问题

### 1. PM2 应用无法启动

**症状**: `pm2 start` 命令失败或应用立即退出

**解决方案**:

```bash
# 查看详细错误信息
pm2 logs --err

# 检查应用配置
pm2 show app-name

# 重置 PM2
pm2 kill
pm2 start ecosystem.config.js

# 检查 Node.js 版本
node --version
npm --version
```

### 2. Nginx 配置错误

**症状**: 502 Bad Gateway 或 404 Not Found

**解决方案**:

```bash
# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查上游服务器状态
curl http://localhost:3000
curl http://localhost:3001

# 重新加载配置
sudo nginx -s reload
```

### 3. SSL 证书问题

**症状**: HTTPS 访问失败或证书警告

**解决方案**:

```bash
# 检查证书有效期
openssl x509 -in /path/to/cert.pem -text -noout | grep -A 2 "Validity"

# 测试 SSL 配置
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# 更新 Let's Encrypt 证书
sudo certbot renew --dry-run
```

### 4. 环境变量未生效

**症状**: 应用使用默认配置而非环境变量

**解决方案**:

```bash
# 检查环境变量文件
cat backend/.env
cat frontend/.env.local

# 验证 PM2 环境变量
pm2 env 0

# 重启应用使环境变量生效
pm2 restart all
```

## 性能问题

### 1. 页面加载缓慢

**症状**: 首次访问或页面切换很慢

**优化方案**:

```bash
# 启用 Nginx gzip 压缩
# 在 nginx.conf 中添加：
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 优化图片
cd image/
for img in *.jpg; do
  convert "$img" -quality 80 -resize 800x600 "optimized_$img"
done
```

**前端优化**:

```javascript
// 使用 Next.js Image 组件
import Image from 'next/image';

// 懒加载组件
const LazyComponent = dynamic(() => import('./Component'), {
  loading: () => <p>Loading...</p>
});
```

### 2. 内存使用过高

**症状**: 服务器内存不足，应用被杀死

**监控和优化**:

```bash
# 监控内存使用
watch -n 1 'free -h && ps aux --sort=-%mem | head -10'

# 设置 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=2048"

# 优化 PM2 配置
pm2 start app.js --max-memory-restart 1G
```

### 3. 磁盘空间不足

**症状**: 文件上传失败，日志写入失败

**清理方案**:

```bash
# 清理临时文件
find uploads/ -type f -mtime +1 -delete

# 清理日志文件
find logs/ -name "*.log" -mtime +7 -delete

# 清理 npm 缓存
npm cache clean --force

# 清理 PM2 日志
pm2 flush
```

## 安全问题

### 1. 文件上传安全

**风险**: 恶意文件上传

**防护措施**:

```javascript
// 严格验证文件类型
const allowedTypes = ['image/jpeg', 'image/png'];
if (!allowedTypes.includes(file.mimetype)) {
  throw new Error('不支持的文件类型');
}

// 验证文件头
const fileSignature = file.buffer.slice(0, 4);
const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
```

### 2. API 密钥泄露

**风险**: API 密钥在代码或日志中暴露

**防护措施**:

```bash
# 检查代码中的敏感信息
grep -r "DOUBAO_API_KEY" . --exclude-dir=node_modules

# 检查日志文件
grep -r "api.*key" logs/

# 使用环境变量
export DOUBAO_API_KEY="your-key-here"
```

### 3. CORS 配置

**风险**: 跨域请求被阻止或过于宽松

**正确配置**:

```javascript
// 严格的 CORS 配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

## 调试工具

### 1. 日志分析

```bash
# 实时查看所有日志
tail -f logs/*.log | grep -E "(ERROR|WARN)"

# 分析错误模式
grep "ERROR" logs/*.log | awk '{print $4}' | sort | uniq -c | sort -nr

# 查看 API 调用统计
grep "POST /api" logs/*.log | wc -l
```

### 2. 性能分析

```bash
# 使用 Node.js 内置分析器
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# 使用 clinic.js
npm install -g clinic
clinic doctor -- node app.js
```

### 3. 网络调试

```bash
# 测试 API 端点
curl -v -X POST http://localhost:3001/api/upload \
  -F "image=@test.jpg"

# 测试 WebSocket 连接（如果使用）
wscat -c ws://localhost:3001

# 网络延迟测试
ping -c 10 ark.cn-beijing.volces.com
```

### 4. 数据库调试

```bash
# SQLite 命令行工具
sqlite3 data/photo-butler.db

# 查看表结构
.schema

# 查看数据
SELECT * FROM users LIMIT 10;

# 分析查询性能
.timer on
SELECT COUNT(*) FROM large_table;
```

## 常用调试命令

### 系统信息

```bash
# 系统资源使用
htop
iotop
nethogs

# 磁盘使用
du -sh * | sort -hr
ncdu

# 网络连接
netstat -tulpn
ss -tulpn
```

### 应用调试

```bash
# Node.js 调试
node --inspect app.js
node --inspect-brk app.js

# PM2 调试
pm2 start app.js --node-args="--inspect"
pm2 logs --raw | grep -E "(ERROR|WARN)"
```

### 数据库调试

```bash
# 备份数据库
cp data/photo-butler.db data/backup-$(date +%Y%m%d).db

# 检查数据库完整性
sqlite3 data/photo-butler.db "PRAGMA integrity_check;"

# 优化数据库
sqlite3 data/photo-butler.db "VACUUM;"
```

## 获取帮助

如果以上解决方案都无法解决问题，请：

1. **收集信息**:
   - 错误日志
   - 系统信息
   - 复现步骤

2. **创建最小复现案例**:
   - 简化问题场景
   - 提供测试数据

3. **联系支持**:
   - 提供详细的错误信息
   - 说明已尝试的解决方案

4. **社区求助**:
   - GitHub Issues
   - Stack Overflow
   - 技术论坛

---

**提示**: 在生产环境中进行任何修改之前，请务必在测试环境中验证解决方案。