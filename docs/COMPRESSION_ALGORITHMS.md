# Semantic Compression Algorithm Analysis

> **Note**: This document contains the original analysis and planning for compression strategies. The actual implemented "Hybrid Prose-Bullet" format (see [src/transformers/hybrid-format.js](../src/transformers/hybrid-format.js)) achieves better compression than originally estimated (~885 tokens vs ~1,500 estimated). This document remains useful for understanding the design rationale and trade-offs.

Analysis of different compression strategies for transforming preferences from the canonical YAML format into various token-optimized outputs.

## Current Formats (Baseline)

### Full (claude-md)

- **Size**: 28 KB, 749 lines, 4,057 words
- **Token estimate**: ~7,000 tokens
- **Content**: Everything - all policies, examples, workflows, details
- **Use case**: Claude Code, complete reference

### Ultra-compressed (chat)

- **Size**: 3.3 KB, 13 lines, 475 words
- **Token estimate**: ~850 tokens
- **Compression**: 8.5x from full
- **Content**: Core identity + key preferences only
- **Use case**: claude.ai Custom Instructions (character limit)

## Problem Statement

Need middle ground between:

- ❌ **Full**: Too verbose for chat context (7K tokens)
- ❌ **Chat**: Missing critical policies and workflows

**Goal**: ~2-4K tokens with essential policies but readable compression

---

## Proposed Compression Algorithms

### Option 1: "Essential Policies" (4x compression)

**Algorithm**: Include identity + critical policies, exclude examples

**Include**:

- ✅ Identity (name, role, background)
- ✅ Communication preferences (style, tone)
- ✅ Critical policies (testing, docs, git)
- ✅ Technical stack (frameworks, tools)
- ✅ Key workflows (git commit, PR process)
- ❌ Examples and code snippets
- ❌ Detailed setup instructions
- ❌ Non-critical subsections

**Estimated size**: 7 KB, ~1,750 tokens
**Compression ratio**: 4x from full

**Content breakdown**:

```
Professional Background (3 lines)
Creative Pursuits (5 lines)
Working Style (15 lines)
  - Communication, tone, context management
Technical Stack (10 lines)
  - Languages, frameworks, tools, platforms
Critical Policies (20 lines)
  - Testing (MUST pass)
  - Documentation (MUST update)
  - Git workflow (commit process)
  - Linting (MUST be clean)
Personality (5 lines)
```

---

### Option 2: "Structured Bullets" (6x compression)

**Algorithm**: Bullet-point format, no prose, keep structure

**Include**:

- ✅ All sections from full format
- ✅ Hierarchical structure preserved
- ❌ All prose paragraphs → bullets
- ❌ All examples → removed
- ❌ Explanatory text → removed

**Estimated size**: 4.5 KB, ~1,150 tokens
**Compression ratio**: 6x from full

**Format example**:

```
## Professional Background
- 15-20 years software engineering
- Strong technical background
- Love learning, problem solving

## Working Style
- Communication: summaries, outlines, bullets
- Tone: friendly, dry humor, not pushy
- Context: Show snippets not full files

## Critical Policies
- Tests: MUST pass before commit
- Docs: MUST update (grep all .md files)
- Git: Verify username, no force push to main
```

---

### Option 3: "Hybrid Prose-Bullet" (5x compression)

**Algorithm**: Prose for identity, bullets for policies

**Include**:

- ✅ Identity sections in prose (readable)
- ✅ Technical/policy sections as bullets
- ✅ Critical workflows (condensed)
- ✅ MCP environment selection details
- ❌ Examples
- ❌ Repetitive context

**Estimated size**: 6 KB, ~1,500 tokens
**Compression ratio**: ~4.6x from full

**Format example**:

```
I'm JAX, a competent engineering buddy with 15-20 years practical
software engineering. Strong technical background. Love learning and
problem solving. Prefer understanding what and why over quick fixes.

I make music under "Left Out West" - Producer, lyricist across Hip hop,
Electronica, Dance, Nu metal, Punk, Alt rock. Use AI for music generation.

**Preferences**:
- Communication: High-level summaries, structured outlines
- Tone: Friendly with dry humor, not pushy
- Technical: Node.js, Express, Vitest, Git, GitHub CLI

**Critical Policies**:
- Testing: MUST pass (218 tests), no reduced coverage
- Documentation: MUST update README/docs/*.md (grep for refs)
- Git: Commit process (status→diff→log→commit+push)

**MCP & Environment**:
- Check pronouns: "my/I" (user) = User's machine (MCP), "you/your" (user) = VM (bash_tool)
- Filesystem MCP for configs, CLI MCP for commands, Windows MCP for desktop
- VM space for git/build/test operations
```

