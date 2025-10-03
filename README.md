# Claude Context Sync

**Single source of truth for your Claude preferences across all interfaces.**

Maintain your Claude preferences in structured YAML and export them to different formats for Claude Chat, Claude Code, and project-specific CLAUDE.md files.

## The Problem

You interact with Claude through multiple interfaces:

- **Claude Chat** (claude.ai) - web/mobile chat with preferences field
- **Claude Code** (CLI) - global `~/.claude/CLAUDE.md`
- **Project-specific** - `.github/CLAUDE.md` in each repository

Each needs similar-but-different context about you, your working style, and preferences. Keeping them in sync manually is tedious and error-prone.

## Features

### ✅ Currently Implemented

- ✅ **YAML Configuration**: Structured preferences with validation
- ✅ **Format Export**: Export to `claude-md` (full), `hybrid` (balanced), and `chat` (ultra-compressed) formats
- ✅ **File Sync**: Update global and project CLAUDE.md files
- ✅ **Backup System**: Automatic backups before sync operations
- ✅ **Bulk Repository Marking**: Clone and mark all private/public repos with one command
- ✅ **Repository Exclusion**: Exclude repos by pattern (CLI flag + workspace config)
- ✅ **Repository Discovery**: Filesystem scan + GitHub API modes
- ✅ **Validation**: YAML structure and schema validation
- ✅ **Markdown Linting**: Generated output passes markdownlint
- ✅ **Cross-platform Wrappers**: Install unified command wrappers
- ✅ **219 Tests Passing**: Comprehensive test coverage

### 🚧 Experimental (Chat Sync)

- ✅ **Playwright-based setup**: Capture authenticated browser session
- ✅ **Session management**: Store and validate sessions
- ✅ **Multi-tab support**: Handles email verification workflows
- ⚠️ **Note**: Manual paste currently required due to Claude Chat rate limiting

### 🚧 Roadmap

- [ ] Improve Claude Chat sync workflow (exploring alternatives to manual paste)
- [ ] Diff preview before sync operations
- [ ] Profile switching (work/personal contexts)

## Quick Start

```bash
# Validate your preferences
claude-context-sync validate

# Export to CLAUDE.md format (full detail)
claude-context-sync export claude-md

# Export to hybrid format (recommended for Claude Chat)
claude-context-sync export hybrid

# Export to chat format (ultra-compressed)
claude-context-sync export chat

# Sync to global CLAUDE.md
claude-context-sync sync --target global
```

## Preference Sections

The `default-preferences.yaml` supports comprehensive preference definitions organized into sections that cover your background, working style, technical preferences, and agent collaboration patterns.

### Key Highlights

### Testing Standards

- Tests MUST always pass for new OR changed code
- Clean THEN build BEFORE each test run
- No reduced test coverage after changes

### Context Management

- Show snippets and summaries when making changes
- Strategize multi-step processes to limit round trips
- Intelligent semantic compaction near context limits

### Agent Collaboration

- `@claude` mention patterns for GitHub Actions
- Automatic PR creation when agents complete work
- Bot behavior and infinite loop prevention
- Repository configuration via `.github/CLAUDE.md`

### Best Practices

- Thorough escaping for CLI args, regex, sed operations
- Cross-platform compatibility (Windows/macOS/Linux)
- File path handling, line endings, shell differences

### File Operations

- Windows: `explorer "file:///C:/path/to/file.txt"` (exit code 1 is normal)
- macOS: `open "<filepath>"`
- Linux: `xdg-open "<filepath>"` or `${EDITOR:-vi} "<filepath>"`

## Commands

### `validate`

```bash
claude-context-sync validate
claude-context-sync validate -c /path/to/preferences.yaml
```

### `export`

```bash
# List available formats
claude-context-sync export --list-formats

# Export to CLAUDE.md format (full detail, ~7K tokens)
claude-context-sync export claude-md -o output.md

# Export to hybrid format (balanced, ~885 tokens, recommended for Claude Chat)
claude-context-sync export hybrid

# Export to chat format (ultra-compressed, ~850 tokens)
claude-context-sync export chat
```

### `sync`

```bash
# Sync to global CLAUDE.md only
claude-context-sync sync --target global

# Sync to all targets (global + auto-update repos)
# NOTE: Claude Chat sync excluded - use 'export hybrid' instead
claude-context-sync sync --target all

# Sync to Claude Chat (requires authenticated session)
# Tip: Use 'export hybrid' for simpler copy/paste workflow
claude-context-sync sync --target chat

# Dry run
claude-context-sync sync --target global --dry-run
```

**Note**: `--target all` syncs global CLAUDE.md and discovered repositories with `auto_update: true`. Claude Chat sync is intentionally excluded due to authentication complexity. For Claude Chat, use `export hybrid` (recommended) or `export chat` and manually copy/paste to claude.ai.

### `mark` - Bulk Repository Setup

