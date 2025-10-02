# Cross-Platform Wrapper Scripts

This document explains the cross-platform wrapper scripts that provide simple, consistent entry points for `claude-context-sync` across Windows, macOS, and Linux.

## Overview

The wrapper scripts solve the problem of platform-specific command invocation by providing:

- Simple `sync-claude` command that works identically on all platforms
- Automatic shell detection and installation
- PATH management assistance
- Unified command interface with convenient aliases

## Installation

### Automatic Installation

Install wrappers for all detected shells:

```bash
claude-context-sync install-wrappers
```

### Shell-Specific Installation

Install for a specific shell:

```bash
# Bash/Zsh (macOS, Linux, WSL, Git Bash)
claude-context-sync install-wrappers --shell bash

# PowerShell (Windows)
claude-context-sync install-wrappers --shell powershell

# CMD (Windows)
claude-context-sync install-wrappers --shell cmd

# All shells
claude-context-sync install-wrappers --shell all
```

### Installation Options

```bash
# Force overwrite existing wrappers
claude-context-sync install-wrappers --force

# Install system-wide (requires admin/sudo)
claude-context-sync install-wrappers --global
```

## Platform-Specific Behavior

### Bash/Zsh (macOS, Linux, WSL, Git Bash)

**Installation locations** (in order of preference):

- `~/.local/bin/sync-claude`
- `~/bin/sync-claude`  
- `/usr/local/bin/sync-claude` (with --global)

**Features:**

- Executable script with proper shebang
- Error handling for missing `claude-context-sync`
- Passes all arguments transparently

### PowerShell (Windows)

**Installation locations:**

- `~/Documents/PowerShell/Scripts/Sync-Claude.ps1`
- `~/Documents/WindowsPowerShell/Scripts/Sync-Claude.ps1`

**Features:**

- PowerShell function with proper parameter handling
- Built-in aliases: `sync-claude`, `cs`
- PowerShell-style error reporting
- Can be imported as module or run directly

### CMD (Windows)

**Installation locations:**

- `%USERPROFILE%\bin\sync-claude.bat`
- User-specific PATH directories

**Features:**

- Batch file with error handling
- Proper argument forwarding with `%*`
- Windows-specific error messages

## PATH Management

The installer automatically:

1. Detects if installation directory is in PATH
2. Warns if not in PATH
3. Provides instructions for adding to PATH

### Adding to PATH Manually

#### Bash/Zsh

Add to `~/.bashrc`, `~/.zshrc`, or `~/.profile`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

#### PowerShell

Add to PowerShell profile (`$PROFILE`):

```powershell
$env:PATH = "$env:USERPROFILE\Documents\PowerShell\Scripts;" + $env:PATH
```

#### Windows CMD

Add directory to Windows PATH environment variable:

1. Open System Properties > Environment Variables
2. Add installation directory to PATH
3. Restart command prompt

## Unified Command Interface

Once installed, these commands work identically across all platforms:

### Core Operations

```bash
sync-claude all                    # Sync everything
sync-claude chat                   # Sync chat preferences  
sync-claude global                 # Sync global CLAUDE.md
sync-claude project [path]         # Sync project CLAUDE.md
```

### Quick Actions

```bash
sync-claude edit                   # Open preferences in $EDITOR
sync-claude validate               # Validate preferences file
sync-claude diff [target]          # Show differences
```

### Session Management

```bash
sync-claude check                  # Check session validity
sync-claude refresh                # Refresh expired session
```

### Discovery

```bash
sync-claude discover               # Find .claude-sync repositories
sync-claude sync-repos [--auto]    # Update marked repositories
```

## Management Commands

### List Installed Wrappers

```bash
claude-context-sync list-wrappers
```

Shows:

- Which shells have wrappers installed
- Installation paths
- Whether directories are in PATH

### Uninstall Wrappers

```bash
# Remove all wrappers
claude-context-sync uninstall-wrappers

# Remove specific shell wrapper
claude-context-sync uninstall-wrappers --shell bash
```

### Show Examples

```bash
claude-context-sync examples
```

Displays the unified command interface with usage examples.

## Shell Integration

### Bash/Zsh Aliases

Add these to your shell profile for even shorter commands:

```bash
alias cs='sync-claude'
alias cse='sync-claude edit'  
alias csv='sync-claude validate'
```

### PowerShell Aliases

The PowerShell wrapper automatically provides:

```powershell
cs              # Short alias for Sync-Claude
sync-claude     # Full name alias
```

## Troubleshooting

### Command Not Found

```bash
# Check if wrapper is installed
claude-context-sync list-wrappers

# Check PATH
echo $PATH  # Unix
echo $env:PATH  # PowerShell

# Reinstall wrapper
claude-context-sync install-wrappers --force
```

### Permission Denied (Unix)

```bash
# Make sure wrapper is executable
chmod +x ~/.local/bin/sync-claude
```

### PowerShell Execution Policy

```powershell
# Check execution policy
Get-ExecutionPolicy

# Allow scripts (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Platform Testing

The wrappers have been tested on:

- ✅ Linux (bash, zsh)
- ✅ macOS (bash, zsh)
- ✅ Windows (PowerShell, CMD)
- ✅ WSL (bash)
- ✅ Git Bash (Windows)

## Future Enhancements

Planned improvements:

- Shell completion scripts (bash-completion, PowerShell)
- Package manager integration (brew, chocolatey, apt)
- Git aliases (`git sync-claude`)
- Oh My Posh/Starship prompt integration
