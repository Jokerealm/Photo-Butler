@echo off
echo ========================================
echo    Photo Butler 开发环境启动脚本
echo ========================================
echo.

REM 检查是否在项目根目录
if not exist "package.json" (
    echo [ERROR] 请在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "backend" (
    echo [ERROR] backend 目录不存在
    pause
    exit /b 1
)

if not exist "frontend" (
    echo [ERROR] frontend 目录不存在
    pause
    exit /b 1
)

echo [INFO] 检查并清理端口...

REM 清理端口 3000 和 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    if not "%%a"=="0" (
        echo [INFO] 清理端口 3000 上的进程 %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    if not "%%a"=="0" (
        echo [INFO] 清理端口 3001 上的进程 %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)

timeout /t 2 /nobreak >nul

echo [INFO] 创建必要的目录...
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "backend\data" mkdir "backend\data"
if not exist "backend\logs" mkdir "backend\logs"
if not exist "logs" mkdir "logs"

echo [INFO] 启动后端服务器 (端口 3001)...
cd backend
start "Photo Butler Backend" cmd /k "set PORT=3001 && npm run dev"
cd ..

echo [INFO] 等待后端服务器启动...
timeout /t 5 /nobreak >nul

echo [INFO] 启动前端服务器 (端口 3000)...
cd frontend
start "Photo Butler Frontend" cmd /k "set PORT=3000 && npm run dev"
cd ..

echo.
echo [SUCCESS] 开发服务器启动完成！
echo.
echo 访问地址：
echo   前端应用: http://localhost:3000
echo   后端API:  http://localhost:3001
echo.
echo 停止服务器：关闭对应的命令行窗口或按 Ctrl+C
echo.
pause