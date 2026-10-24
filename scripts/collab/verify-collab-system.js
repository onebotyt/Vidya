/**
 * Vidya Collaboration System Verification Script
 * Validates PR guard, CODEOWNERS, gitignore, contributor documentation, and collab CLI scripts.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('🧪 VERIFYING GITHUB COLLABORATION & DUAL-FRONTEND SUITE');
console.log('======================================================\n');

// 1. Check CI & Governance Files
const prGuardPath = path.join(rootDir, '.github/workflows/frontend-pr-guard.yml');
assert(fs.existsSync(prGuardPath), '.github/workflows/frontend-pr-guard.yml exists');
if (fs.existsSync(prGuardPath)) {
  const content = fs.readFileSync(prGuardPath, 'utf8');
  assert(content.includes('pull_request') && content.includes('frontend/'), 'frontend-pr-guard.yml triggers on PR and checks frontend/ prefix');
}

const codeOwnersPath = path.join(rootDir, '.github/CODEOWNERS');
assert(fs.existsSync(codeOwnersPath), '.github/CODEOWNERS exists');
if (fs.existsSync(codeOwnersPath)) {
  const content = fs.readFileSync(codeOwnersPath, 'utf8');
  assert(content.includes('/backend/') && content.includes('@onebotyt'), 'CODEOWNERS restricts backend/ and root to @onebotyt');
}

// 2. Check .gitignore
const gitignorePath = path.join(rootDir, '.gitignore');
assert(fs.existsSync(gitignorePath), '.gitignore exists');
if (fs.existsSync(gitignorePath)) {
  const content = fs.readFileSync(gitignorePath, 'utf8');
  assert(content.includes('frontend_dev2/'), '.gitignore ignores frontend_dev2/');
}

// 3. Check Documentation
const contribPath = path.join(rootDir, 'CONTRIBUTING_FRONTEND.md');
assert(fs.existsSync(contribPath), 'CONTRIBUTING_FRONTEND.md exists');
if (fs.existsSync(contribPath)) {
  const content = fs.readFileSync(contribPath, 'utf8');
  assert(content.includes('http://localhost:3000') && content.includes('frontend/'), 'Contributor guide documents local server and frontend-only rules');
}

const dev2GuidePath = path.join(rootDir, 'DEV2_ANTIGRAVITY_INSTRUCTIONS.md');
assert(fs.existsSync(dev2GuidePath), 'DEV2_ANTIGRAVITY_INSTRUCTIONS.md exists');
if (fs.existsSync(dev2GuidePath)) {
  const content = fs.readFileSync(dev2GuidePath, 'utf8');
  assert(content.includes('TODO.md') && content.includes('backend/college_attendance.sqlite'), 'DEV2 guide mandates TODO.md updates and documents pre-seeded SQLite DB');
}

// 4. Check SQLite Database Tracking Status
const dbPath = path.join(rootDir, 'backend/college_attendance.sqlite');
assert(fs.existsSync(dbPath), 'backend/college_attendance.sqlite exists');
let isDbIgnored = false;
try {
  execSync('git check-ignore -q backend/college_attendance.sqlite', { cwd: rootDir, stdio: 'pipe' });
  isDbIgnored = true;
} catch (e) {
  isDbIgnored = false;
}
assert(!isDbIgnored, 'backend/college_attendance.sqlite is NOT gitignored (tracked for Dev 2 onboarding)');


// 4. Check Scripts Syntax
const scripts = ['pull-dev2.js', 'diff-dev2.js', 'apply-dev2.js', 'preview-server.js'];
scripts.forEach(s => {
  const p = path.join(rootDir, 'scripts/collab', s);
  assert(fs.existsSync(p), `scripts/collab/${s} exists`);
  try {
    execSync(`node -c "${p}"`, { stdio: 'pipe' });
    assert(true, `scripts/collab/${s} passes syntax check`);
  } catch (e) {
    assert(false, `scripts/collab/${s} has syntax errors: ${e.message}`);
  }
});

// 5. Check Dynamic FRONTEND_DIR Support in backend/server.js
const serverJsPath = path.join(rootDir, 'backend/server.js');
const serverContent = fs.readFileSync(serverJsPath, 'utf8');
assert(serverContent.includes('process.env.FRONTEND_DIR'), 'backend/server.js supports process.env.FRONTEND_DIR for dual preview');

// 6. Check Root & Backend package.json shortcuts
const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
assert(rootPkg.scripts && rootPkg.scripts['collab:pull'] && rootPkg.scripts['collab:diff'], 'Root package.json exposes collab:pull and collab:diff');

const backendPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'backend/package.json'), 'utf8'));
assert(backendPkg.scripts && backendPkg.scripts['collab:pull'] && backendPkg.scripts['collab:diff'], 'backend/package.json exposes collab:pull and collab:diff');

console.log('\n======================================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
