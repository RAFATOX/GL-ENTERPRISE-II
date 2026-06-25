@echo off
cd /d "%~dp0"
echo Global Logistic GL 2
echo http://127.0.0.1:4288
node server.js 4288 127.0.0.1
pause