---

### Option 4: "Policy-First" (5.5x compression)

**Algorithm**: Critical policies upfront, identity condensed

**Include**:

- ✅ Critical policies first (most important)
- ✅ Technical stack
- ✅ Identity summary (minimal)
- ❌ Creative pursuits (can infer from chat)
- ❌ Detailed workflows

**Estimated size**: 5 KB, ~1,275 tokens
**Compression ratio**: 5.5x from full

**Format example**:

```
## Critical Policies

**Testing**: MUST pass, no reduced coverage, run before commit
**Documentation**: MUST update README + docs/*.md, grep for all refs
**Git**: Status→diff→log→commit, verify username, no force push main
**Linting**: MUST be clean (lint:all), fix all errors before commit

## Technical Stack
Node.js, Express, Vitest, Git, GitHub CLI, VS Code
Platforms: Linux, macOS, Windows

## Identity
JAX - 15-20 years software engineering, dry humor, problem solver
Prefer: summaries + outlines, understand why not quick fixes
Tone: friendly + playful snark, not pushy
```

---

### Option 5: "Smart Sections" (4.5x compression)

**Algorithm**: Include sections based on importance scoring

**Scoring system**:

- Critical (always include): Testing, docs, git, technical stack, MCP
- Important (include): Communication, tone, workflows
- Optional (exclude): Examples, detailed setup, creative pursuits

**Include**:

- ✅ All critical sections (full detail)
- ✅ Important sections (condensed)
- ✅ Identity (minimal)
- ❌ Optional sections

**Estimated size**: 6 KB, ~1,550 tokens
**Compression ratio**: 4.5x from full

**Content distribution**:

- Critical policies: 40% of content
- Technical details: 30% of content
- Communication/style: 20% of content
- Identity: 10% of content

---

## Comparison Table

| Algorithm | Size | Lines | Words | Tokens | Compression | Readability | Completeness |
|-----------|------|-------|-------|--------|-------------|-------------|--------------|
| **Full** | 28 KB | 749 | 4,057 | ~7,000 | 1x | ★★★★★ | ★★★★★ |
| **Essential Policies** | 7 KB | ~188 | 1,015 | ~1,750 | 4x | ★★★★☆ | ★★★★☆ |
| **Smart Sections** | 6 KB | ~150 | 900 | ~1,550 | 4.5x | ★★★★☆ | ★★★★☆ |
| **Hybrid Prose-Bullet** | 6 KB | ~150 | 870 | ~1,500 | 4.6x | ★★★☆☆ | ★★★★☆ |
| **Policy-First** | 5 KB | ~125 | 730 | ~1,275 | 5.5x | ★★★☆☆ | ★★★☆☆ |
| **Structured Bullets** | 4.5 KB | ~115 | 650 | ~1,150 | 6x | ★★☆☆☆ | ★★★☆☆ |
| **Chat (current)** | 3.3 KB | 13 | 475 | ~850 | 8.5x | ★★★★☆ | ★★☆☆☆ |

---

## Detailed Feature Comparison

