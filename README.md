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
- ✅ **Format Export**: Export to `claude-md` (CLAUDE.md) and `chat` formats
- ✅ **File Sync**: Update global and project CLAUDE.md files
- ✅ **Backup System**: Automatic backups before sync operations
- ✅ **Repository Discovery**: Find repos with `.claude-sync` markers
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

# Export to CLAUDE.md format
claude-context-sync export claude-md

# Export to chat format
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

# Export to CLAUDE.md format
claude-context-sync export claude-md -o output.md

# Export to chat format
claude-context-sync export chat
```

### `sync`

```bash
# Sync to global CLAUDE.md
claude-context-sync sync --target global

# Sync to all discovered repos
claude-context-sync sync --target all

# Dry run
claude-context-sync sync --target global --dry-run
```

### `discover` & `sync-repos`

```bash
# Find repos with .claude-sync markers
claude-context-sync discover

# Sync to all discovered repos
claude-context-sync sync-repos --dry-run
```

### `backups` & `restore`

```bash
# List backups
claude-context-sync backups --target global

# Restore from backup
claude-context-sync restore --target global --backup 1
```

### `setup` & `session` (Chat Sync - Experimental)

```bash
# Interactive setup wizard for Claude Chat sync
npm run setup:chat
# or
claude-context-sync setup --authenticate

# Check session status
npm run session:check
# or
claude-context-sync session --check

# View session info
claude-context-sync session --info

# Sync to Claude Chat (requires valid session)
npm run sync:chat
# or
claude-context-sync sync --target chat
```

**Note**: Due to Claude Chat rate limiting, you may need to use the manual export:

```bash
# Export chat format and paste manually
claude-context-sync export chat
```

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
