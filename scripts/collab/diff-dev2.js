#!/usr/bin/env node
/**
 * Vidya Collaboration Engine: Diff Frontend Versions
 * 
 * Compares your local 'frontend/' directory with the 2nd developer's 'frontend_dev2/'.
 * 
 * Usage:
 *   node scripts/collab/diff-dev2.js                # Summary of all changed files
 *   node scripts/collab/diff-dev2.js <file-path>    # Detailed line-by-line diff
 *   npm run collab:diff
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../..');
const dir1 = path.join(rootDir, 'frontend');
const dir2 = path.join(rootDir, 'frontend_dev2');

if (!fs.existsSync(dir2)) {
  console.error('\n❌ Error: frontend_dev2/ directory does not exist.');
  console.log('Run this first to pull the 2nd developer\'s code:');
  console.log('  npm run collab:pull <branch-name>\n');
  process.exit(1);
}

const targetPath = process.argv[2];

function getAllFiles(dir, base = '') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const relPath = base ? `${base}/${file}` : file;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

console.log('\n======================================================');
console.log('🔍 VIDYA COLLAB: FRONTEND COMPARISON TOOL');
console.log('======================================================');
console.log(`📁 Your Version : frontend/`);
console.log(`📁 2nd Dev Copy : frontend_dev2/\n`);

// Detailed diff for a single file or directory
if (targetPath) {
  // Normalize target path (remove leading frontend/ or frontend_dev2/ if typed)
  const cleanPath = targetPath.replace(/^(frontend[\\/]|frontend_dev2[\\/])/, '').replace(/\\/g, '/');
  const file1 = path.join(dir1, cleanPath);
  const file2 = path.join(dir2, cleanPath);

  if (!fs.existsSync(file1) && !fs.existsSync(file2)) {
    console.error(`❌ Error: File not found in either directory: "${cleanPath}"\n`);
    process.exit(1);
  }

  console.log(`📄 Comparing: ${cleanPath}`);
  console.log('------------------------------------------------------');

  try {
    const diffCmd = `git diff --no-index --color "${file1}" "${file2}"`;
    const output = execSync(diffCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(output || '✅ Files are identical.');
  } catch (err) {
    // git diff exits with code 1 if files differ, stdout has the diff
    if (err.stdout) {
      console.log(err.stdout);
    } else {
      console.error(err.message);
    }
  }
  console.log('------------------------------------------------------\n');
  process.exit(0);
}

// Global Summary Diff
const files1 = new Set(getAllFiles(dir1));
const files2 = new Set(getAllFiles(dir2));

const allFiles = Array.from(new Set([...files1, ...files2])).sort();

const modified = [];
const addedInDev2 = [];
const missingInDev2 = [];
let identicalCount = 0;

for (const f of allFiles) {
  const p1 = path.join(dir1, f);
  const p2 = path.join(dir2, f);

  if (files1.has(f) && !files2.has(f)) {
    missingInDev2.push(f);
  } else if (!files1.has(f) && files2.has(f)) {
    addedInDev2.push(f);
  } else {
    // Both exist, compare contents
    const buf1 = fs.readFileSync(p1);
    const buf2 = fs.readFileSync(p2);
    if (!buf1.equals(buf2)) {
      modified.push(f);
    } else {
      identicalCount++;
    }
  }
}

console.log(`📊 Statistics:`);
console.log(`   Identical Files : ${identicalCount}`);
console.log(`   🟡 Modified     : ${modified.length}`);
console.log(`   🟢 Added by Dev2: ${addedInDev2.length}`);
console.log(`   🔴 Only in Yours: ${missingInDev2.length}\n`);

if (modified.length === 0 && addedInDev2.length === 0 && missingInDev2.length === 0) {
  console.log('🎉 Your frontend and 2nd dev frontend are 100% IDENTICAL!\n');
  process.exit(0);
}

if (modified.length > 0) {
  console.log('🟡 MODIFIED FILES (Differences found):');
  modified.forEach(f => console.log(`   ~ ${f}`));
  console.log('');
}

if (addedInDev2.length > 0) {
  console.log('🟢 NEW FILES (Created by 2nd developer):');
  addedInDev2.forEach(f => console.log(`   + ${f}`));
  console.log('');
}

if (missingInDev2.length > 0) {
  console.log('🔴 FILES MISSING IN 2ND DEV COPY:');
  missingInDev2.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

console.log('------------------------------------------------------');
console.log('💡 Quick Actions:');
console.log('  - View detailed diff of a specific file:');
console.log('    npm run collab:diff <file-path>');
console.log('  - Apply / merge a specific file into your frontend:');
console.log('    npm run collab:apply <file-path>');
console.log('  - Run live side-by-side preview:');
console.log('    npm run collab:preview');
console.log('------------------------------------------------------\n');
