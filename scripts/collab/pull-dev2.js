#!/usr/bin/env node
/**
 * Vidya Collaboration Engine: Pull 2nd Developer Frontend
 * 
 * Safely fetches the 2nd developer's branch from GitHub and extracts ONLY
 * the frontend/ directory into the isolated 'frontend_dev2/' folder.
 * 
 * Your working tree, backend, SQLite database, and git status remain 100% untouched.
 * 
 * Usage:
 *   node scripts/collab/pull-dev2.js <branch-name-or-pr>
 *   npm run collab:pull <branch-name-or-pr>
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../..');
const targetDir = path.join(rootDir, 'frontend_dev2');

let ref = process.argv[2];

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts });
}

console.log('\n======================================================');
console.log('🔄 VIDYA COLLAB: PULL 2ND DEV FRONTEND INTO MIRROR');
console.log('======================================================');

// If no branch specified, list available remote branches or use origin/main
if (!ref) {
  try {
    const remoteBranches = run('git branch -r')
      .split('\n')
      .map(b => b.trim())
      .filter(b => b && !b.includes('->') && !b.includes('origin/HEAD'));
    
    console.log('\nℹ️  No branch specified. Available remote branches:');
    remoteBranches.forEach(b => console.log(`   - ${b.replace('origin/', '')}`));
    
    // Default to main if not provided
    ref = 'origin/main';
    console.log(`\nDefaulting to: ${ref}`);
    console.log('To pull a specific feature branch, run:');
    console.log('  npm run collab:pull <branch-name>\n');
  } catch (e) {
    ref = 'HEAD';
  }
}

// Ensure ref has origin/ prefix if it's a remote branch and user typed short name
let gitRef = ref;
if (!gitRef.startsWith('origin/') && gitRef !== 'HEAD' && !gitRef.startsWith('refs/')) {
  // Check if branch exists locally or remotely
  try {
    run(`git rev-parse --verify ${gitRef}`);
  } catch (e) {
    // If not local, try fetching from origin
    console.log(`📡 Fetching "${gitRef}" from origin...`);
    try {
      run(`git fetch origin ${gitRef}`);
      gitRef = `origin/${gitRef}`;
    } catch (fetchErr) {
      // Try resolving directly as origin/<branch>
      gitRef = `origin/${gitRef}`;
    }
  }
}

// Verify gitRef exists
try {
  const commitHash = run(`git rev-parse ${gitRef}`).trim();
  const commitLog = run(`git log -1 --pretty=format:"%h - %an (%cr): %s" ${gitRef}`).trim();
  
  console.log(`\n📦 Target Commit: ${commitLog}`);
  console.log(`   Hash: ${commitHash}`);
  
  // Prepare clean frontend_dev2 directory
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // Extract frontend from the specified git reference without altering working tree
  const isWindows = process.platform === 'win32';
  const tarCmd = `git archive "${gitRef}" frontend | tar -x -C "${targetDir}" --strip-components=1`;
  
  run(tarCmd);

  const fileCount = fs.readdirSync(targetDir).length;
  console.log(`\n✅ Successfully extracted ${fileCount} top-level folders/files into:`);
  console.log(`   ${targetDir}`);

  console.log('\n------------------------------------------------------');
  console.log('🎯 Next Steps:');
  console.log('  1. Compare changes with your version:');
  console.log('     npm run collab:diff');
  console.log('  2. Preview 2nd dev frontend in browser (Port 3001):');
  console.log('     npm run collab:preview');
  console.log('  3. Selectively copy approved files into your frontend:');
  console.log('     npm run collab:apply <path-to-file-or-folder>');
  console.log('------------------------------------------------------\n');

} catch (err) {
  console.error(`\n❌ Error: Failed to pull frontend from ref "${ref}".`);
  console.error(err.stderr || err.message);
  process.exit(1);
}
