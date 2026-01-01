#!/bin/bash

# Photo Butler 生产构建脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Node.js 版本
check_node_version() {
    log_info "检查 Node.js 版本..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18.0.0 或更高版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        log_error "Node.js 版本过低，当前版本: $NODE_VERSION，需要: $REQUIRED_VERSION 或更高"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: $NODE_VERSION"
}

# 清理旧的构建文件
clean_build() {
    log_info "清理旧的构建文件..."
    
    # 清理后端构建文件
    if [ -d "backend/dist" ]; then
        rm -rf backend/dist
        log_info "已清理后端构建文件"
    fi
    
    # 清理前端构建文件
    if [ -d "frontend/.next" ]; then
        rm -rf frontend/.next
        log_info "已清理前端构建文件"
    fi
    
    log_success "构建文件清理完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    cd backend
    npm ci --only=production
    cd ..
    log_success "后端依赖安装完成"
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    cd frontend
    npm ci
    cd ..
    log_success "前端依赖安装完成"
}

# 运行代码检查
run_linting() {
    log_info "运行代码检查..."
    
    # 后端代码检查
    log_info "检查后端代码..."
    cd backend
    if npm run lint; then
        log_success "后端代码检查通过"
    else
        log_error "后端代码检查失败"
        exit 1
    fi
    cd ..
    
    # 前端代码检查
    log_info "检查前端代码..."
    cd frontend
    if npm run lint; then
        log_success "前端代码检查通过"
    else
        log_error "前端代码检查失败"
        exit 1
    fi
    cd ..
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    # 后端测试
    log_info "运行后端测试..."
    cd backend
    if npm test; then
        log_success "后端测试通过"
    else
        log_error "后端测试失败"
        exit 1
    fi
    cd ..
    
    # 前端测试
    log_info "运行前端测试..."
    cd frontend
    if npm test; then
        log_success "前端测试通过"
    else
        log_error "前端测试失败"
        exit 1
    fi
    cd ..
}

# 构建后端
build_backend() {
    log_info "构建后端应用..."
    
    cd backend
    
    # TypeScript 编译
    if npm run build; then
        log_success "后端构建完成"
    else
        log_error "后端构建失败"
        exit 1
    fi
    
    # 验证构建结果
    if [ ! -f "dist/index.js" ]; then
        log_error "后端构建文件不存在"
        exit 1
    fi
    
    cd ..
}

# 构建前端
build_frontend() {
    log_info "构建前端应用..."
    
    cd frontend
    
    # Next.js 构建
    if npm run build; then
        log_success "前端构建完成"
    else
        log_error "前端构建失败"
        exit 1
    fi
    
    # 验证构建结果
    if [ ! -d ".next" ]; then
        log_error "前端构建文件不存在"
        exit 1
    fi
    
    cd ..
}

# 创建生产环境目录结构
create_production_structure() {
    log_info "创建生产环境目录结构..."
    
    # 创建必要的目录
    mkdir -p dist/backend
    mkdir -p dist/frontend
    mkdir -p dist/uploads
    mkdir -p dist/data
    mkdir -p dist/logs
    mkdir -p dist/image
    mkdir -p dist/prompt
    
    log_success "生产环境目录结构创建完成"
}

