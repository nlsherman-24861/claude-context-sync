# Claude Context Sync

**Single source of truth for your Claude preferences across all interfaces.**

Tired of maintaining duplicate context in Claude Chat preferences, global CLAUDE.md, and per-project CLAUDE.md files? This tool treats your preferences as structured data and intelligently compiles them for each target environment.

## The Problem

You interact with Claude through multiple interfaces:
- **Claude Chat** (claude.ai) - web/mobile chat with preferences field
- **Claude Code** (CLI) - global `~/.config/claudecode/CLAUDE.md`
- **Project-specific** - `.github/CLAUDE.md` in each repository

Each needs similar-but-different context about you, your working style, and preferences. Keeping them in sync manually is tedious and error-prone.

## The Solution

```bash
# One canonical source
vim ~/.config/claude/preferences.yaml

# Sync everywhere
claude-context-sync sync --all

# Behind the scenes:
# ✅ Updates Claude Chat preferences (automated via Playwright)
# ✅ Updates global CLAUDE.md for Claude Code
# ✅ Updates project CLAUDE.md files (via overlay)
# ✅ All from a single source of truth
```

## Features

### 🎯 Single Source of Truth
- Maintain preferences in structured YAML format
- Define scope for each preference (chat, global, project)
- Version control your preferences like code

### 🤖 Automated Sync
- **Claude Chat**: Headless browser automation (Playwright)
- **Global CLAUDE.md**: Direct file updates
- **Project CLAUDE.md**: Intelligent overlay on auto-detected context

### 🔒 Secure Session Management
- One-time browser authentication capture
- Reusable session tokens stored locally
- Works in headless/CI environments after initial setup

### 🚀 CI/CD Ready
- Fully headless operation
- GitHub Actions integration
- Automatic sync on preference changes

### 🎨 Format Optimization
- Chat format: Natural prose for conversational AI
- CLAUDE.md format: Structured markdown for code tools
- Project format: Minimal overlay on project-specific context

## Quick Start

```bash
# Install
npm install -g claude-context-sync

# Initial setup (one-time, requires GUI)
claude-context-sync init
claude-context-sync setup --authenticate

# Edit your canonical preferences
code ~/.config/claude/preferences.yaml

# Sync to all targets
claude-context-sync sync --all

# Or sync individually
claude-context-sync sync --target chat
claude-context-sync sync --target global
claude-context-sync sync --target project --path ~/my-repo
```

## Installation

### Prerequisites
- Node.js 18+
- npm or pnpm

### Global Install
```bash
npm install -g claude-context-sync
```

### Local Development
```bash
git clone https://github.com/nlsherman-24861/claude-context-sync.git
cd claude-context-sync
npm install
npm link
```

## Configuration

### Canonical Preferences Format

`~/.config/claude/preferences.yaml`:

```yaml
# Personal context (chat, global)
personal:
  name: "Your Name"
  background: "15-20 years software engineering experience"
  interests: 
    - "sci-fi"
    - "psychology"
    - "technical debates"

# Working style (chat, global, project)
working_style:
  communication:
    - "High-level summaries with structured outlines"
    - "Concise bullets for action items"
    - "Multiple solution paths when uncertain"
  
  feedback:
    - "Positive reinforcement without pandering"
    - "Constructive redirection over dwelling on failures"
    - "Never pushy or overly motivating"

# Technical approach (global, project)
technical_approach:
  philosophy:
    - "Prefer understanding root causes over quick fixes"
    - "Pragmatic AI optimist - leverage strengths, aware of limits"
    - "Balance automation with maintainability"
  
  coding_style:
    - "Clean, maintainable code"
    - "Strong typing where possible"
    - "Comprehensive testing"

# Personality (chat, global)
personality:
  name: "JAX"  # Optional: customize your assistant's persona
  traits:
    - "Friendly with dry humor and good-natured snark"
    - "Gen-X/early millennial sensibilities"
    - "Motivating without being pushy"
    - "Shares interests in sci-fi and psychology"
  
  relationship: "Pseudo-anthropomorphic assistant with intimate context"
```

### Scope Rules

Each section can be tagged with target scopes:
- `chat`: Appears in Claude Chat preferences (natural prose)
- `global`: Appears in global CLAUDE.md (structured)
- `project`: Appears in project CLAUDE.md (minimal overlay)

## Commands

### `init`
Initialize configuration structure and create template preferences file.

```bash
claude-context-sync init
```

### `setup --authenticate`
Capture authenticated browser session (one-time setup, requires GUI).

```bash
claude-context-sync setup --authenticate
```

This opens a browser window, lets you log in to Claude, and saves the session for future headless use.

### `sync`
Synchronize preferences to target(s).

```bash
# Sync everything
claude-context-sync sync --all

# Sync to Claude Chat
claude-context-sync sync --target chat

# Sync to global CLAUDE.md
claude-context-sync sync --target global

# Sync to specific project
claude-context-sync sync --target project --path ~/my-repo

# Dry run (preview changes)
claude-context-sync sync --target chat --dry-run
```

