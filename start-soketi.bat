@echo off
echo ========================================
echo Starting Soketi WebSocket Server
echo ========================================
echo.
echo Soketi will start on:
echo - WebSocket: ws://127.0.0.1:6001
echo - HTTP API:  http://127.0.0.1:9601
echo.
echo Press Ctrl+C to stop Soketi
echo ========================================
echo.

soketi start

pause