# 复制构建文件
copy_build_files() {
    log_info "复制构建文件..."
    
    # 复制后端构建文件
    cp -r backend/dist/* dist/backend/
    cp backend/package.json dist/backend/
    cp backend/package-lock.json dist/backend/
    
    # 复制前端构建文件
    cp -r frontend/.next dist/frontend/
    cp frontend/package.json dist/frontend/
    cp frontend/package-lock.json dist/frontend/
    cp frontend/next.config.ts dist/frontend/
    
    # 复制静态资源
    if [ -d "image" ]; then
        cp -r image/* dist/image/
    fi
    
    if [ -d "prompt" ]; then
        cp -r prompt/* dist/prompt/
    fi
    
    # 复制配置文件
    cp .env.example dist/
    cp backend/.env.example dist/backend/
    cp frontend/.env.example dist/frontend/
    
    log_success "构建文件复制完成"
}

# 安装生产依赖
install_production_dependencies() {
    log_info "安装生产环境依赖..."
    
    # 后端生产依赖
    cd dist/backend
    npm ci --only=production
    cd ../..
    
    # 前端生产依赖
    cd dist/frontend
    npm ci --only=production
    cd ../..
    
    log_success "生产环境依赖安装完成"
}

# 创建启动脚本
create_startup_scripts() {
    log_info "创建启动脚本..."
    
    # 创建生产环境启动脚本
    cat > dist/start.sh << 'EOF'
#!/bin/bash

# Photo Butler 生产环境启动脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查环境变量
if [ ! -f "backend/.env" ]; then
    echo "错误: backend/.env 文件不存在"
    echo "请复制 backend/.env.example 并配置相应的环境变量"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    echo "错误: frontend/.env.production 文件不存在"
    echo "请复制 frontend/.env.example 并配置相应的环境变量"
    exit 1
fi

# 创建必要的目录
mkdir -p uploads data logs

# 启动后端服务器
log_info "启动后端服务器..."
cd backend
NODE_ENV=production npm start &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 5

# 启动前端服务器
log_info "启动前端服务器..."
cd frontend
NODE_ENV=production npm start &
FRONTEND_PID=$!
cd ..

# 保存进程ID
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

log_success "应用启动完成!"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:3001"

# 等待进程结束
wait
EOF

    chmod +x dist/start.sh
    
    # 创建停止脚本
    cat > dist/stop.sh << 'EOF'
#!/bin/bash

# Photo Butler 生产环境停止脚本

if [ -f "logs/backend.pid" ]; then
    kill $(cat logs/backend.pid) 2>/dev/null || true
    rm -f logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null || true
    rm -f logs/frontend.pid
fi

echo "应用已停止"
EOF

    chmod +x dist/stop.sh
    
    log_success "启动脚本创建完成"
}

# 创建部署包
create_deployment_package() {
    log_info "创建部署包..."
    
    # 创建版本信息
    cat > dist/VERSION << EOF
Photo Butler v1.0.0
构建时间: $(date)
Git 提交: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
Node.js 版本: $(node -v)
EOF
    
    # 创建 README
    cat > dist/README.md << 'EOF'
# Photo Butler 生产环境部署包

## 快速启动

1. 配置环境变量:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.production
   ```

2. 编辑环境变量文件，配置 API 密钥等

3. 启动应用:
   ```bash
   ./start.sh
   ```

4. 停止应用:
   ```bash
   ./stop.sh
   ```

## 目录结构

- `backend/` - 后端应用
- `frontend/` - 前端应用
- `uploads/` - 文件上传目录
- `data/` - 数据库文件
- `logs/` - 日志文件
- `image/` - 模板图片
- `prompt/` - 提示词配置

## 端口

- 前端: 3000
- 后端: 3001

## 更多信息

请参考项目文档。
EOF
    
    # 创建压缩包
    tar -czf photo-butler-production-$(date +%Y%m%d-%H%M%S).tar.gz -C dist .
    
    log_success "部署包创建完成: photo-butler-production-$(date +%Y%m%d-%H%M%S).tar.gz"
}

# 显示构建信息
show_build_info() {
    echo
    echo "=========================================="
    echo "           构建信息"
    echo "=========================================="
    echo "构建时间: $(date)"
    echo "Node.js 版本: $(node -v)"
    echo "npm 版本: $(npm -v)"
    echo "Git 提交: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
    echo
    echo "构建文件位置: ./dist/"
    echo "部署包: photo-butler-production-*.tar.gz"
    echo
    echo "下一步:"
    echo "1. 将部署包上传到生产服务器"
    echo "2. 解压并配置环境变量"
    echo "3. 运行 ./start.sh 启动应用"
    echo "=========================================="
}

# 显示帮助信息
show_help() {
    echo "Photo Butler 生产构建脚本"
    echo
    echo "用法:"
    echo "  ./scripts/build.sh [选项]"
    echo
    echo "选项:"
    echo "  --skip-tests    跳过测试"
    echo "  --skip-lint     跳过代码检查"
    echo "  --clean         清理旧的构建文件"
    echo "  -h, --help      显示此帮助信息"
    echo
    echo "示例:"
    echo "  ./scripts/build.sh              # 完整构建"
    echo "  ./scripts/build.sh --skip-tests # 跳过测试的构建"
    echo "  ./scripts/build.sh --clean      # 清理并构建"
}

# 主函数
main() {
    local skip_tests=false
    local skip_lint=false
    local clean_build_flag=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-lint)
                skip_lint=true
                shift
                ;;
            --clean)
                clean_build_flag=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    echo "=========================================="
    echo "      Photo Butler 生产构建脚本"
    echo "=========================================="
    echo
    
    check_node_version
    
    if [ "$clean_build_flag" = true ]; then
        clean_build
    fi
    
    install_dependencies
    
    if [ "$skip_lint" = false ]; then
        run_linting
    else
        log_warning "跳过代码检查"
    fi
    
    if [ "$skip_tests" = false ]; then
        run_tests
    else
        log_warning "跳过测试"
    fi
    
    build_backend
    build_frontend
    create_production_structure
    copy_build_files
    install_production_dependencies
    create_startup_scripts
    create_deployment_package
    
    log_success "构建完成！"
    show_build_info
}

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 运行主函数
main "$@"