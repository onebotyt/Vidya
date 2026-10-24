#!/usr/bin/env node
/**
 * Vidya Collaboration Engine: Selective Apply Tool
 * 
 * Safely copies approved files or directories from 'frontend_dev2/' into 'frontend/'.
 * Validates JS syntax before copying to prevent introducing broken scripts.
 * 
 * Usage:
 *   node scripts/collab/apply-dev2.js <file-or-folder-path>
 *   node scripts/collab/apply-dev2.js --all
 *   npm run collab:apply <path>
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../..');
const srcDir = path.join(rootDir, 'frontend_dev2');
const destDir = path.join(rootDir, 'frontend');

if (!fs.existsSync(srcDir)) {
  console.error('\n❌ Error: frontend_dev2/ directory does not exist.');
  console.log('Run this first to pull the 2nd developer\'s code:');
  console.log('  npm run collab:pull <branch-name>\n');
  process.exit(1);
}

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('\n❌ Error: Please specify a file or folder path to apply.');
  console.log('Examples:');
  console.log('  npm run collab:apply student/assignments/');
  console.log('  npm run collab:apply faculty/group-detail/css/core.css');
  console.log('  npm run collab:apply --all\n');
  process.exit(1);
}

console.log('\n======================================================');
console.log('✨ VIDYA COLLAB: SELECTIVE APPLY / MERGE TOOL');
console.log('======================================================\n');

function copyRecursiveSync(src, dest, copiedList = []) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry), copiedList);
    }
  } else {
    // Validate JS syntax before copying
    if (src.endsWith('.js')) {
      try {
        execSync(`node -c "${src}"`, { stdio: 'pipe' });
      } catch (err) {
        console.error(`❌ Syntax Error in 2nd dev file: ${src}`);
        console.error('Aborting copy for this file. Please fix before applying.');
        return;
      }
    }
    
    // Ensure parent dir exists
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    copiedList.push(dest.replace(destDir + path.sep, '').replace(/\\/g, '/'));
  }
  return copiedList;
}

if (inputPath === '--all') {
  console.log('⚠️  Applying ALL files from frontend_dev2 into frontend/...');
  const copied = copyRecursiveSync(srcDir, destDir);
  console.log(`\n✅ Applied ${copied.length} files successfully into frontend/.`);
} else {
  // Clean relative path
  const cleanPath = inputPath.replace(/^(frontend[\\/]|frontend_dev2[\\/])/, '').replace(/\\/g, '/');
  const sourceFullPath = path.join(srcDir, cleanPath);
  const destFullPath = path.join(destDir, cleanPath);

  if (!fs.existsSync(sourceFullPath)) {
    console.error(`❌ Error: Source file or folder not found in frontend_dev2/: "${cleanPath}"\n`);
    process.exit(1);
  }

  const copied = copyRecursiveSync(sourceFullPath, destFullPath);
  console.log(`\n✅ Successfully applied:`);
  copied.forEach(f => console.log(`   + frontend/${f}`));
}

console.log('\n------------------------------------------------------');
console.log('🧪 Verifying Theme Tokens & Regression Suites...');
try {
  execSync('node backend/scripts/test-theme-support.js', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Theme token compliance verified (100% compliant).');
} catch (e) {
  console.warn('⚠️  Warning: Check theme token rules in the applied files.');
}

console.log('\n🎯 Done! Your frontend/ is updated.');
console.log('Check your git status: git status');
console.log('------------------------------------------------------\n');
