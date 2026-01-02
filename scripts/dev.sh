#!/bin/bash

# Photo Butler 开发环境启动脚本
# 用于同时启动前端和后端开发服务器

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

# 检查依赖是否已安装
check_dependencies() {
    log_info "检查项目依赖..."
    
    # 检查后端依赖
    if [ ! -d "backend/node_modules" ]; then
        log_warning "后端依赖未安装，正在安装..."
        cd backend
        npm install
        cd ..
        log_success "后端依赖安装完成"
    fi
    
    # 检查前端依赖
    if [ ! -d "frontend/node_modules" ]; then
        log_warning "前端依赖未安装，正在安装..."
        cd frontend
        npm install
        cd ..
        log_success "前端依赖安装完成"
    fi
    
    # 检查根目录依赖（E2E测试）
    if [ ! -d "node_modules" ]; then
        log_warning "根目录依赖未安装，正在安装..."
        npm install
        log_success "根目录依赖安装完成"
    fi
}

# 检查环境变量文件
check_env_files() {
    log_info "检查环境变量配置..."
    
    # 检查后端环境变量
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            log_warning "后端 .env 文件不存在，从示例文件复制..."
            cp backend/.env.example backend/.env
            log_warning "请编辑 backend/.env 文件，配置豆包API密钥"
        else
            log_error "backend/.env.example 文件不存在"
            exit 1
        fi
    fi
    
    # 检查前端环境变量
    if [ ! -f "frontend/.env.local" ] && [ ! -f "frontend/.env" ]; then
        if [ -f "frontend/.env.example" ]; then
            log_warning "前端环境变量文件不存在，从示例文件复制..."
            cp frontend/.env.example frontend/.env.local
        else
            log_error "frontend/.env.example 文件不存在"
            exit 1
        fi
    fi
    
    log_success "环境变量配置检查完成"
}

# 检查端口是否被占用
check_ports() {
    log_info "检查端口占用情况..."
    
    # 自动清理端口
    log_info "自动清理开发端口..."
    
    # 清理前端端口 3000
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "端口 3000 已被占用，正在清理..."
            lsof -ti:3000 | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
    elif command -v netstat >/dev/null 2>&1; then
        local pids=$(netstat -ano 2>/dev/null | grep ":3000 " | awk '{print $5}' | grep -v "0" | sort -u)
        if [ ! -z "$pids" ]; then
            log_warning "端口 3000 已被占用，正在清理..."
            for pid in $pids; do
                if [ "$pid" != "0" ] && [ ! -z "$pid" ]; then
                    if command -v taskkill >/dev/null 2>&1; then
                        taskkill //PID $pid //F 2>/dev/null || true
                    else
                        kill -9 $pid 2>/dev/null || true
                    fi
                fi
            done
            sleep 1
        fi
    fi
    
    # 清理后端端口 3001
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "端口 3001 已被占用，正在清理..."
            lsof -ti:3001 | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
    elif command -v netstat >/dev/null 2>&1; then
        local pids=$(netstat -ano 2>/dev/null | grep ":3001 " | awk '{print $5}' | grep -v "0" | sort -u)
        if [ ! -z "$pids" ]; then
            log_warning "端口 3001 已被占用，正在清理..."
            for pid in $pids; do
                if [ "$pid" != "0" ] && [ ! -z "$pid" ]; then
                    if command -v taskkill >/dev/null 2>&1; then
                        taskkill //PID $pid //F 2>/dev/null || true
                    else
                        kill -9 $pid 2>/dev/null || true
                    fi
                fi
            done
            sleep 1
        fi
    fi
    
    log_success "端口清理完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p backend/uploads
    mkdir -p backend/data
    mkdir -p backend/logs
    
    log_success "目录创建完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    if [ ! -f "backend/data/photo-butler.db" ]; then
        cd backend
        npm run db:init
        cd ..
        log_success "数据库初始化完成"
    else
        log_info "数据库已存在，跳过初始化"
    fi
}

# 启动开发服务器
start_servers() {
    log_info "启动开发服务器..."
    
    # 创建日志目录
    mkdir -p logs
    
    # 确保端口可用
    log_info "最终检查端口可用性..."
    sleep 2
    
    # 启动后端服务器
    log_info "启动后端服务器 (端口 3001)..."
    cd backend
    
    # 设置端口环境变量
    export PORT=3001
    
    npm run dev > ../logs/backend-dev.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    log_info "等待后端服务器启动..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            log_success "后端服务器启动成功 (http://localhost:3001)"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "后端服务器启动超时"
            kill $BACKEND_PID 2>/dev/null || true
            exit 1
        fi
        sleep 1
    done
    
    # 启动前端服务器
    log_info "启动前端服务器 (端口 3000)..."
    cd frontend
    
    # 设置端口环境变量，强制使用3000端口
    export PORT=3000
    
    npm run dev > ../logs/frontend-dev.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # 等待前端启动
    log_info "等待前端服务器启动..."
    for i in {1..30}; do
        # 检查3000端口或其他可能的端口
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            log_success "前端服务器启动成功 (http://localhost:3000)"
            FRONTEND_URL="http://localhost:3000"
            break
        elif curl -s http://localhost:3003 > /dev/null 2>&1; then
            log_warning "前端服务器在端口 3003 启动 (端口 3000 可能仍被占用)"
            FRONTEND_URL="http://localhost:3003"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "前端服务器启动超时"
            kill $FRONTEND_PID 2>/dev/null || true
            kill $BACKEND_PID 2>/dev/null || true
            exit 1
        fi
        sleep 1
    done
    
    # 保存进程ID
    echo $BACKEND_PID > logs/backend.pid
    echo $FRONTEND_PID > logs/frontend.pid
    
    log_success "所有服务器启动完成！"
    echo
    echo "访问地址："
    echo "  前端应用: ${FRONTEND_URL:-http://localhost:3000}"
    echo "  后端API:  http://localhost:3001"
    echo
    echo "日志文件："
    echo "  后端日志: logs/backend-dev.log"
    echo "  前端日志: logs/frontend-dev.log"
    echo
    echo "停止服务器："
    echo "  运行: ./scripts/stop.sh"
    echo "  或按 Ctrl+C"
}

# 清理函数
cleanup() {
    log_info "正在停止服务器..."
    
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm -f logs/backend.pid
    fi
    
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm -f logs/frontend.pid
    fi
    
    log_success "服务器已停止"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    echo "=========================================="
    echo "    Photo Butler 开发环境启动脚本"
    echo "=========================================="
    echo
    
    check_node_version
    check_dependencies
    check_env_files
    check_ports
    create_directories
    init_database
    start_servers
    
    # 保持脚本运行
    log_info "开发服务器正在运行，按 Ctrl+C 停止"
    while true; do
        sleep 1
    done
}

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 运行主函数
main