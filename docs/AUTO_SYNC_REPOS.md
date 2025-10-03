# Auto-Sync Repositories

Automatically sync CLAUDE.md preference files across multiple repositories.

## Overview

Keep your Claude preferences consistent across all your projects. The `sync-repos` command syncs your CLAUDE.md files to all marked repositories with a single command.

**Important:** This tool syncs **preferences only** (CLAUDE.md files). It does NOT run configurators or setup tools. For GitHub Actions/CI/CD setup, use [claude-actions-setup](https://github.com/nlsherman-24861/claude-actions-setup) separately.

## Quick Start

### 1. Mark Repositories for Auto-Sync

Create a `.claude-sync` file in the root of each repository you want to auto-sync:

```yaml
# .claude-sync
sync: true
auto_update: false  # false = interactive, true = automatic
merge_mode: true    # true = merge with existing, false = overwrite
create_pr: false    # true = create PR, false = direct commit
branch_name: chore/update-preferences
auto_push: false    # true = auto-push commits
```

### 2. Discover Marked Repositories

```bash
# Scan default locations (~/projects, ~/work, ~/repos)
claude-context-sync discover

# Scan specific paths
claude-context-sync discover --scan ~/my-projects --scan ~/work
```

### 3. Sync Repositories

```bash
# Preview changes (dry run)
claude-context-sync sync-repos --dry-run

# Interactive mode - prompt for each repo
claude-context-sync sync-repos --interactive

# Auto-sync repos with auto_update: true
claude-context-sync sync-repos --auto

# Sync specific repositories
claude-context-sync sync-repos --path ~/project1 --path ~/project2
```

## Configuration Options

### .claude-sync File Format

The `.claude-sync` marker file supports YAML or JSON format:

**YAML (recommended):**

```yaml
# Enable sync for this repository
sync: true

# Auto-update without prompting
auto_update: false

# Merge with existing CLAUDE.md or overwrite
merge_mode: true

# Create PR instead of direct commit
create_pr: false

# Branch name for PRs
branch_name: chore/update-preferences

# Auto-push commits to remote
auto_push: false
```

**JSON:**

```json
{
  "sync": true,
  "auto_update": false,
  "merge_mode": true,
  "create_pr": false,
  "branch_name": "chore/update-preferences",
  "auto_push": false
}
```

### Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sync` | boolean | `true` | Enable sync for this repo (false = skip) |
| `auto_update` | boolean | `false` | Auto-update without prompting |
| `merge_mode` | boolean | `true` | Merge with existing CLAUDE.md (false = overwrite) |
| `create_pr` | boolean | `false` | Create PR instead of direct commit |
| `branch_name` | string | `chore/update-preferences` | Branch name for PRs |
| `auto_push` | boolean | `false` | Auto-push commits to remote |

## Commands

### discover

Scan directories for repositories with `.claude-sync` markers.

```bash
# Scan default locations
claude-context-sync discover

# Scan specific paths
claude-context-sync discover --scan ~/projects --scan ~/work

# Verbose output
claude-context-sync discover --scan ~/projects --verbose
```

**Output:**

```
Found 3 repository(ies) with .claude-sync markers:

1. /home/user/projects/my-app
   Auto-update: No
   Create PR: No
   Auto-push: No

2. /home/user/projects/another-app
   Auto-update: Yes
   Create PR: Yes
   Auto-push: No
```

### sync-repos

Sync CLAUDE.md preference files to marked repositories.

```bash
# Dry run - preview changes
claude-context-sync sync-repos --dry-run

# Interactive mode - prompt for each repo
claude-context-sync sync-repos --interactive

# Auto mode - only sync repos with auto_update: true
claude-context-sync sync-repos --auto

# Sync specific repositories
claude-context-sync sync-repos --path ~/project1 --path ~/project2

# Force sync even with uncommitted changes
claude-context-sync sync-repos --force

# Scan specific paths
claude-context-sync sync-repos --scan ~/projects

# Verbose output
claude-context-sync sync-repos --verbose
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview changes without applying |
| `--interactive` | Prompt for confirmation for each repo |
| `--auto` | Only sync repos with `auto_update: true` |
| `--path <paths...>` | Specific repository paths to sync |
| `--scan <paths...>` | Paths to scan for repositories |
| `--force` | Sync even if uncommitted changes exist |
| `--verbose` | Show detailed output |

## Workflows

### Safe Incremental Updates

```bash
# 1. Discover what would be updated
claude-context-sync discover

# 2. Preview changes
claude-context-sync sync-repos --dry-run

# 3. Sync interactively
claude-context-sync sync-repos --interactive

# 4. Review PRs created in each repo (if using create_pr: true)
```

### Automated Updates

For repos you trust with `auto_update: true`:

```bash
# Update all auto-update repos
claude-context-sync sync-repos --auto

# Or set up a cron job / GitHub Action
```

### Selective Updates

```bash
# Update specific repos only
claude-context-sync sync-repos \
  --path ~/project1 \
  --path ~/project2 \
  --path ~/project3
```

## What Gets Synced

The `sync-repos` command syncs your CLAUDE.md preference files to two locations in each repository:

1. `.github/CLAUDE.md` - For GitHub integration
2. `.claude/CLAUDE.md` - For Claude Code

The content comes from your `default-preferences.yaml` file, transformed to CLAUDE.md format.

**What is NOT synced:**

- GitHub Actions workflows
- CI/CD configurations
- Project-specific files
- Any other configuration files

For those, use [claude-actions-setup](https://github.com/nlsherman-24861/claude-actions-setup) separately.

## Safety Features

### Uncommitted Changes Protection

By default, sync is skipped for repos with uncommitted changes:

```
Sync skipped
  ⚠ Repository has uncommitted changes. Use --force to override.
```

Use `--force` to override:

```bash
claude-context-sync sync-repos --force
```

### Content Detection

Files are only updated if content has changed. If a repository's CLAUDE.md already matches your preferences, the sync is skipped:

```
✓ .github/CLAUDE.md already up to date
✓ .claude/CLAUDE.md already up to date
```

### Dry Run Mode

Preview all changes without applying:

```bash
claude-context-sync sync-repos --dry-run
```

Output shows what *would* happen without making changes.

## Examples

### Example 1: Interactive Sync

```bash
$ claude-context-sync sync-repos --interactive

Scanning for repositories with .claude-sync markers...
Found 3 repository(ies)

============================================================
Syncing: /home/user/projects/my-app
============================================================

Sync this repository? (y/n) y
✓ Updated .github/CLAUDE.md
✓ Updated .claude/CLAUDE.md
✓ Committed changes
Sync completed
```

### Example 2: Auto-Update Only

```bash
$ claude-context-sync sync-repos --auto

Filtered to 2 auto-update repository(ies)

============================================================
Syncing: /home/user/projects/app-with-auto-update
============================================================

✓ Updated .github/CLAUDE.md
✓ Updated .claude/CLAUDE.md
✓ Committed changes
Sync completed

============================================================
SYNC SUMMARY
============================================================

Total repositories: 2
Successful: 2
Failed: 0
Skipped: 0
```

### Example 3: Dry Run

```bash
$ claude-context-sync sync-repos --dry-run

=== DRY RUN MODE ===
No changes will be made

============================================================
Syncing: /home/user/projects/my-app
============================================================

✓ Would update CLAUDE.md files
✓ Would commit changes
Sync completed

This was a dry run. Run without --dry-run to apply changes.
```

## Best Practices

1. **Start with `auto_update: false`** - Use interactive mode until confident
2. **Use `create_pr: true`** - Review changes before merging (optional)
3. **Run `--dry-run` first** - Preview changes before applying
4. **Commit your changes** - Clean working directory before syncing
5. **Use `auto_push: false` initially** - Manually review commits before pushing

## Troubleshooting

### No Repositories Found

```
No repositories found with .claude-sync markers
```

**Solution:** Create `.claude-sync` files in repositories you want to sync.

### Sync Skipped - Uncommitted Changes

```
Sync skipped
  ⚠ Repository has uncommitted changes
```

**Solution:** Commit or stash changes, or use `--force` flag.

### Files Not Updating

```
✓ .github/CLAUDE.md already up to date
✓ .claude/CLAUDE.md already up to date
```

**Explanation:** This is normal - files are only updated when content changes.

## Integration with GitHub Actions

You can automate repo syncing with GitHub Actions:

```yaml
# .github/workflows/auto-sync-claude.yml
name: Auto-Sync Claude Preferences

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install claude-context-sync
        run: npm install -g @nlsherman/claude-context-sync

      - name: Discover repos
        run: claude-context-sync discover --scan ~/projects

      - name: Sync repos (auto-update only)
        run: claude-context-sync sync-repos --auto
```

## Separation of Concerns

**claude-context-sync** (this tool):

- Syncs CLAUDE.md preference files
- Manages `.claude-sync` markers
- Batch updates across repositories

**claude-actions-setup** (separate tool):

- Sets up GitHub Actions workflows
- Configures CI/CD
- Creates project scaffolding

These tools are **decoupled** and can be used independently. Use both together for complete Claude integration, or use each separately as needed.

## See Also

- [Schema Documentation](./SCHEMA.md)
- [Wrapper Scripts](./WRAPPER_SCRIPTS.md)
- [Claude Actions Setup](https://github.com/nlsherman-24861/claude-actions-setup)
