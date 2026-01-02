#!/bin/bash

# Photo Butler 开发服务器停止脚本

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

# 停止服务器
stop_servers() {
    log_info "正在停止开发服务器..."
    
    # 停止后端服务器
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            log_info "停止后端服务器 (PID: $BACKEND_PID)..."
            kill $BACKEND_PID 2>/dev/null || true
            sleep 2
            # 强制杀死如果还在运行
            if kill -0 $BACKEND_PID 2>/dev/null; then
                kill -9 $BACKEND_PID 2>/dev/null || true
            fi
        fi
        rm -f logs/backend.pid
        log_success "后端服务器已停止"
    else
        log_warning "未找到后端服务器进程ID文件"
    fi
    
    # 停止前端服务器
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            log_info "停止前端服务器 (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID 2>/dev/null || true
            sleep 2
            # 强制杀死如果还在运行
            if kill -0 $FRONTEND_PID 2>/dev/null; then
                kill -9 $FRONTEND_PID 2>/dev/null || true
            fi
        fi
        rm -f logs/frontend.pid
        log_success "前端服务器已停止"
    else
        log_warning "未找到前端服务器进程ID文件"
    fi
    
    # 额外清理端口占用
    log_info "清理端口占用..."
    
    # 清理3000端口
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
        lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
    elif command -v netstat >/dev/null 2>&1; then
        # Windows环境下的清理
        local pids_3000=$(netstat -ano 2>/dev/null | grep ":3000 " | awk '{print $5}' | grep -v "0" | sort -u)
        local pids_3001=$(netstat -ano 2>/dev/null | grep ":3001 " | awk '{print $5}' | grep -v "0" | sort -u)
        
        for pid in $pids_3000 $pids_3001; do
            if [ "$pid" != "0" ] && [ ! -z "$pid" ]; then
                if command -v taskkill >/dev/null 2>&1; then
                    taskkill //PID $pid //F 2>/dev/null || true
                else
                    kill -9 $pid 2>/dev/null || true
                fi
            fi
        done
    fi
    
    log_success "所有服务器已停止"
}

# 主函数
main() {
    echo "=========================================="
    echo "    Photo Butler 服务器停止脚本"
    echo "=========================================="
    echo
    
    stop_servers
    
    echo
    log_success "停止完成！"
    echo
    echo "重新启动服务器："
    echo "  ./scripts/dev.sh"
}

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 运行主函数
main