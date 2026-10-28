#!/usr/bin/env node
/**
 * Vidya Collaboration Engine: Secondary Preview Server
 * 
 * Runs the Express server on Port 3001 pointing to the 2nd developer's 'frontend_dev2/'
 * while connecting to the same unified SQLite database.
 * 
 * Allows live, side-by-side browser previewing:
 *   - Primary Server: http://localhost:3000  (Your frontend/)
 *   - Preview Server: http://localhost:3001  (2nd Dev frontend_dev2/)
 * 
 * Usage:
 *   node scripts/collab/preview-server.js
 *   npm run collab:preview
 */

const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../..');
const dev2Dir = path.join(rootDir, 'frontend_dev2');

if (!fs.existsSync(dev2Dir)) {
  console.error('\n❌ Error: frontend_dev2/ directory does not exist.');
  console.log('Run this first to pull the 2nd developer\'s code from GitHub:');
  console.log('  npm run collab:pull <branch-name>\n');
  process.exit(1);
}

const previewPort = process.env.COLLAB_PORT || 3002;

process.env.PORT = previewPort;
process.env.FRONTEND_DIR = path.relative(path.join(rootDir, 'backend'), dev2Dir);

console.log('\n======================================================');
console.log('🚀 VIDYA COLLAB: DEV 2 PREVIEW SERVER LAUNCHING');
console.log('======================================================');
console.log(`📡 Port          : ${previewPort}`);
console.log(`📁 Serving Folder: ${dev2Dir}`);
console.log(`🗄️ Database      : backend/college_attendance.sqlite (Shared)`);
console.log('------------------------------------------------------');
console.log(`🔗 Compare live in your browser:`);
console.log(`   - V1 Legacy Frontend  : http://localhost:3000`);
console.log(`   - V2 Modern Frontend  : http://localhost:3001`);
console.log(`   - Dev 2 Preview Copy  : http://localhost:${previewPort}`);
console.log('======================================================\n');

// Require main backend server (it will initialize on port 3001 serving frontend_dev2)
require(path.join(rootDir, 'backend/server.js'));
