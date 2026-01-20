#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = '/Users/Shared/passion-os-next';
process.chdir(root);

// Files to move
const scripts = [
  ".final-cleanup.sh",
  ".phase4-completion.sh",
  ".phase4-script.sh",
  ".phase5-cleanup.sh",
  ".phase5-direct-moves.sh",
  ".phase7-verify.sh",
  "root-cleanup.sh"
];

const docs = [
  "CLEANUP_NEEDED.md",
  "COMPLETION_VERIFICATION.md",
  "COMPREHENSIVE_SESSION_SUMMARY.md",
  "FINAL_COMPLETION_SUMMARY.md",
  "FINAL_SESSION_SUMMARY_JAN20_2026.md",
  "INDEX.md",
  "NEXT_SESSION_KICKOFF.md",
  "ORGANIZATION_STATUS.md",
  "PHASE_2_MIGRATION_COMPLETE.md",
  "PHASE_3_CONSOLIDATION_COMPLETE.md",
  "PHASE_4B_COMPLETION_HANDOFF.md",
  "PROJECT_COMPLETION_REPORT_JAN20_2026.md",
  "PROJECT_FINAL_STATUS_JAN20_2026.md",
  "QUICK_REFERENCE.md",
  "ROOT_ORGANIZATION_STATUS.md",
  "SESSION_SUMMARY_JAN19_2026_PART2.md",
  "START_HERE.md",
  "STRUCTURE.md"
];

const junk = [
  ".commit-msg.txt",
  ".verify-status.txt",
  "tree.json"
];

function move(src, dest) {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    try {
      execSync(`git mv "${src}" "${dest}"`, { stdio: 'pipe' });
      return true;
    } catch (e) {
      // Already moved or git issue - try fs
      try {
        fs.renameSync(src, dest);
        execSync(`git add "${dest}"`, { stdio: 'pipe' });
        return true;
      } catch (e2) {
        return false;
      }
    }
  }
  return false;
}

console.log('\n🧹 ROOT CLEANUP EXECUTING\n');

// Ensure directories exist
fs.mkdirSync('.scripts', { recursive: true });
fs.mkdirSync('management/archive', { recursive: true });
fs.mkdirSync('maintenance/archive', { recursive: true });

console.log('1️⃣  Moving scripts to .scripts/');
scripts.forEach(f => {
  if (move(f, `.scripts/${f}`)) console.log(`  ✓ ${f}`);
});

console.log('\n2️⃣  Moving docs to management/archive/');
docs.forEach(f => {
  if (move(f, `management/archive/${f}`)) console.log(`  ✓ ${f}`);
});

console.log('\n3️⃣  Moving utility files');
junk.forEach(f => {
  if (move(f, `maintenance/archive/${f}`)) console.log(`  ✓ ${f}`);
});

console.log('\n4️⃣  ROOT DIRECTORY CLEANUP COMPLETE\n');
console.log('ROOT NOW CONTAINS:');
console.log('=' .repeat(50));

const files = fs.readdirSync('.').filter(f => fs.statSync(f).isFile() && !f.startsWith('.')).sort();
const dirs = fs.readdirSync('.').filter(d => fs.statSync(d).isDirectory() && !d.startsWith('.')).sort();

files.forEach(f => console.log(`  📄 ${f}`));
dirs.forEach(d => console.log(`  📁 ${d}/`));

console.log(`\n✅ ${files.length} files + ${dirs.length} core directories\n`);
