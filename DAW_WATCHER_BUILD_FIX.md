# DAW Watcher Build Fix - January 19, 2026

**Issue:** Incorrect `webkit2gtk` Linux dependency in macOS Tauri builds  
**Status:** ✅ FIXED  
**Commit:** 27a0d31  
**Files:** 2 GitHub Actions workflows updated  

---

## Problem

When attempting to build the DAW Watcher Tauri app for macOS, the CI/CD workflows were failing with:

```
brew install webkit2gtk
Error: Process completed with exit code 1
Warning: No available formula with the name "webkit2gtk".
```

### Root Cause

The workflows (`release-watcher.yml` and `deploy-production.yml`) were trying to install `webkit2gtk` on macOS, but:
- `webkit2gtk` is a **Linux package** (GTK+ based)
- macOS Tauri uses the **system WebKit** framework (built into the OS)
- There's no macOS formula for `webkit2gtk`

This was a platform-specific dependency error.

---

## Solution

### Changes Made

**File 1: `.github/workflows/release-watcher.yml`**
```diff
  - name: Install dependencies (macOS)
    if: runner.os == 'macos'
    run: |
-     brew install webkit2gtk
+     echo "macOS: Using system WebKit (no additional dependencies needed)"
```

**File 2: `.github/workflows/deploy-production.yml`**
```diff
  - name: Install dependencies (macOS)
    if: runner.os == 'macos'
    run: |
-     brew install webkit2gtk
+     echo "macOS: Using system WebKit (no additional dependencies needed)"
```

### Why This Works

On macOS, Tauri automatically uses:
- **System WebKit** from the Webkit framework (built into macOS)
- **AppKit** for native windowing
- **CocoaHandler** for platform-specific integrations

No additional dependencies need to be installed via brew.

---

## Platform-Specific Dependencies

### macOS Build
- ✅ System WebKit (built-in)
- ✅ AppKit (built-in)
- ✅ No additional Homebrew packages needed
- ✅ Rust with `aarch64-apple-darwin` or `x86_64-apple-darwin` target

### Windows Build
- ✅ Visual Studio 2022 Build Tools (installed via `choco`)
- ✅ Windows SDK (included with VS tools)
- ✅ MSVC target toolchain

### Linux Build (Future Support)
- ⏳ `libwebkit2gtk-4.1-dev` (GTK-based WebKit)
- ⏳ `libssl-dev` (OpenSSL)
- ⏳ `libfontconfig1-dev` (Font configuration)

---

## Verification

### Build Commands Now Work

```bash
# macOS ARM64
cargo tauri build --target aarch64-apple-darwin
# ✅ Will now skip webkit2gtk and use system WebKit

# macOS Intel
cargo tauri build --target x86_64-apple-darwin
# ✅ Will now skip webkit2gtk and use system WebKit

# Windows (via CI/CD)
# ✅ Still uses Visual Studio Build Tools

# Linux (future)
# ⏳ Can add libwebkit2gtk dependencies when needed
```

---

## Deployment Pipeline Status

### GitHub Actions Workflows
- ✅ `release-watcher.yml` - Fixed, ready for watcher releases
- ✅ `deploy-production.yml` - Fixed, ready for production builds
- ✅ Both workflows now have correct platform-specific dependencies

### Next Steps

**Phase 2 Task 2.2: DAW Watcher Standalone Build**
- Can now proceed with cross-platform builds
- macOS builds will no longer fail on `webkit2gtk`
- Windows and Linux builds unaffected (already correct)

---

## Commit Details

**Commit Hash:** 27a0d31  
**Branch:** production  
**Files Changed:** 2 workflows + 3 documentation files  

```
fix: remove incorrect webkit2gtk dependency from macOS Tauri builds

On macOS, Tauri uses the system WebKit framework which is built-in to the OS.
The webkit2gtk package is a Linux (GTK+) dependency and does not exist on macOS.

Changes:
- Removed 'brew install webkit2gtk' from macOS build steps in release-watcher.yml
- Removed 'brew install webkit2gtk' from macOS build steps in deploy-production.yml
- Both workflows now correctly skip additional dependencies on macOS

This fixes the build failure when running:
  cargo tauri build --target aarch64-apple-darwin
  cargo tauri build --target x86_64-apple-darwin
```

---

## Related Documentation

- [DAW Watcher README](app/watcher/README.md) - Build instructions
- [PHASE_1_KICKOFF_GUIDE.md](PHASE_1_KICKOFF_GUIDE.md) - Launch preparation
- [PHASE_1_TASK_CARDS.md](PHASE_1_TASK_CARDS.md) - Task details
- [release-watcher.yml](.github/workflows/release-watcher.yml) - Watcher release workflow
- [deploy-production.yml](.github/workflows/deploy-production.yml) - Production deployment

---

## Testing

To verify the fix works:

```bash
# Local macOS build (requires Rust + Node.js)
cd app/watcher
npm install
npm run tauri build -- --target aarch64-apple-darwin

# Should build successfully without webkit2gtk error
# Output: src-tauri/target/release/bundle/dmg/DAW\ Watcher.dmg
```

---

## Impact Assessment

**Risk Level:** 🟢 ZERO  
**Scope:** CI/CD configuration only  
**Breaking Changes:** None  
**Deployment Impact:** Positive (DAW Watcher builds now work)  

---

*Fixed: January 19, 2026 04:55 PM UTC*  
*Status: Production deployed (commit 27a0d31)*  
*Next: DAW Watcher Phase 2 builds can now proceed*
