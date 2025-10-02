# Claude Code Automation Guide

This repository uses Claude Code GitHub Actions to automate code tasks, reviews, and implementations.

## Quick Start

There are three ways to trigger Claude:

### 1. @claude Mentions (Instant)

Comment `@claude` on any issue or PR to trigger Claude immediately.

```markdown
@claude implement this feature
@claude review these changes
@claude fix the bug in the auth module
```

**What happens:**
- Claude runs immediately
- Automatically applies `claude-task` label for tracking
- Creates a PR with implementation (for issues)
- Adds review comments (for PRs)

**Smart detection:** The system distinguishes between actual mentions and documentation examples:
- ✅ `@claude fix this bug` → Triggers
- ❌ `` Use `@claude` to trigger `` → Doesn't trigger (inline code)
- ❌ Code blocks with `@claude` → Doesn't trigger
- ✅ Code example + real mention → Triggers on the real mention only

### 2. Label-Based (Queued)

Apply the `claude-task` label to any issue to queue it for Claude.

**Steps:**
1. Create or open an issue
2. Click "Labels" → Select `claude-task`
3. Claude automatically starts working

**Best for:**
- Batch processing multiple issues
- Clear visual indicator of "AI-handled" tasks
- Filtering issues (`label:claude-task`)

### 3. Issue Assignment (Optional - Currently Disabled)

You can enable assignment-based triggering by uncommenting the `assignee_trigger` option in `.github/workflows/claude.yml`.

## Setup: Creating the Label

If the `claude-task` label doesn't exist yet:

1. Go to **Settings** → **Labels**
2. Click **New label**
3. Fill in:
   - **Name:** `claude-task`
   - **Description:** `Issues to be handled by Claude automation`
   - **Color:** Choose any (suggestion: `#7B68EE` - purple for AI)
4. Click **Create label**

## Code Block Detection

### How It Works

The system intelligently parses markdown to avoid triggering on documentation:

**Won't trigger on:**
- Inline code: `` Use `@claude` to trigger ``
- Code blocks:
  ````markdown
  ```
  Comment: @claude fix this
  ```
  ````
- HTML code tags: `<code>@claude</code>`
- Pre-formatted text: `<pre>@claude</pre>`

**Will trigger on:**
- Plain text: `@claude help me`
- After code examples: "Example: `@claude` Then actually @claude do it"
- In issue descriptions (but not in code blocks within them)

### Why This Matters

This prevents false triggers from:
- Documentation explaining how to use Claude
- Code examples in PRs or issues
- Quoted commands or syntax examples
- Technical discussions about the automation

### Testing the Detection

You can test the detection logic:

```bash
node .github/scripts/check-claude-mention.js
```

This runs a test suite with various markdown patterns.

## Examples

### Example 1: Quick Bug Fix

**Scenario:** You find a bug and want Claude to fix it right away.

```markdown
Title: Fix validation error in email field

Body:
The email validation is rejecting valid emails with + symbols.
Example: user+tag@example.com should be valid but gets rejected.

Comment: @claude fix this validation bug
```

**Result:** Claude analyzes the code, fixes the validation regex, and creates a PR.

### Example 2: Documentation Without Triggering

**Scenario:** You're documenting how to use Claude automation.

```markdown
Title: Update team documentation

Body:
To trigger Claude automation, use `@claude` in a comment.

Example workflow:
```markdown
@claude implement this feature
```

This won't trigger Claude because @claude is in code blocks.
```

**Result:** No trigger - the system recognizes these are examples.

### Example 3: Mixed Documentation and Action

**Scenario:** Explaining the feature and using it.

```markdown
Title: Add rate limiting

Body:
We should add rate limiting. The pattern is to comment `@claude`
with your request.

For this specific issue: @claude implement rate limiting middleware
using our existing Redis connection.
```

**Result:** Triggers on the second mention (outside code formatting).

### Example 4: Feature Implementation

**Scenario:** You want to queue a feature for later implementation.

```markdown
Title: Add dark mode toggle

Body:
Implement a dark mode toggle in the settings page.

Requirements:
- Toggle button in user settings
- Persist preference in localStorage
- Apply theme across all pages
- Use our existing CSS variable system

Steps:
1. Create the issue
2. Apply `claude-task` label
3. Come back later to review the PR
```

**Result:** Claude works in the background and creates a PR when done.

### Example 5: Code Review Without False Triggers

**Scenario:** Reviewing a PR that discusses Claude automation.

```markdown
PR Description:
This PR adds automation using the `@claude` trigger phrase.

Implementation notes:
- Users type @claude in comments
- System responds automatically

Comment (actual trigger): @claude review this implementation
```

**Result:** Only the comment triggers, not the PR description.

### Example 6: Multiple Related Issues

**Scenario:** Breaking down a large feature into smaller tasks.

```markdown
Issue #10: Implement user authentication - Phase 1: Backend
  → Apply `claude-task` label

Issue #11: Implement user authentication - Phase 2: Frontend
  → Apply `claude-task` label

Issue #12: Implement user authentication - Phase 3: Tests
  → Apply `claude-task` label
```

**Result:** Claude works on each issue sequentially, creating separate PRs.

## Best Practices

### Writing Good Issue Descriptions

Claude works best with clear context:

```markdown
✅ Good:
Title: Add JWT refresh token rotation

Context: We need to improve security by rotating refresh tokens.

Requirements:
- Generate new refresh token on each use
- Invalidate old refresh token
- Update token storage in Redis
- Follow existing auth patterns in /src/auth

Technical notes:
- Use the existing TokenService class
- Add unit tests in __tests__/auth
```

