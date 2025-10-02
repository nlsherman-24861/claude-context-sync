#!/usr/bin/env bash
# sync-claude wrapper script for bash/zsh (macOS, Linux, WSL, Git Bash)
# This script provides a simple entry point for claude-context-sync

# Enable strict mode for better error handling
set -euo pipefail

# Check if claude-context-sync is available
if ! command -v claude-context-sync >/dev/null 2>&1; then
    echo "Error: claude-context-sync not found in PATH" >&2
    echo "Please install it with: npm install -g claude-context-sync" >&2
    exit 1
fi

# Pass all arguments to claude-context-sync
exec claude-context-sync "$@"