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

## Perspective and Pronoun Usage

The preferences YAML uses a **hybrid model** where different sections represent different perspectives:

1. **User Context Sections** - Facts about you (the human user)
   - `professional_background`, `creative_pursuits`, `personal_interests`
   - Written as neutral facts: "15-20 years experience", "Love learning"
   - Transformers convert to first-person when exported: "I have 15-20 years experience", "I love learning"

2. **User Preference Sections** - How you want Claude to behave
   - `working_style`, `technical`, `project_defaults`
   - Written as neutral preferences: "High-level summaries", "Tests must pass"
   - Transformers convert to first-person preferences: "I prefer high-level summaries"

3. **Claude Persona Section** - Who Claude should be
   - `personality` (construct_name, traits)
   - Written as neutral attributes: "JAX", "Dry sense of humor"
   - Transformers convert to second-person directives: "Your name is JAX", "You have a dry sense of humor"

**Writing Convention**: Keep YAML values clean and pronounless. Write complete phrases or fragments as appropriate. The schema defines the perspective, and transformers handle pronoun insertion based on output format (chat uses first/second-person, claude-md uses neutral markdown).

**Example**:

```yaml
# User context (about you)
professional_background:
  experience: "15-20 years practical software engineering"
  philosophy:
    - "Love learning and problem solving"        # Fragment OK
    - "Prefer understanding over quick fixes"    # Verb phrase OK

# User preferences (how you want Claude to act)
working_style:
  communication:
    - "High-level summaries with structured outlines"  # Complete phrase

# Claude persona (who Claude should be)
personality:
  construct_name: "JAX"
  traits:
    - "Dry sense of humor"                       # Attribute OK
    - "Shared interests in sci-fi and psychology"
```

**Exported as chat format** (first/second person):
```
I have 15-20 years practical software engineering experience. I love learning and problem solving. I prefer understanding over quick fixes.

I prefer high-level summaries with structured outlines.

Your name is JAX. You have a dry sense of humor and shared interests in sci-fi and psychology.
```

**Exported as claude-md format** (neutral markdown):
```markdown
## Professional Background
- **Experience**: 15-20 years practical software engineering
- Love learning and problem solving
- Prefer understanding over quick fixes

## Working Style
- High-level summaries with structured outlines

## Personality
- **Name**: JAX
- Dry sense of humor
- Shared interests in sci-fi and psychology
```

## Multi-File Preference Layering

**Pattern**: `.claude/preferences.*.yaml`

Projects can add preference layers that extend or supplement the base configuration without coupling to the sync tool. These files are automatically discovered and deep-merged.

### File Locations

```
project-root/
├── CLAUDE.md                           # Generated output (Claude Code reads this)
├── .claude/
│   ├── preferences.yaml                # Base (optional, for projects not using sync)
│   ├── preferences.project-context.yaml   # Layer 1 (project-specific)
│   └── preferences.team-conventions.yaml  # Layer 2 (team overrides)
```

### Discovery and Merge

- Files are discovered alphabetically from `.claude/` directory
- Deep merge: `defaults → base → layer1 → layer2 → ...`
- **Arrays append** (additive): `[A, B] + [C] = [A, B, C]`
- **Objects merge** (later wins): `{x: 1} + {y: 2} = {x: 1, y: 2}`

### Perspective Rules for Layers

**When extending core sections**: Follow that section's perspective rules (see Perspective and Pronoun Usage above)

```yaml
# Extending working_style (user preferences)
working_style:
  communication:
    - "Prefer async code reviews in this project"  # User preference tone
```

**When adding new sections**: Use instructional/directive perspective about the project

```yaml
# New section = project context/requirements
project_specific:
  critical_requirements:
    - "CRITICAL: All API changes need migration guide"  # Directive
  domain_knowledge:
    - "Healthcare SaaS, HIPAA compliant"  # Fact about project
  codebase_context:
    - "Legacy Java → Node.js migration in progress"  # Project state
```

**Mental Model**:
- Extending existing sections → inherit their perspective style
- Adding new sections → write as **instructions/context about the project**
- Use tone: "This project requires...", "Always verify...", "Repository uses..."

### Benefits

- ✅ **Zero coupling**: Developers can add layers without sync tool
- ✅ **Team collaboration**: Different team members can own different layers
- ✅ **Composability**: Share common layers across projects
- ✅ **Discoverability**: `ls .claude/preferences.*.yaml` shows customizations
- ✅ **Sync safety**: `sync-repos` only touches `CLAUDE.md`, never `.claude/preferences.*.yaml`

### Example Layer File

`.claude/preferences.project-context.yaml`:

```yaml
# Project-specific context for this codebase
project_specific:
  identity:
    repository: my-healthcare-app
    domain: Healthcare SaaS

  critical_requirements:
    compliance:
      - "HIPAA compliant - all patient data must be encrypted"
      - "Audit logging required for all data access"
    testing:
      - "Integration tests required for all API endpoints"
      - "Mock external services, never hit real APIs in tests"

  codebase_context:
    architecture:
      - "Microservices architecture with 15 services"
      - "Event-driven communication via RabbitMQ"
    migration_status:
      - "Currently migrating auth service from Java to Node.js"
      - "See docs/MIGRATION.md for migration guide"

# Extend core technical section
technical:
  testing_standards:
    core_requirements:
      - "Minimum 80% code coverage for healthcare services"
      - "Security tests required for authentication flows"
```

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
    mcp_and_environment_selection: # Array of strings (optional)
      - string                # Context disambiguation and tool selection rules
      - string                # Environment decision heuristics
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
    mcp_and_environment_selection:
      - "User's 'my/mine' → User's Machine (MCP tools)"
      - "User's 'you/your' → VM Space (bash_tool)"
      - "For config files: Filesystem MCP first, then CLI MCP"
      - "For code work: Clone to VM, use bash_tool"
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
