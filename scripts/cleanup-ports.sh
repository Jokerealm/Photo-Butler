#!/bin/bash

# 端口清理脚本
# 用于清理被占用的开发端口

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

# 清理指定端口
cleanup_port() {
    local port=$1
    local service_name=$2
    
    log_info "检查端口 $port ($service_name)..."
    
    if command -v lsof >/dev/null 2>&1; then
        # 使用 lsof (Linux/macOS)
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "端口 $port 被占用"
            local pids=$(lsof -ti:$port)
            for pid in $pids; do
                log_info "终止进程 $pid (端口 $port)"
                kill -9 $pid 2>/dev/null || true
            done
            log_success "端口 $port 已清理"
        else
            log_success "端口 $port 空闲"
        fi
    elif command -v netstat >/dev/null 2>&1; then
        # 使用 netstat (Windows/Linux)
        local pids=$(netstat -ano | grep ":$port " | awk '{print $5}' | sort -u)
        if [ ! -z "$pids" ]; then
            log_warning "端口 $port 被占用"
            for pid in $pids; do
                if [ "$pid" != "0" ] && [ ! -z "$pid" ]; then
                    log_info "终止进程 $pid (端口 $port)"
                    if command -v taskkill >/dev/null 2>&1; then
                        taskkill /PID $pid /F 2>/dev/null || true
                    else
                        kill -9 $pid 2>/dev/null || true
                    fi
                fi
            done
            log_success "端口 $port 已清理"
        else
            log_success "端口 $port 空闲"
        fi
    else
        log_warning "无法检查端口状态，跳过端口 $port"
    fi
}

# 主函数
main() {
    echo "=========================================="
    echo "    Photo Butler 端口清理脚本"
    echo "=========================================="
    echo
    
    # 清理前端端口 3000
    cleanup_port 3000 "前端服务"
    
    # 清理后端端口 3001
    cleanup_port 3001 "后端服务"
    
    # 等待端口释放
    log_info "等待端口释放..."
    sleep 2
    
    log_success "端口清理完成！"
    echo
    echo "现在可以启动开发服务器："
    echo "  ./scripts/dev.sh"
}

# 运行主函数
main