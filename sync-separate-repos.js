#!/usr/bin/env node
/**
 * VidyaOS Standalone Repository Sync Engine
 * Synchronizes frontend/ and backend/ to their respective standalone GitHub repositories:
 *   - frontend/ -> https://github.com/onebotyt/VidyaOS.git
 *   - backend/  -> https://github.com/onebotyt/VidyaOS_BackEnd.git
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const commitMsg = process.argv.slice(2).join(' ') || 'sync: update from Vidya monorepo';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'], ...opts });
  } catch (err) {
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    throw err;
  }
}

console.log('\n==========================================');
console.log('🔄 SYNCING SEPARATE GITHUB REPOSITORIES');
console.log('==========================================');

// 1. Sync Frontend
const frontendGit = path.join(rootDir, '.git_standalone', 'frontend.git');
const frontendWorkTree = path.join(rootDir, 'frontend');

console.log('\n📦 [1/2] Syncing Frontend (onebotyt/VidyaOS)...');
if (fs.existsSync(frontendGit)) {
  run(`git --git-dir="${frontendGit}" --work-tree="${frontendWorkTree}" add -A`);
  const status = run(`git --git-dir="${frontendGit}" --work-tree="${frontendWorkTree}" status --porcelain`).trim();
  if (status) {
    console.log(`Changes detected. Committing: "${commitMsg}"`);
    run(`git --git-dir="${frontendGit}" --work-tree="${frontendWorkTree}" commit -m "${commitMsg}"`);
    run(`git --git-dir="${frontendGit}" --work-tree="${frontendWorkTree}" push origin main`);
    console.log('✅ Frontend successfully pushed to https://github.com/onebotyt/VidyaOS.git');
  } else {
    console.log('ℹ️  Frontend is clean — already up to date with origin/main.');
  }
} else {
  console.warn(`⚠️ Frontend git directory not found at: ${frontendGit}`);
}

// 2. Sync Backend
const backendGit = path.join(rootDir, '.git_standalone', 'backend.git');
const backendWorkTree = path.join(rootDir, 'backend');

console.log('\n📦 [2/2] Syncing Backend (onebotyt/VidyaOS_BackEnd)...');
if (fs.existsSync(backendGit)) {
  run(`git --git-dir="${backendGit}" --work-tree="${backendWorkTree}" add -A`);
  const status = run(`git --git-dir="${backendGit}" --work-tree="${backendWorkTree}" status --porcelain`).trim();
  if (status) {
    console.log(`Changes detected. Committing: "${commitMsg}"`);
    run(`git --git-dir="${backendGit}" --work-tree="${backendWorkTree}" commit -m "${commitMsg}"`);
    run(`git --git-dir="${backendGit}" --work-tree="${backendWorkTree}" push origin main`);
    console.log('✅ Backend successfully pushed to https://github.com/onebotyt/VidyaOS_BackEnd.git');
  } else {
    console.log('ℹ️  Backend is clean — already up to date with origin/main.');
  }
} else {
  console.warn(`⚠️ Backend git directory not found at: ${backendGit}`);
}

console.log('\n🎉 Synchronization complete!\n');
