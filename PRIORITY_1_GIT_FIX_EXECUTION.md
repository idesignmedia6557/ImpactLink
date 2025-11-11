# PRIORITY 1: GIT CASE SENSITIVITY FIX EXECUTION

**CRITICAL BLOCKER** - Execute these 7 commands to unblock all other work
**Estimated Time:** 5-10 minutes

## THE 7 COMMANDS (Copy & Paste)

```bash
# Step 1: Clone repository
git clone https://github.com/idesignmedia6557/ImpactLink.git
cd ImpactLink

# Step 2: Configure Git for case sensitivity
git config core.ignorecase false

# Step 3: Remove files from cache
git rm --cached frontend/src/pages/*.tsx

# Step 4: Re-add files with correct casing
git add frontend/src/pages/

# Step 5: Commit the fix
git commit -m "fix(ci): Correct file casing for Linux CI/CD"

# Step 6: Push to GitHub
git push origin main
```

## Step 7: Verify Success

1. Go to: https://github.com/idesignmedia6557/ImpactLink/actions
2. Wait for "Deploy ImpactLink Frontend" workflow to run
3. ✅ GREEN CHECKMARK = SUCCESS
4. ❌ RED X = Need to troubleshoot

## What Each Command Does

| Command | Purpose | Result |
|---------|---------|--------|
| `git clone` | Download repository | Repository on your machine |
| `git config core.ignorecase false` | Enable case sensitivity | Git treats Home.tsx differently from home.tsx |
| `git rm --cached` | Remove cached files | Files listed with correct names |
| `git add frontend/src/pages/` | Re-add files | Files re-indexed with correct casing |
| `git commit` | Create commit | Commit recorded with proper casing |
| `git push origin main` | Upload to GitHub | GitHub receives the fix |

## Expected Output

**After Step 3 (git rm --cached):**
```
rm 'frontend/src/pages/CharityProfile.tsx'
rm 'frontend/src/pages/Discover.tsx'
rm 'frontend/src/pages/Donate.tsx'
rm 'frontend/src/pages/Home.tsx'
rm 'frontend/src/pages/NotFound.tsx'
rm 'frontend/src/pages/UserDashboard.tsx'
```

**After Step 5 (git commit):**
```
[main abc1234] fix(ci): Correct file casing for Linux CI/CD
 7 files changed, 0 insertions(+), 0 deletions(-)
 rename frontend/src/pages/{home.tsx => Home.tsx} (100%)
```

## Troubleshooting

**"fatal: path spec did not match any files"**
- Solution: Run `ls frontend/src/pages/` to verify files exist

**"rejected...pre-receive hook declined"**
- Solution: Run `git pull origin main` then try push again

**Build still failing after push**
- Wait 60 seconds for GitHub Actions
- Check Actions page for error details
- Review Issue #1 for additional help

## Success Criteria

✅ GitHub Actions shows GREEN CHECKMARK
✅ Build completes in ~30-60 seconds
✅ No module resolution errors

## NEXT: Priority 2

Once build succeeds:
1. ✅ Priority 1 COMPLETE
2. 👉 Start Priority 2: Debug Frontend Errors
   - See DEVELOPMENT_SETUP_GUIDE.md
   - Run: `npm install && npm start`

---

**Ready? Copy the 7 commands above and run them now in your terminal!** 🚀

Questions? See Issue #1 or IMPLEMENTATION_START_GUIDE.md for full details.
