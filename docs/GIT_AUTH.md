# Git Authentication for Claude Instances

**Note**: This document is supplementary. The primary git auth guidance is in JAX's preferences YAML and is automatically available to all Claude instances via `<userPreferences>` tags. This file provides repo-specific details and troubleshooting.

---

## The Fast Path

If you're a Claude instance in JAX's environment, you have the `github-credential-vault` MCP available. Use it:

```javascript
// 1. List available profiles
github-credential-vault:list_profiles()

// 2. Authenticate (usually "default" profile)
github-credential-vault:authenticate_github({ "profile": "default" })

// 3. Push
cd /path/to/repo && git push origin main
```

That's it. Don't mess with manual token configuration, credential helpers, or remote URL manipulation.

## Why This Exists

Claude instances working on this repo tend to forget about the credential vault and try various manual approaches:

- ❌ `git config credential.helper store`
- ❌ `git remote set-url origin https://token@github.com/...`
- ❌ Multiple failed push attempts before finding the credential vault

The credential vault is **already configured** and has the right scopes. Just use it.

## Troubleshooting

### "fatal: could not read Username for 'https://github.com'"

You forgot to authenticate. Use the credential vault first.

### "404 Not Found" or "Permission denied"

Check that you're pushing to the right repository:

```bash
git remote -v
# Should show: nlsherman-24861/claude-context-sync
```

### "Authentication failed"

The token might have expired. Let JAX know - they'll need to refresh it.

## For Other Repositories

If working on a different repository in JAX's environment:

1. Check if it's in the credential vault: `github-credential-vault:list_profiles()`
2. If yes, authenticate with that profile
3. If no, ask JAX to add it or provide auth details

## Common Patterns

### Clone → Work → Push

```bash
# Clone (no auth needed)
git clone https://github.com/nlsherman-24861/some-repo.git
cd some-repo

# Work
# ... make changes ...

# Authenticate BEFORE pushing
github-credential-vault:authenticate_github({ "profile": "default" })

# Configure git identity (if needed)
git config user.email "n+github@nlsherman.com"
git config user.name "nlsherman-24861"

# Push
git push origin main
```

### Already Cloned, Need to Push

```bash
cd /path/to/repo

# Authenticate
github-credential-vault:authenticate_github({ "profile": "default" })

# Push
git push origin main
```

## Notes for Future Claude Instances

- Yes, the credential vault exists
- Yes, it's easier than what you're about to try
- Yes, you should use it first
- No, you don't need to configure anything manually

Think of this as the git equivalent of "did you try turning it off and on again?" but for authentication.

---

**Created**: October 2025  
**Last Updated**: October 2025  
**Reason**: Watching Claude instances fumble with git auth is painful 😅
