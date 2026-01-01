# 部署指南

本文档详细介绍如何在不同环境中部署 Photo Butler 应用。

## 目录

- [环境要求](#环境要求)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [云服务部署](#云服务部署)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 环境要求

### 系统要求

- **操作系统**: Linux (推荐 Ubuntu 20.04+), macOS, Windows
- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **内存**: 最少 2GB RAM (推荐 4GB+)
- **存储**: 最少 10GB 可用空间
- **网络**: 稳定的互联网连接（访问豆包API）

### 外部服务

- **豆包API**: 需要有效的API密钥
- **域名**: 生产环境需要域名（可选）
- **SSL证书**: HTTPS部署需要（推荐）

## 开发环境部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd photo-butler
```

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量文件
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

编辑 `backend/.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 豆包API配置
DOUBAO_API_KEY=your_actual_api_key_here
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_API_TIMEOUT=30000

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# 安全配置
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. 初始化数据库

```bash
cd backend
npm run db:init
```

### 5. 启动开发服务器

```bash
# 使用启动脚本
./scripts/dev.sh

# 或手动启动
cd backend && npm run dev &
cd frontend && npm run dev &
```

### 6. 验证部署

访问 http://localhost:3000 确认应用正常运行。

## 生产环境部署

### 1. 服务器准备

#### Ubuntu/Debian 系统

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 (进程管理器)
sudo npm install -g pm2

# 安装 Nginx (反向代理)
sudo apt install nginx -y

# 安装防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

#### CentOS/RHEL 系统

```bash
# 更新系统
sudo yum update -y

# 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo yum install nginx -y

# 配置防火墙
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 部署应用

```bash
# 创建应用目录
sudo mkdir -p /var/www/photo-butler
sudo chown $USER:$USER /var/www/photo-butler

# 克隆代码
cd /var/www/photo-butler
git clone <repository-url> .

# 安装依赖
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. 配置生产环境变量

创建 `backend/.env.production`:

```env
# 服务器配置
PORT=3001
NODE_ENV=production

# 豆包API配置
DOUBAO_API_KEY=your_production_api_key
DOUBAO_API_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_API_TIMEOUT=30000

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/photo-butler/uploads

# 安全配置
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 数据库配置
DATABASE_PATH=/var/www/photo-butler/data/photo-butler.db
```

创建 `frontend/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### 4. 构建应用

```bash
# 构建后端
cd backend
npm run build

# 构建前端
cd ../frontend
npm run build
```

### 5. 配置 PM2

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'photo-butler-backend',
      script: './backend/dist/index.js',
      cwd: '/var/www/photo-butler',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'photo-butler-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/photo-butler/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
```

启动应用：

```bash
# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 6. 配置 Nginx

创建 `/etc/nginx/sites-available/photo-butler`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL 配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # 文件上传大小限制
    client_max_body_size 10M;
    
    # 前端应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API 路由
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # API 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 上传文件访问
    location /uploads/ {
        alias /var/www/photo-butler/uploads/;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # 模板图片访问
    location /image/ {
        alias /var/www/photo-butler/image/;
        expires 1d;
        add_header Cache-Control "public";
    }
}
```

启用站点：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/photo-butler /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 7. 配置 SSL 证书

#### 使用 Let's Encrypt (免费)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 使用自签名证书 (开发/测试)

```bash
# 创建证书目录
sudo mkdir -p /etc/nginx/ssl

# 生成自签名证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/photo-butler.key \
    -out /etc/nginx/ssl/photo-butler.crt
```

### 8. 设置定时任务

创建清理脚本 `/var/www/photo-butler/scripts/cleanup.sh`:

```bash
#!/bin/bash

# 清理24小时前的临时文件
find /var/www/photo-butler/uploads -type f -mtime +1 -delete

# 清理日志文件（保留30天）
find /var/www/photo-butler/logs -name "*.log" -mtime +30 -delete

# 重启 PM2 应用（每周）
if [ $(date +%u) -eq 1 ]; then
    pm2 restart all
fi
```

设置定时任务：

```bash
# 使脚本可执行
chmod +x /var/www/photo-butler/scripts/cleanup.sh

# 添加到 crontab
crontab -e
# 添加以下行：
# 0 2 * * * /var/www/photo-butler/scripts/cleanup.sh
```

## Docker 部署

### 1. 创建 Dockerfile

后端 `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置权限
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3001

CMD ["npm", "start"]
```

前端 `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产镜像
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 复制构建结果
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DOUBAO_API_KEY=${DOUBAO_API_KEY}
      - DOUBAO_API_URL=${DOUBAO_API_URL}
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  uploads:
  data:
  logs:
```

### 3. 部署命令

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 更新服务
docker-compose pull
docker-compose up -d --build
```

## 云服务部署

### AWS 部署

#### 使用 EC2

1. **创建 EC2 实例**
   - 选择 Ubuntu 20.04 LTS
   - 实例类型：t3.medium 或更高
   - 配置安全组：开放 80, 443, 22 端口

2. **配置域名和 SSL**
   - 使用 Route 53 配置域名
   - 使用 Certificate Manager 申请 SSL 证书

3. **部署应用**
   - 按照生产环境部署步骤操作

#### 使用 ECS (容器服务)

1. **创建 ECS 集群**
2. **构建并推送 Docker 镜像到 ECR**
3. **创建任务定义**
4. **配置 Application Load Balancer**
5. **部署服务**

### 阿里云部署

#### 使用 ECS

1. **创建 ECS 实例**
   - 选择 Ubuntu 20.04
   - 规格：2核4GB 或更高
   - 配置安全组

2. **配置域名**
   - 使用阿里云域名服务
   - 申请 SSL 证书

3. **部署应用**
   - 按照生产环境部署步骤操作

### Vercel 部署 (仅前端)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署前端
cd frontend
vercel --prod
```

配置环境变量：
- `NEXT_PUBLIC_API_URL`: 后端API地址

## 监控和维护

### 1. 应用监控

#### PM2 监控

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs

# 查看资源使用
pm2 monit

# 重启应用
pm2 restart all
```

#### 系统监控

```bash
# 安装监控工具
sudo apt install htop iotop nethogs -y

# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 2. 日志管理

#### 配置日志轮转

创建 `/etc/logrotate.d/photo-butler`:

```
/var/www/photo-butler/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. 备份策略

#### 数据备份脚本

创建 `/var/www/photo-butler/scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/photo-butler"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp /var/www/photo-butler/data/photo-butler.db $BACKUP_DIR/db_$DATE.db

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/photo-butler/uploads

# 清理30天前的备份
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

设置定时备份：

```bash
# 添加到 crontab
crontab -e
# 添加以下行：
# 0 3 * * * /var/www/photo-butler/scripts/backup.sh
```

### 4. 性能优化

#### Nginx 优化

```nginx
# 在 http 块中添加
worker_processes auto;
worker_connections 1024;

# 启用 gzip 压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# 缓存配置
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;
```

#### Node.js 优化

```javascript
// 在应用启动时设置
process.env.UV_THREADPOOL_SIZE = 128;
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
```

## 故障排除

### 常见问题

#### 1. 应用无法启动

```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :3001

# 检查 PM2 状态
pm2 status
pm2 logs

# 检查环境变量
pm2 env 0
```

#### 2. Nginx 配置错误

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载配置
sudo nginx -s reload
```

#### 3. SSL 证书问题

```bash
# 检查证书有效期
openssl x509 -in /path/to/certificate.crt -text -noout

# 测试 SSL 配置
openssl s_client -connect yourdomain.com:443
```

#### 4. 数据库连接问题

```bash
# 检查数据库文件权限
ls -la /var/www/photo-butler/data/

# 测试数据库连接
sqlite3 /var/www/photo-butler/data/photo-butler.db ".tables"
```

#### 5. API 调用失败

```bash
# 检查网络连接
curl -I https://ark.cn-beijing.volces.com

# 检查 API 密钥
grep DOUBAO_API_KEY /var/www/photo-butler/backend/.env

# 查看 API 调用日志
pm2 logs photo-butler-backend | grep -i doubao
```

### 紧急恢复

#### 快速回滚

```bash
# 停止当前版本
pm2 stop all

# 恢复到上一个版本
git checkout HEAD~1

# 重新构建
cd backend && npm run build
cd ../frontend && npm run build

# 重启应用
pm2 restart all
```

#### 数据恢复

```bash
# 恢复数据库
cp /var/backups/photo-butler/db_YYYYMMDD_HHMMSS.db /var/www/photo-butler/data/photo-butler.db

# 恢复上传文件
tar -xzf /var/backups/photo-butler/uploads_YYYYMMDD_HHMMSS.tar.gz -C /
```

## 安全检查清单

- [ ] 更新所有系统包
- [ ] 配置防火墙规则
- [ ] 使用 HTTPS
- [ ] 设置强密码策略
- [ ] 定期备份数据
- [ ] 监控异常访问
- [ ] 更新 SSL 证书
- [ ] 检查文件权限
- [ ] 审查日志文件
- [ ] 更新依赖包

## 联系支持

如果在部署过程中遇到问题，请：

1. 查看相关日志文件
2. 检查配置文件
3. 参考故障排除部分
4. 联系技术支持团队

---

**注意**: 本指南假设您具有基本的 Linux 系统管理经验。如果您是初学者，建议先在测试环境中练习部署流程。