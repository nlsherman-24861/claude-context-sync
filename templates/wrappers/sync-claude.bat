@echo off
REM sync-claude wrapper script for Windows CMD
REM Provides a simple entry point for claude-context-sync

setlocal enabledelayedexpansion

REM Check if claude-context-sync is available
where claude-context-sync >nul 2>&1
if errorlevel 1 (
    echo Error: claude-context-sync not found in PATH >&2
    echo Please install it with: npm install -g claude-context-sync >&2
    exit /b 1
)

REM Execute claude-context-sync with all arguments
claude-context-sync %*