```bash
# Mark a single repository for auto-sync
claude-context-sync mark /path/to/repo

# Bulk mark all private repos for your GitHub user
# Clones repos to ~/repos and adds .claude-sync markers
claude-context-sync mark --bulk --user nlsherman-24861 --filter private

# Exclude specific repos with glob patterns
claude-context-sync mark --bulk --user nlsherman-24861 --exclude thread-* archived-*

# Options for bulk marking:
# --filter: private, public, or all (default: private)
# --repos-dir: Custom directory for cloned repos (default: ~/repos)
# --exclude: Exclude repos matching patterns (supports glob: *, test-*, *-backup)
# --dry-run: Preview without making changes
# --force: Overwrite existing markers

# Persistent excludes via workspace config file
# Create ~/repos/.claude-sync-workspace with:
# exclude:
#   - archived-*
#   - test-*
#   - "*-backup"
```

### `discover` & `sync-repos`

**Two discovery modes:**

1. **Filesystem** (default) - Scans local directories for `.claude-sync` markers
   - Default scan paths: `~/projects`, `~/work`, `~/repos`
   - Fast, works offline

2. **GitHub API** - Checks remote repos via API without cloning
   - Fresh, real-time discovery
   - Useful for checking which repos have markers pushed to GitHub

```bash
# Filesystem discovery (default)
claude-context-sync discover

# GitHub API discovery (no local clones needed)
claude-context-sync discover --source github --user nlsherman-24861 --filter private

# Sync CLAUDE.md preference files to all discovered repos
claude-context-sync sync-repos --dry-run

# Auto-sync only repos with auto_update: true
claude-context-sync sync-repos --auto

# Example output with per-repo status:
# ============================================================
# → Syncing: C:\Users\n\repos\thread-stack
# ============================================================
#
# ✓ Updated .github/CLAUDE.md
# ✓ Updated .claude/CLAUDE.md
# ✓ Committed changes
# Sync completed
#
# ============================================================
# → SYNC SUMMARY
# ============================================================
#
# Total repositories: 9
# ✓ Successful: 7
#   • claude-actions-setup
#   • co-parenting-app
#   • context-manager-mcp
# ⚠ Skipped: 2
#   • thread-stack: Repository has uncommitted changes
```

**Note:** `sync-repos` syncs **preferences only** (CLAUDE.md files). For GitHub Actions/CI/CD setup, use [claude-actions-setup](https://github.com/nlsherman-24861/claude-actions-setup) separately.

### `backups` & `restore`

```bash
# List backups
claude-context-sync backups --target global

# Restore from backup
claude-context-sync restore --target global --backup 1
```

### Claude Chat Sync (Disabled)

**Automated Claude Chat sync via Playwright/session capture is disabled** due to complexity and reliability issues.

**Recommended workflow** for updating Claude Chat preferences:

```bash
# Export preferences in hybrid format (balanced, recommended)
claude-context-sync export hybrid

# Or use ultra-compressed chat format
claude-context-sync export chat

# Copy the output and paste into claude.ai Custom Instructions
```

If you attempt to run `sync --target chat`, you'll see a message explaining the manual workflow.

**Setup commands** (`setup`, `session`) are kept for reference but not recommended for use.

## Agent Collaboration with GitHub Actions

If using [claude-actions-setup](https://github.com/nlsherman-24861/claude-actions-setup), the preferences include specific patterns:

### `@claude` Mention Patterns

```bash
# In GitHub issues/PRs:
@claude implement this feature based on the issue description
@claude fix the TypeError in the user dashboard component
@claude review this PR and suggest improvements
```

### Workflow Expectations

- Agent automatically creates PRs when completing work on issues
- Follows project standards defined in `.github/CLAUDE.md`
- Respects existing code patterns, test frameworks, linting rules
- Comments from `github-actions[bot]` user
- User commonly refers to these remote instances as "the agent"

### Terminology

The preferences document that user colloquially refers to remote Claude Code instances (triggered by `@claude` mentions in GitHub Actions) as "agent" or "the agent".

## Configuration File Location

Default config paths (checked in order):

1. `$CLAUDE_CONTEXT_CONFIG` (environment variable)
2. `~/.config/claude/preferences.yaml`
3. `~/.claude/preferences.yaml`
4. `./default-preferences.yaml` (project root)

## Integration with claude-actions-setup

Works seamlessly with [claude-actions-setup](https://github.com/nlsherman-24861/claude-actions-setup):

```bash
# 1. Set up GitHub Actions integration
npx @nlsherman/claude-actions-setup --target-path ~/my-repo

# 2. Sync your personal preferences
claude-context-sync sync --target project --path ~/my-repo
```

## Testing

```bash
# Run all tests (219 tests)
npm test

# Run with coverage
npm run test:coverage

# Run markdown linting
npm run lint:md
```

## Related Projects

- [claude-actions-setup](https://github.com/nlsherman-24861/claude-actions-setup) - Automated Claude GitHub Actions integration
- [Claude Code](https://docs.claude.com/en/docs/claude-code) - Official CLI tool

## License

MIT

---

**Tests**: 219 passing ✓  
**Status**: Active Development  
**Created**: October 2025
