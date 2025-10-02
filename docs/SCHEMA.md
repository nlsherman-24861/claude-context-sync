# Preferences Schema Reference

This document describes the structure and semantics of the `preferences.yaml` file used by claude-context-sync.

## Overview

The preferences file is a YAML document with a specific structure designed to capture:
- Your professional background and experience
- Personal interests that inform engagement
- Working style and communication preferences
- Technical approach and coding philosophy
- Personality traits for your Claude assistant
- Project conventions and workflows

## Schema Version

Current version: `1.0.0`

## Top-Level Sections

### `professional_background`
**Scope**: chat, global  
**Required**: Recommended

Your professional experience and learning philosophy.

```yaml
professional_background:
  experience: string          # Years and domain (e.g., "15-20 years software engineering")
  technical_level: string     # Brief technical background description
  philosophy:                 # Array of strings
    - string                  # Learning philosophy statements
    - string                  # Problem-solving approach
```

**Example**:
```yaml
professional_background:
  experience: "15-20 years practical software engineering"
  technical_level: "Strong technical background in distributed systems"
  philosophy:
    - "Love learning and the process of problem solving"
    - "Prefer understanding what and why to quick-and-easy fixes"
```

---

### `personal_interests`
**Scope**: chat, global  
**Required**: Optional

Personal interests that help Claude engage more naturally and provide relevant examples.

```yaml
personal_interests:
  primary:                    # Array of strings
    - string                  # Primary interest
    - string                  # Primary interest
  engagement_style:           # Array of strings
    - string                  # How you like to engage
  generation: string          # Generational identifier for cultural context
```

**Example**:
```yaml
personal_interests:
  primary:
    - "Sci-fi"
    - "Psychology"
  engagement_style:
    - "Enjoy good debates without heat or big stakes"
  generation: "Late Gen-X / Early Millennial"
```

---

### `working_style`
**Scope**: chat, global, project  
**Required**: Highly recommended

How you prefer to work and communicate with Claude.

```yaml
working_style:
  communication:              # Array of strings
    - string                  # Communication preference
    - string                  # Information structure preference
  
  context_management:         # Array of strings (optional)
    - string                  # File generation and chat context preferences
    - string                  # Content sharing preferences
  
  feedback:                   # Array of strings
    - string                  # Feedback style preference
    - string                  # Motivation approach
  
  learning:                   # Array of strings (optional)
    - string                  # Learning preference
```

**Example**:
```yaml
working_style:
  communication:
    - "High-level summaries coupled with structured outlines"
    - "Concise bullets and action items"
    - "Multiple paths forward when there are meaningful tradeoffs"
  
  context_management:
    - "Generate file content in VM, provide summaries not full dumps"
    - "Only share full content when contextually relevant or requested"
    - "Keep chat context lean and focused"
  
  feedback:
    - "Positive reinforcement but not pandering"
    - "Motivating and redirecting sense of failure to constructive possibilities"
```

---

### `technical_approach`
**Scope**: global, project  
**Required**: Recommended for development work

Your technical philosophy and coding preferences.

```yaml
technical_approach:
  philosophy:                 # Array of strings
    - string                  # Technical philosophy
    - string                  # AI/tooling approach
  coding_style:               # Array of strings
    - string                  # Code quality preferences
    - string                  # Architecture preferences
  workflow:                   # Object with nested arrays
    git_and_github:           # Array of strings
      - string                # Git workflow preferences
    project_persistence:      # Array of strings (optional)
      - string                # Content persistence strategy
    credentials:              # Array of strings (optional)
      - string                # Credential management preferences
```

**Example**:
```yaml
technical_approach:
  philosophy:
    - "Pragmatic AI optimist - leverage strengths, aware of limits"
    - "Value understanding root causes over surface fixes"
  coding_style:
    - "Balance technical rigor with maintainability"
    - "Prefer explicit over clever"
  workflow:
    git_and_github:
      - "Prefer bash commands (git, gh) over abstractions"
      - "Clone repos locally to work efficiently"
    project_persistence:
      - "Push generated content to repos to avoid loss between sessions"
      - "Commit to main or working branch as appropriate"
```

---

### `personality`
**Scope**: chat, global  
**Required**: Optional

Customize your Claude assistant's persona and relationship dynamic.

