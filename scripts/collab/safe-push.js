#!/usr/bin/env node
/**
 * Vidya Safe Push Utility (Frontend Protection)
 * 
 * Safely commits and pushes backend, database, scripts, and documentation changes
 * to GitHub (origin main) while EXCLUDING local frontend/ changes to prevent
 * accidentally overwriting or breaking Dev 2's ongoing frontend contributions.
 * 
 * Usage:
 *   npm run push:backend "commit message"
 *   npm run push:safe "commit message"
 *   node scripts/collab/safe-push.js "commit message"
 * 
 * To intentionally include reviewed frontend changes (after collab:apply):
 *   node scripts/collab/safe-push.js "commit message" --include-frontend
 */

const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const includeFrontend = args.includes('--include-frontend');
const commitMsg = args.filter(a => a !== '--include-frontend').join(' ');

if (!commitMsg) {
  console.error('\n❌ Error: Commit message required.');
  console.log('Usage:');
  console.log('  npm run push:safe "Your commit message"\n');
  process.exit(1);
}

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'], ...opts });
}

console.log('\n======================================================');
console.log('🛡️ VIDYA SAFE PUSH: REPOSITORY SYNC');
console.log('======================================================');

// Check status of frontend/
let hasFrontendChanges = false;
try {
  const feStatus = execSync('git status --porcelain frontend/', { cwd: rootDir, encoding: 'utf8' }).trim();
  hasFrontendChanges = !!feStatus;
} catch (e) {}

if (hasFrontendChanges && !includeFrontend) {
  console.log('⚠️  Notice: Local changes detected in frontend/.');
  console.log('   Excluding frontend/ from this commit to protect Dev 2\'s code.\n');
}

// Stage protected files (backend, database, documentation, scripts)
run('git add backend/ TODO.md AGENTS.md CONTRIBUTING_FRONTEND.md DEV2_ANTIGRAVITY_INSTRUCTIONS.md package.json scripts/ .github/ .gitignore');

if (includeFrontend) {
  console.log('✨ Including approved frontend/ changes (--include-frontend specified)...');
  run('git add frontend/');
}

// Check if any files were staged
let staged = '';
try {
  staged = execSync('git diff --name-only --cached', { cwd: rootDir, encoding: 'utf8' }).trim();
} catch (e) {}

if (!staged) {
  console.log('ℹ️  No non-frontend changes staged. Checking for unpushed commits...');
} else {
  console.log('📦 Staged files:');
  staged.split('\n').forEach(f => console.log(`   + ${f}`));
  console.log(`\nCommitting: "${commitMsg}"`);
  run(`git commit -m "${commitMsg}"`);
}

console.log('\n🚀 Pushing to origin main...');
run('git push origin main');
console.log('✅ Successfully pushed to https://github.com/onebotyt/Vidya.git\n');
