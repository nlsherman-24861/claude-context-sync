# Auto-Sync Repositories

Automatically sync configurator updates across multiple repositories.

## Overview

When your configurator tool (like `claude-actions-setup`) updates, you can automatically update all marked repositories with a single command instead of manually re-running the configurator in each repo.

## Quick Start

### 1. Mark Repositories for Auto-Sync

Create a `.claude-sync` file in the root of each repository you want to auto-sync:

```yaml
# .claude-sync
sync: true
auto_update: false  # false = interactive, true = automatic
configurator: claude-actions-setup
preserve_overrides: true
create_pr: true
branch_name: chore/update-claude-config
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

# Configurator tool to use
configurator: claude-actions-setup

# Version constraints (optional)
version: ">=1.0.0"

# Preserve manual customizations
preserve_overrides: true

# Create PR instead of direct commit
create_pr: true

# Branch name for PRs
branch_name: chore/update-claude-config
```

**JSON:**

```json
{
  "sync": true,
  "auto_update": false,
  "configurator": "claude-actions-setup",
  "preserve_overrides": true,
  "create_pr": true,
  "branch_name": "chore/update-claude-config"
}
```

### Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sync` | boolean | `true` | Enable sync for this repo (false = skip) |
| `auto_update` | boolean | `false` | Auto-update without prompting |
| `configurator` | string | `claude-actions-setup` | Which configurator tool to use |
| `version` | string | `*` | Version constraints (semver) |
| `preserve_overrides` | boolean | `true` | Keep manual customizations |
| `create_pr` | boolean | `true` | Create PR instead of direct commit |
| `branch_name` | string | `chore/update-claude-config` | Branch name for PRs |

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
   Configurator: claude-actions-setup
   Auto-update: No
   Create PR: Yes

2. /home/user/projects/another-app
   Configurator: claude-actions-setup
   Auto-update: Yes
   Create PR: Yes
```

### sync-repos

Sync configurator updates to marked repositories.

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

# 4. Review PRs created in each repo
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

### Backups

When `preserve_overrides: true`, backups are created before updates:

```
.claude-backups/
  2025-10-02T14-30-45/
    .github/workflows/claude.yml
    .claude/CLAUDE.md
```

### Dry Run Mode

Preview all changes without applying:

```bash
claude-context-sync sync-repos --dry-run
```

Output shows what *would* happen without making changes.

## Supported Configurators

| Configurator | Command |
|--------------|---------|
| `claude-actions-setup` | `npx -y @nlsherman/claude-actions-setup` |
| `setup-claude-integration` | `node setup-claude-integration.js` |

Custom configurators can be specified directly:

```yaml
configurator: "npx my-custom-setup"
```

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
Running configurator...
✓ Ran claude-actions-setup
✓ Created PR on branch chore/update-claude-config
Sync completed
```

### Example 2: Auto-Update Only

```bash
$ claude-context-sync sync-repos --auto

Filtered to 2 auto-update repository(ies)

============================================================
Syncing: /home/user/projects/app-with-auto-update
============================================================

✓ Ran claude-actions-setup
✓ Created PR on branch chore/update-claude-config
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

✓ Would run claude-actions-setup
✓ Would create PR changes
Sync completed

This was a dry run. Run without --dry-run to apply changes.
```

## Best Practices

1. **Start with `auto_update: false`** - Use interactive mode until confident
2. **Use `create_pr: true`** - Review changes before merging
3. **Enable `preserve_overrides: true`** - Protect manual customizations
4. **Run `--dry-run` first** - Preview changes before applying
5. **Commit your changes** - Clean working directory before syncing
6. **Use version constraints** - Control which configurator versions to use

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

### Configurator Failed

```
Sync failed
  ✗ Command failed: npx -y @nlsherman/claude-actions-setup
```

**Solution:** Check that the configurator package is available and working.

## Integration with GitHub Actions

You can automate repo syncing with GitHub Actions:

```yaml
# .github/workflows/auto-sync-claude.yml
name: Auto-Sync Claude Config

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

## See Also

- [File Sync Operations](./FILE_SYNC.md)
- [Configurator Setup](./CONFIGURATOR.md)
- [Claude Actions Setup](https://github.com/nlsherman-24861/claude-actions-setup)
