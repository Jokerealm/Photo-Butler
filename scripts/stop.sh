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

# 停止开发服务器
stop_servers() {
    log_info "正在停止开发服务器..."
    
    # 停止后端服务器
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            log_info "停止后端服务器 (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            log_success "后端服务器已停止"
        else
            log_warning "后端服务器进程不存在"
        fi
        rm -f logs/backend.pid
    else
        log_warning "未找到后端服务器 PID 文件"
    fi
    
    # 停止前端服务器
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            log_info "停止前端服务器 (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
            log_success "前端服务器已停止"
        else
            log_warning "前端服务器进程不存在"
        fi
        rm -f logs/frontend.pid
    else
        log_warning "未找到前端服务器 PID 文件"
    fi
}

# 强制停止所有相关进程
force_stop() {
    log_info "强制停止所有相关进程..."
    
    # 停止占用端口 3000 的进程
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_info "强制停止占用端口 3000 的进程..."
        lsof -ti:3000 | xargs kill -9
        log_success "端口 3000 已释放"
    fi
    
    # 停止占用端口 3001 的进程
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_info "强制停止占用端口 3001 的进程..."
        lsof -ti:3001 | xargs kill -9
        log_success "端口 3001 已释放"
    fi
    
    # 停止所有 npm run dev 进程
    pkill -f "npm run dev" 2>/dev/null || true
    
    # 停止所有 next dev 进程
    pkill -f "next dev" 2>/dev/null || true
    
    # 停止所有 ts-node-dev 进程
    pkill -f "ts-node-dev" 2>/dev/null || true
}

# 清理临时文件
cleanup_files() {
    log_info "清理临时文件..."
    
    # 清理 PID 文件
    rm -f logs/backend.pid logs/frontend.pid
    
    # 清理开发日志（可选）
    if [ "$1" = "--clean-logs" ]; then
        rm -f logs/backend-dev.log logs/frontend-dev.log
        log_success "开发日志已清理"
    fi
}

# 显示帮助信息
show_help() {
    echo "Photo Butler 开发服务器停止脚本"
    echo
    echo "用法:"
    echo "  ./scripts/stop.sh [选项]"
    echo
    echo "选项:"
    echo "  -f, --force        强制停止所有相关进程"
    echo "  -c, --clean-logs   同时清理开发日志文件"
    echo "  -h, --help         显示此帮助信息"
    echo
    echo "示例:"
    echo "  ./scripts/stop.sh              # 正常停止服务器"
    echo "  ./scripts/stop.sh --force      # 强制停止所有相关进程"
    echo "  ./scripts/stop.sh --clean-logs # 停止服务器并清理日志"
}

# 主函数
main() {
    local force_mode=false
    local clean_logs=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                force_mode=true
                shift
                ;;
            -c|--clean-logs)
                clean_logs=true
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
    echo "    Photo Butler 开发服务器停止脚本"
    echo "=========================================="
    echo
    
    if [ "$force_mode" = true ]; then
        force_stop
    else
        stop_servers
    fi
    
    if [ "$clean_logs" = true ]; then
        cleanup_files --clean-logs
    else
        cleanup_files
    fi
    
    log_success "所有服务器已停止"
}

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 运行主函数
main "$@"