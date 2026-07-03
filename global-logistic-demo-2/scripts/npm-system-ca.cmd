@echo off
setlocal
set "NODE_OPTIONS=--use-system-ca %NODE_OPTIONS%"
npm.cmd %*