```yaml
personality:
  construct_name: string      # Name for your Claude assistant (e.g., "JAX")
  description: string         # Brief relationship description (optional)
  traits:                     # Array of strings
    - string                  # Personality trait
    - string                  # Communication style
```

**Example**:
```yaml
personality:
  construct_name: "JAX"
  description: "Pseudo-anthropomorphic entity with intimate context"
  traits:
    - "Friendly personality with dry sense of humor"
    - "Motivating but never pushy"
    - "Shared late gen-x / early millennial sensibilities"
```

---

### `project_conventions`
**Scope**: global, project  
**Required**: Optional

Conventions specific to your workflow and project organization.

```yaml
project_conventions:
  documentation:              # Array of strings
    - string                  # Documentation convention
  github_workflow:            # Array of strings
    - string                  # GitHub workflow pattern
```

**Example**:
```yaml
project_conventions:
  documentation:
    - "Sometimes save file artifacts named chat_bootstrap.md in projects"
    - "These represent context for subsequent chats"
  github_workflow:
    - "Use github-credential-vault for API tokens"
    - "Clone repos locally to work efficiently"
```

---

## Scope Semantics

Each section can target different Claude interfaces. The tool will intelligently compile preferences based on scope:

### `chat`
**Target**: Claude Chat preferences field (claude.ai)  
**Format**: Natural prose, conversational  
**Typical content**: Personal background, interests, working style, personality

### `global`
**Target**: `~/.config/claudecode/CLAUDE.md` (claude-code global config)  
**Format**: Structured markdown  
**Typical content**: Technical approach, coding style, workflow preferences

### `project`
**Target**: `.github/CLAUDE.md` in specific repositories  
**Format**: Structured markdown (minimal overlay on project-specific content)  
**Typical content**: Relevant working style points, technical conventions

**Note**: Scope assignment is not yet implemented in v1.0. All content is currently treated as available to all targets, with format transformation handling appropriateness.

---

## Format Transformers

### Chat Format
Transforms YAML into natural prose suitable for Claude Chat:

**Input**:
```yaml
working_style:
  communication:
    - "High-level summaries with structured outlines"
    - "Concise bullets for action items"
```

**Output**:
```text
For working style and communication, I prefer high-level summaries with 
structured outlines, and concise bullets for action items.
```

### CLAUDE.md Format
Transforms YAML into structured markdown:

**Input**: (same as above)

**Output**:
```markdown
## Working Style

### Communication
- High-level summaries with structured outlines
- Concise bullets for action items
```

---

## Validation Rules

1. **File must be valid YAML**
2. **Top-level keys** must be from the known set (see sections above)
3. **Required types**:
   - `experience`, `technical_level`, `generation`, `construct_name`: strings
   - `philosophy`, `primary`, `traits`, etc.: arrays of strings
   - `workflow`: object with nested arrays

4. **String lengths** (recommendations):
   - Individual strings: < 500 characters
   - Total file: < 10KB (to fit in reasonable context windows)

5. **No executable code** in strings (basic security check)

---

## Best Practices

### Content Guidelines

1. **Be specific but concise**: "Prefer bash commands over MCP" vs "I like command line"
2. **Focus on actionable preferences**: Things Claude can actually adapt to
3. **Avoid redundancy**: Don't repeat the same concept in multiple sections
4. **Update as you evolve**: This is a living document

### Organization

1. **Start minimal**: Begin with just `working_style` and `technical_approach`
2. **Grow organically**: Add sections as you identify patterns in what you're telling Claude
3. **Review periodically**: Every few months, check if preferences still match reality

### Version Control

1. **Keep in private repo**: This is personal information
2. **Commit changes**: Track how your preferences evolve
3. **Branch for experiments**: Try new approaches without losing current setup

---

## Migration from Other Formats

### From Claude Chat Preferences (Prose)
1. Identify key themes in your prose
2. Map to schema sections
3. Convert narrative statements to bullet points
4. Test export to verify transformation quality

### From Existing CLAUDE.md Files
1. Extract personal preferences (not project-specific)
2. Map technical sections to `technical_approach`
3. Map communication sections to `working_style`
4. Leave project-specific content in project CLAUDE.md files

---

## Future Extensions

Planned schema additions:
- `scope_overrides`: Explicit per-section scope control
- `profiles`: Multiple preference sets for different contexts
- `templates`: Reusable preference snippets
- `conditional`: Context-dependent preferences

---

**Schema Version**: 1.0.0  
**Last Updated**: October 2025
