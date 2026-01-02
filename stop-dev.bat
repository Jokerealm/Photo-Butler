@echo off
echo ========================================
echo    Photo Butler 停止开发服务器
echo ========================================
echo.

echo [INFO] 停止开发服务器...

REM 停止端口 3000 上的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    if not "%%a"=="0" (
        echo [INFO] 停止前端服务器进程 %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM 停止端口 3001 上的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    if not "%%a"=="0" (
        echo [INFO] 停止后端服务器进程 %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM 停止所有 node.exe 进程（可选，谨慎使用）
REM taskkill /IM node.exe /F >nul 2>&1

echo [SUCCESS] 开发服务器已停止
echo.
pause