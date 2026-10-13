#!/usr/bin/env node
/**
 * Vidya Monorepo & Standalone Repos Unified Push
 * 1. Commits and pushes to Monorepo: https://github.com/onebotyt/Vidya.git
 * 2. Synchronizes to Frontend:      https://github.com/onebotyt/VidyaOS.git
 * 3. Synchronizes to Backend:       https://github.com/onebotyt/VidyaOS_BackEnd.git
 */

const { execSync } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const commitMsg = process.argv.slice(2).join(' ');

if (!commitMsg) {
  console.error('❌ Error: Commit message required.');
  console.log('Usage: node push-all.js "Your commit message"');
  process.exit(1);
}

function run(cmd) {
  try {
    return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });
  } catch (err) {
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    throw err;
  }
}

console.log('\n==========================================');
console.log('🚀 PUSHING ALL VIDYA REPOSITORIES');
console.log('==========================================');

// 1. Monorepo (Vidya)
console.log('\n📦 [1/3] Monorepo (onebotyt/Vidya)...');
run('git add -A');
const status = run('git status --porcelain').trim();
if (status) {
  console.log(`Committing: "${commitMsg}"`);
  run(`git commit -m "${commitMsg}"`);
  run('git push origin main');
  console.log('✅ Monorepo pushed to https://github.com/onebotyt/Vidya.git');
} else {
  console.log('ℹ️  Monorepo has no uncommitted changes. Pushing any pending commits...');
  run('git push origin main');
  console.log('✅ Monorepo is up to date.');
}

// 2 & 3. Sync Standalone Repos
require('./sync-separate-repos.js');