```markdown
❌ Less helpful:
Title: Fix auth

Body: auth is broken, please fix
```

### Using CLAUDE.md for Project Standards

Create a `CLAUDE.md` file in your repo root to set coding standards:

```markdown
# Project Standards

## Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Prefer functional components in React

## Testing
- All new features require unit tests
- Minimum 80% coverage for new code
- Integration tests for API endpoints

## Documentation
- Update README for user-facing features
- Add JSDoc comments for public APIs
- Include examples in documentation

## Git Workflow
- Keep PRs focused on single feature/fix
- Write clear commit messages
- Update CHANGELOG.md
```

Claude respects these guidelines automatically.

### Documenting Automation Safely

When writing documentation about Claude:

```markdown
✅ Safe - won't trigger:
To use automation, type `@claude` in a comment.

✅ Safe - won't trigger:
```
@claude implement feature
```

✅ Safe - will trigger appropriately:
Example: `@claude fix bug`

For this specific issue, @claude please implement it.
```

### Reviewing Claude's Work

Treat Claude like any contributor:

1. **Review the PR** - Don't auto-merge
2. **Run tests** - Ensure CI passes
3. **Check for edge cases** - Claude can miss things
4. **Request changes** - Comment `@claude fix the error handling for null values`
5. **Iterate** - Claude can update PRs based on feedback

## Workflow Integration

### With CI/CD

Claude's PRs trigger your normal CI pipeline:

```yaml
# Your existing CI still runs
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
      - run: npm run lint
```

### With Preview Deployments

If you use Vercel/Netlify/similar:
1. Claude creates PR
2. Preview deployment auto-generates
3. Test the preview before merging

### With Protected Branches

Set up branch protection:
- Require PR reviews
- Require status checks to pass
- Claude's PRs respect all rules

## Loop Prevention

The workflow includes safeguards to prevent infinite loops:

1. **Label check:** Won't re-apply label if already present
2. **Event filtering:** Label application doesn't trigger auto-labeling
3. **Success condition:** Only labels if Claude successfully completes
4. **Code block detection:** Documentation examples don't trigger

## Technical Details

### The Detection Algorithm

The code block detection works by:

1. Check if `@claude` exists in the text
2. Remove all code blocks (```...```)
3. Remove all inline code (`...`)
4. Remove HTML code/pre tags
5. Check if `@claude` still exists in the cleaned text

This ensures documentation and examples never trigger false positives.

### Implementation

The detection logic is implemented in:
- `.github/scripts/check-claude-mention.js` - Reusable function with tests
- `.github/workflows/claude.yml` - Main workflow
- `.github/workflows/claude-code-review.yml` - Review workflow

Both workflows use inline JavaScript via `actions/github-script` for efficiency.

## Troubleshooting

### Claude didn't respond to @claude

**Check:**
1. Is `@claude` inside code blocks or inline code?
2. Check the Actions tab for workflow runs
3. Look for "Check if Claude should be triggered" step logs
4. Ensure `CLAUDE_CODE_OAUTH_TOKEN` secret is set

### Claude triggered on documentation

**Check:**
1. Verify `@claude` is in code blocks or inline code
2. Check Actions logs for detection logic output
3. Review `.github/scripts/check-claude-mention.js` tests

### Claude created the wrong implementation

**Solution:**
1. Comment on the PR with corrections: `@claude update this to use async/await instead of promises`
2. Or close the PR and create a new issue with clearer requirements

### Label not auto-applying

**Check:**
1. Workflow has `issues: write` permission
2. The `claude-task` label exists in the repository
3. Check Actions logs for permission errors
4. Verify the @claude mention wasn't in a code block

## Advanced Configuration

### Custom Trigger Phrase

Change from `@claude` to something else:

```yaml
# In .github/workflows/claude.yml
trigger_phrase: "/ai"
```

Note: You'll need to update the detection logic to look for your custom phrase.

### Allowed Commands

Restrict which bash commands Claude can run:

```yaml
allowed_tools: "Bash(npm install),Bash(npm test),Bash(npm run lint)"
```

### Model Selection

Switch to Claude Opus for complex tasks:

```yaml
model: "claude-opus-4-1-20250805"
```

## Cost Considerations

Each Claude run uses:
- API tokens based on context size
- GitHub Actions minutes

**Tips to optimize:**
- Use for appropriate tasks (not trivial changes)
- Keep issue descriptions focused
- Review and merge PRs promptly
- Monitor usage in GitHub Actions tab

## Security

### What Claude Can Do

✅ Claude can:
- Read repository code
- Create branches and PRs
- Run configured bash commands
- Read CI results

❌ Claude cannot:
- Merge PRs (requires human approval)
- Access secrets beyond what's configured
- Make changes to protected branches directly
- Access other repositories
- Trigger on documentation examples (code block protection)

### Best Practices

1. **Review all PRs** before merging
2. **Enable branch protection** rules
3. **Limit allowed_tools** to safe commands
4. **Audit claude-task issues** regularly
5. **Keep CLAUDE_CODE_OAUTH_TOKEN** secure
6. **Document Claude usage** without triggering false positives

## Getting Help

- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/github-actions)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- Check the Actions tab for workflow runs
- Review detection logic in `.github/scripts/check-claude-mention.js`
- Create an issue with the `question` label