### `export`
Export preferences in specific format without syncing.

```bash
# Export for Claude Chat (prose format)
claude-context-sync export --format chat

# Export for CLAUDE.md (structured format)
claude-context-sync export --format claude-md

# Save to file
claude-context-sync export --format chat > chat-preferences.txt
```

### `diff`
Show differences between canonical preferences and current targets.

```bash
# Check all targets
claude-context-sync diff

# Check specific target
claude-context-sync diff --target global
```

### `validate`
Validate preferences YAML syntax and structure.

```bash
claude-context-sync validate
```

## Advanced Usage

### GitHub Actions Integration

```yaml
name: Sync Claude Preferences

on:
  push:
    paths:
      - '.config/claude/preferences.yaml'

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install claude-context-sync
        run: npm install -g claude-context-sync
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Restore Claude session
        run: |
          mkdir -p ~/.config/claude
          echo "${{ secrets.CLAUDE_SESSION_JSON }}" > ~/.config/claude/session.json
      
      - name: Sync to Claude Chat
        run: claude-context-sync sync --target chat
```

### Integration with claude-actions-setup

If you use [claude-actions-setup](https://github.com/nlsherman-24861/claude-actions-setup), you can automatically enrich project CLAUDE.md files:

```bash
# Run claude-actions-setup
npx @nlsherman/claude-actions-setup --target-path ~/my-repo

# Then overlay your personal preferences
claude-context-sync sync --target project --path ~/my-repo
```

The tool will intelligently merge:
- **Auto-detected context** (tech stack, build commands, etc.)
- **Your preferences** (working style, communication, etc.)

### Session Management

```bash
# Check session validity
claude-context-sync session --check

# Refresh expired session
claude-context-sync setup --refresh-session

# View session info
claude-context-sync session --info
```

## How It Works

### Architecture

```
┌─────────────────────────────────────┐
│   preferences.yaml                  │
│   (Single Source of Truth)          │
└─────────────────┬───────────────────┘
                  │
                  │ parse & scope
                  │
         ┌────────┴─────────┐
         │   Transformer    │
         │   Engine         │
         └────┬───┬────┬────┘
              │   │    │
    ┌─────────┘   │    └──────────┐
    │             │               │
┌───▼────┐   ┌───▼────┐   ┌──────▼─────┐
│ Chat   │   │ Global │   │  Project   │
│ Format │   │ Format │   │  Format    │
└───┬────┘   └───┬────┘   └──────┬─────┘
    │            │               │
┌───▼────────┐ ┌─▼──────────┐ ┌─▼─────────┐
│ Playwright │ │ File Write │ │ File Merge│
│ Automation │ │            │ │           │
└────────────┘ └────────────┘ └───────────┘
```

### Playwright Session Flow

1. **Initial Setup** (headed, one-time):
   - Launch browser with GUI
   - User logs in to claude.ai
   - Capture cookies/localStorage
   - Save to `~/.config/claude/session.json`

2. **Subsequent Updates** (headless, automated):
   - Load saved session
   - Navigate to preferences page
   - Update preferences field via DOM
   - Click save button
   - Verify success
   - Close browser

3. **Session Refresh** (when expired):
   - Detect expired session
   - Re-run headed authentication
   - Update stored session

## Troubleshooting

### Session Expired
```bash
# Error: Session invalid or expired
claude-context-sync setup --refresh-session
```

### Sync Failed
```bash
# Check what would happen without executing
claude-context-sync sync --target chat --dry-run

# Verbose logging
claude-context-sync sync --target chat --verbose
```

### Playwright Issues
```bash
# Reinstall browsers
npx playwright install --with-deps chromium

# Test browser automation
claude-context-sync test --browser
```

### Validation Errors
```bash
# Check YAML syntax
claude-context-sync validate --verbose
```

## Roadmap

- [x] Core CLI structure
- [ ] YAML parser and validator
- [ ] Format transformers (chat, global, project)
- [ ] Playwright session capture
- [ ] Headless preference updates
- [ ] File sync for global/project CLAUDE.md
- [ ] Diff engine
- [ ] GitHub Actions templates
- [ ] Interactive init wizard
- [ ] TOML/JSON format support
- [ ] Profile management (multiple personas)
- [ ] Session auto-refresh

## Contributing

Contributions welcome! Areas of interest:
- Additional format outputs
- Alternative authentication methods
- Session persistence strategies
- UI for preference management
- Template library

## Related Projects

- [claude-actions-setup](https://github.com/nlsherman-24861/claude-actions-setup) - Automated Claude GitHub Actions integration
- [Claude Code](https://docs.claude.com/en/docs/claude-code) - Official CLI tool

## License

MIT License - use freely in your projects.

## Support

- **Issues**: https://github.com/nlsherman-24861/claude-context-sync/issues
- **Discussions**: https://github.com/nlsherman-24861/claude-context-sync/discussions

---

**Created**: October 2025  
**Status**: Active Development
