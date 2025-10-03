# Transformer Hardcoding Analysis

## Issues Found

### 1. `creative_pursuits` - COMPLETELY HARDCODED
**Problem**: Only handles `.music`, hardcoded "makes music under"
**Location**: All three transformers
**Impact**: Cannot handle writing, visual arts, dance, photography, etc.

**Occurrences**:
- `hybrid-format.js:85-110` - `if (sections.creative_pursuits?.music)`
- `chat-format.js:112-149` - `if (pursuits.music)`
- `claude-md-format.js:101-151` - `if (pursuits.music)`

**Fix**: Iterate over `Object.entries(creative_pursuits)`, use generic language

### 2. `professional_background` - PARTIALLY HARDCODED
**Problem**: Hardcoded "competent engineering buddy", "software engineer"
**Location**: hybrid-format.js, chat-format.js
**Impact**: Assumes all users are engineers

**Occurrences**:
- `hybrid-format.js:67` - `"The user is a competent engineering buddy with"`
- `chat-format.js:95` - `"The user is a software engineer with"`
- `hybrid-format.js:67` - Fallback: `|| '15-20 years practical software engineering'`

**Fix**: Use generic language like "The user has ${experience}" without profession assumption

### 3. Schema Missing `creative_pursuits` Definition
**Problem**: Section mentioned but never defined in SCHEMA.md
**Location**: docs/SCHEMA.md
**Impact**: No contract for what fields are valid/expected

**Fix**: Add full section definition with generic structure

## Hardcoded Strings to Remove

```
✗ "The user is a competent engineering buddy"
✗ "The user is a software engineer"
✗ "makes music under"
✗ "The user makes music"
✗ "regularly engages in discussions about music"
✗ "Use AI for music generation"
✗ Default: "15-20 years practical software engineering"
```

## Generic Patterns to Use

```javascript
// BAD (current)
if (pursuits.music) {
  text += `The user makes music under "${pursuits.music.artist_alias}"`;
}

// GOOD (generic)
for (const [pursuitType, pursuitData] of Object.entries(pursuits)) {
  if (pursuitData.alias || pursuitData.pen_name || pursuitData.artist_alias) {
    const identityField = pursuitData.alias || pursuitData.pen_name || pursuitData.artist_alias;
    text += `The user ${getPursuitVerb(pursuitType)} under "${identityField}"`;
  }
}
```

## Test Coverage Gaps

Current tests only verify:
- ✓ Music creative pursuits (JAX's actual data)
- ✓ Software engineering background (JAX's actual data)

Missing tests for:
- ✗ Writing creative pursuits
- ✗ Visual arts creative pursuits
- ✗ Non-engineering professional backgrounds
- ✗ Multiple simultaneous creative pursuits

## Refactoring Plan

1. **Create generic helper**: `_formatCreativePursuit(pursuitType, pursuitData)` that works for any pursuit
2. **Remove profession assumptions**: `professional_background` shouldn't assume engineer
3. **Update schema**: Add `creative_pursuits` full definition
4. **Add counter-example tests**: Writing, visual arts, non-engineering professions
5. **Document design principles**: Add to default-preferences.yaml as guidance
