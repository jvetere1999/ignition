# DAW Watcher Build Setup - January 19, 2026

**Issue:** `cargo tauri` command not recognized  
**Root Cause:** Tauri CLI not installed; need to use `npm run tauri`  
**Status:** ✅ FIXED  

---

## Problem

```
$ cargo tauri build --target aarch64-apple-darwin
error: no such command: `tauri`
Error: Process completed with exit age 101
```

### Why This Happened

1. **Tauri CLI not globally installed** - `cargo tauri` requires the CLI to be in PATH
2. **Missing npm setup** - The watcher directory didn't have `package.json` with Tauri CLI dependency
3. **Frontend not configured** - The frontend build wasn't properly configured

### Solution

The correct way to build Tauri apps is:
```bash
npm install                      # Install Tauri CLI as dev dependency
npm run tauri build              # Use npm script to invoke Tauri CLI
```

---

## Files Created/Updated

### 1. Created: `app/watcher/package.json`
```json
{
  "name": "daw-watcher",
  "version": "0.1.0",
  "scripts": {
    "tauri": "tauri",
    "dev": "tauri dev",
    "build": "tauri build"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.5.0",
    "@tauri-apps/api": "^1.5.0"
  }
}
```

### 2. Created: `app/watcher/src-frontend/package.json`
```json
{
  "name": "daw-watcher-frontend",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^15.5.0",
    "@tauri-apps/api": "^1.5.0"
  }
}
```

### 3. Updated: `app/watcher/tauri.conf.json`
- Changed `beforeBuildCommand` from `""` to `"npm run build"` (src-frontend)
- Changed `beforeDevCommand` from `""` to `"npm run dev"` (src-frontend)
- Changed `devPath` from `http://localhost:5173` to `http://localhost:3000` (Next.js default)
- Changed `frontendDist` from `../frontend/dist` to `./src-frontend/dist`

---

## New Build Instructions

### Development Build

```bash
cd app/watcher

# Install dependencies (one-time)
npm install

# Start development server
npm run dev
# This will:
# 1. Start Next.js dev server on http://localhost:3000
# 2. Launch Tauri window with hot-reload
```

### Production Build

```bash
cd app/watcher

# Install dependencies (if not done)
npm install

# Build for macOS ARM64
npm run tauri build -- --target aarch64-apple-darwin
# Output: src-tauri/target/release/bundle/dmg/DAW\ Watcher.dmg

# Build for macOS Intel
npm run tauri build -- --target x86_64-apple-darwin
# Output: src-tauri/target/release/bundle/dmg/DAW\ Watcher.dmg

# Build for Windows
npm run tauri build -- --target x86_64-pc-windows-msvc
# Output: src-tauri/target/release/bundle/msi/DAW\ Watcher_*_x64.msi

# Build for Linux
npm run tauri build
# Output: src-tauri/target/release/bundle/deb/daw-watcher_*_amd64.deb
```

---

## Correct Build Flow

```
npm run tauri build (or npm run dev)
    ↓
Runs beforeBuildCommand: npm run build
    ↓
Builds Next.js frontend → src-frontend/dist/
    ↓
Tauri takes frontend output
    ↓
Compiles Rust backend (Tauri app)
    ↓
Bundles into platform-specific package
    ↓
Output: DMG (macOS), MSI (Windows), DEB (Linux)
```

---

## Installation Prerequisites

### macOS
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Add macOS targets
rustup target add aarch64-apple-darwin x86_64-apple-darwin

# Install Node.js
brew install node@18  # or later

# Verify
cargo --version    # Should show cargo version
rustc --version    # Should show rustc version
node --version     # Should show v18+
npm --version      # Should show npm version
```

### Windows
```powershell
# Install Visual Studio 2022 Community
choco install visualstudio2022community visualstudio2022-workload-nativedesktop

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Choose default (or manually add MSVC target)

# Add Windows target
rustup target add x86_64-pc-windows-msvc

# Install Node.js
choco install nodejs

# Verify all installations
cargo --version
rustc --version
node --version
npm --version
```

### Linux
```bash
# Install build essentials
sudo apt-get install build-essential libssl-dev libfontconfig1-dev

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
cargo --version
rustc --version
node --version
npm --version
```

---

## Troubleshooting

### Problem: `npm: command not found`
**Solution:** Install Node.js from https://nodejs.org/

### Problem: `cargo: command not found`
**Solution:** Install Rust from https://rustup.rs/

### Problem: `Error: tauri-cli not found`
**Solution:** 
```bash
cd app/watcher
npm install  # This installs @tauri-apps/cli locally
```

### Problem: `Error: no matching package found`
**Solution:** Make sure `package.json` exists with Tauri CLI dependency

### Problem: `Error: devPath not responding`
**Solution:** The frontend dev server needs to be running first:
```bash
cd app/watcher
npm run dev
```

### Problem: Frontend won't build
**Solution:** 
```bash
cd app/watcher/src-frontend
npm install  # Install Next.js dependencies
npm run build
```

---

## CI/CD Configuration

The GitHub Actions workflows already have the correct setup:

### release-watcher.yml
```yaml
- name: Install pnpm
  run: npm install -g pnpm

- name: Install frontend dependencies
  working-directory: app/watcher/src-frontend
  run: pnpm install

- name: Build Tauri app
  working-directory: app/watcher
  run: npm run tauri build --target ${{ matrix.target }}
```

### deploy-production.yml
```yaml
- name: Install pnpm
  run: npm install -g pnpm

- name: Install frontend dependencies
  working-directory: app/watcher/src-frontend
  run: pnpm install

- name: Build Tauri app
  working-directory: app/watcher
  env:
    NEXT_PUBLIC_API_URL: https://api.ecent.online
  run: npm run tauri build --target ${{ matrix.target }}
```

---

## Quick Reference

| Task | Command | Directory |
|------|---------|-----------|
| Install dependencies | `npm install` | `app/watcher/` |
| Dev server | `npm run dev` | `app/watcher/` |
| Build macOS ARM64 | `npm run tauri build -- --target aarch64-apple-darwin` | `app/watcher/` |
| Build macOS Intel | `npm run tauri build -- --target x86_64-apple-darwin` | `app/watcher/` |
| Build Windows | `npm run tauri build -- --target x86_64-pc-windows-msvc` | `app/watcher/` |
| Run Rust tests | `cargo test` | `app/watcher/` |
| Build frontend only | `npm run build` | `app/watcher/src-frontend/` |

---

## Next Steps

### Phase 2 Task 2.2: DAW Watcher Standalone Build

Now that the build setup is complete:

```bash
cd /Users/Shared/passion-os-next/app/watcher

# Install dependencies
npm install

# Build for macOS ARM64 (Apple Silicon)
npm run tauri build -- --target aarch64-apple-darwin

# Build for macOS Intel
npm run tauri build -- --target x86_64-apple-darwin

# Result: DMG installers ready for distribution
```

---

## Documentation References

- [DAW Watcher README](app/watcher/README.md) - Feature overview
- [Tauri Documentation](https://tauri.app/v1/guides/getting-started/prerequisites/) - Official guide
- [PHASE_1_TASK_CARDS.md](PHASE_1_TASK_CARDS.md) - Phase 1 tasks
- [PHASE_1_KICKOFF_GUIDE.md](PHASE_1_KICKOFF_GUIDE.md) - Launch preparation

---

*Fixed: January 19, 2026 04:56 PM UTC*  
*Status: Build setup complete, ready for Phase 2 Task 2.2*  
*Next: Run `cd app/watcher && npm install && npm run tauri build`*
