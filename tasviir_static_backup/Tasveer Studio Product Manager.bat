@echo off
title Tasveer Studio - Master Product Manager
cd /d "%~dp0"

:: 1. Auto-detect studio-manager.html location (Same folder, subfolder, or project)
set "APP_FILE=%~dp0studio-manager.html"
if not exist "%APP_FILE%" set "APP_FILE=%~dp0project codding\website\studio-manager.html"
if not exist "%APP_FILE%" set "APP_FILE=%~dp0website\studio-manager.html"
if not exist "%APP_FILE%" set "APP_FILE=C:\Users\i7-14\Desktop\project codding\website\studio-manager.html"

:: 2. Launch with Chrome or Edge or default browser
start "" chrome.exe --app="file:///%APP_FILE%" --window-size=1450,920 2>nul
if %ERRORLEVEL% NEQ 0 (
    start "" msedge.exe --app="file:///%APP_FILE%" --window-size=1450,920 2>nul
)
if %ERRORLEVEL% NEQ 0 (
    start "" "file:///%APP_FILE%"
)
exit
