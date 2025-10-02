# Examples & Templates

This directory contains example files and templates to help you get started with claude-context-sync.

## Files

### `preferences.yaml`

**Full working example** based on a real user's preferences. Shows:

- Complete YAML structure
- All supported sections
- Detailed, realistic entries
- Inline documentation

Use this to understand what's possible and see a real-world configuration.

### `CLAUDE.md`

**Example template** for claude-code projects. Shows the typical structure for a project's `.github/CLAUDE.md` or global `~/.config/claudecode/CLAUDE.md`.

Key sections:

- Developer background (references canonical preferences)
- Project overview
- Architecture notes
- Working conventions
- Key areas and gotchas

### `chat_bootstrap.md`

**Example template** for Claude Projects. This is the file you'd save in a Claude Project to provide project-specific context that augments your global chat preferences.

Focuses on:

- Project-specific context
- Current sprint/focus areas
- Domain knowledge
- Quick reference info

## Templates Directory

### `../templates/preferences.yaml`

**Minimal starting template** with placeholder text. Use this when creating your own preferences file from scratch:

```bash
cp templates/preferences.yaml ~/.config/claude/preferences.yaml
# Then edit with your details
```

## Usage Patterns

### 1. First Time Setup

```bash
# Copy template and customize
mkdir -p ~/.config/claude
cp templates/preferences.yaml ~/.config/claude/preferences.yaml
code ~/.config/claude/preferences.yaml
```

### 2. Creating a Project CLAUDE.md

```bash
# Copy example to your project
cp examples/CLAUDE.md ~/my-project/.github/CLAUDE.md
# Edit with project-specific details
```

### 3. Creating a Claude Project Bootstrap

```bash
# Copy to your project
cp examples/chat_bootstrap.md ~/my-project/chat_bootstrap.md
# Edit with project specifics
# Upload to Claude Project or save locally
```

## Customization Tips

### Scope Your Content

Different contexts need different information:

- **Chat Preferences**: Personal, conversational, relationship-oriented
- **Global CLAUDE.md**: Technical approach, workflow preferences, general conventions
- **Project CLAUDE.md**: Project-specific architecture, conventions, gotchas
- **Bootstrap Files**: Project context, current sprint, domain knowledge

### Keep It DRY

The whole point of claude-context-sync is to avoid duplication:

1. **Canonical source**: `~/.config/claude/preferences.yaml`
2. **Generated outputs**: Chat preferences, global CLAUDE.md
3. **Project overlays**: Minimal, project-specific additions

### Version Control

- **DO** version control your canonical `preferences.yaml` (in a private repo)
- **DO** version control project CLAUDE.md files
- **DO** version control bootstrap files in project repos
- **DON'T** version control the generated chat preferences text

## Evolution

These examples will evolve as:

- New features are added to claude-context-sync
- Best practices emerge
- Community feedback shapes conventions

Check the main README for the current state of the tool.

---

**Last Updated**: October 2025