| Feature | Full | Essential | Smart | Hybrid | Policy-First | Bullets | Chat |
|---------|------|-----------|-------|--------|--------------|---------|------|
| Identity (JAX, background) | ✅ Full | ✅ Full | ✅ Brief | ✅ Full | ✅ Brief | ✅ Bullets | ✅ Brief |
| Creative pursuits (music) | ✅ Full | ✅ Brief | ✅ Brief | ✅ Full | ❌ | ✅ Bullets | ✅ Brief |
| Communication style | ✅ Full | ✅ Full | ✅ Full | ✅ Prose | ✅ Bullets | ✅ Bullets | ✅ Brief |
| Technical stack | ✅ Full | ✅ Full | ✅ Full | ✅ Bullets | ✅ Full | ✅ Bullets | ✅ Brief |
| Testing standards | ✅ Full | ✅ Full | ✅ Full | ✅ Bullets | ✅ Full | ✅ Bullets | ✅ 1 line |
| Documentation policy | ✅ Full | ✅ Full | ✅ Full | ✅ Bullets | ✅ Full | ✅ Bullets | ❌ |
| Git workflow | ✅ Full | ✅ Steps | ✅ Steps | ✅ Brief | ✅ Brief | ✅ Bullets | ✅ 1 line |
| Linting policy | ✅ Full | ✅ Brief | ✅ Full | ✅ Bullets | ✅ Full | ✅ Bullets | ❌ |
| Session continuity | ✅ Full | ❌ | ✅ Brief | ✅ Brief | ❌ | ✅ Bullets | ❌ |
| Self-diagnostics | ✅ Full | ❌ | ❌ | ✅ Brief | ❌ | ✅ Bullets | ❌ |
| Setup instructions | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Examples/code | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **MCP guidance** | ✅ Full | ❌ | ✅ Brief | **✅ Included** | ❌ | ✅ Bullets | ❌ |
| Dependency mgmt | ✅ Full | ❌ | ✅ Brief | ✅ Brief | ❌ | ✅ Bullets | ❌ |

---

## Token Budget Analysis

**claude.ai Custom Instructions limit**: ~1,500 tokens
**Comfortable chat context**: ~2,000-3,000 tokens
**Current chat format**: ~850 tokens (plenty of room)

**Recommendations by use case**:

1. **For claude.ai Custom Instructions** (1,500 token limit):
   - ✅ **Chat (current)**: 850 tokens - fits comfortably
   - ✅ **Structured Bullets**: 1,150 tokens - fits
   - ⚠️ **Policy-First**: 1,275 tokens - tight fit
   - ⚠️ **Hybrid Prose-Bullet**: 1,500 tokens - exactly at limit
   - ❌ Others exceed limit

2. **For rich chat context** (no strict limit, want <3K):
   - ✅ **Hybrid Prose-Bullet**: 1,500 tokens - sweet spot with MCP
   - ✅ **Smart Sections**: 1,550 tokens - good balance
   - ✅ **Essential Policies**: 1,750 tokens - comprehensive

3. **For file-based context** (Claude Code):
   - ✅ **Full**: 7,000 tokens - use complete format

---

## Recommendation: "Hybrid Prose-Bullet with MCP" (4.6x compression)

**Why this algorithm**:

1. **Optimal size**: 1,500 tokens (1.75x current chat, 4.6x compression from full)
2. **Readable**: Prose for identity maintains personality
3. **Complete**: Includes critical policies + MCP details in scannable format
4. **Flexible**: Fits Custom Instructions limit or chat bootstrap

**What you gain over current chat**:

- ✅ Detailed git workflow (not just "use Git")
- ✅ Documentation update requirements (grep all .md files)
- ✅ Linting standards (MUST be clean)
- ✅ Session continuity awareness
- ✅ Self-diagnostics capability
- ✅ **MCP environment selection (pronoun detection, tool selection)**

**What you still lose from full**:

- ❌ Examples and code snippets
- ❌ Detailed setup instructions (Python, Node.js, Git)
- ❌ Full dependency management policy details
- ❌ Complete context management policies

---

## Implementation

To implement "Hybrid Prose-Bullet with MCP" format:

1. Create new transformer: `src/transformers/hybrid-format.js`
2. Add to export options: `claude-context-sync export hybrid`
3. Algorithm:
   - Sections with personality (background, music) → prose paragraphs
   - Sections with policies (testing, docs, git) → bullet lists
   - Include MCP environment selection (critical for Claude Code)
   - Include session continuity and self-diagnostics (condensed)
   - Omit: examples, detailed instructions, repetitive context
   - Target: ~1,500 tokens

## Usage

Once implemented:

```bash
# Export in hybrid format
claude-context-sync export hybrid

# Export to file
claude-context-sync export hybrid > preferences-hybrid.md

# Sync to chat format (keeps current ultra-compressed)
claude-context-sync export chat
```

The hybrid format strikes a balance between completeness and token efficiency, making it ideal for contexts where you need more than just identity but less than the full reference documentation.
