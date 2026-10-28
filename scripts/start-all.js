#!/usr/bin/env node
/**
 * VidyaOS Multi-Port Runtime Orchestrator
 * 
 * Runs all three frontend environments concurrently:
 *   - Port 3000: Legacy Frontend (frontend/)
 *   - Port 3001: Modern Frontend V2 (frontend-v2/)
 *   - Port 3002: Dev 2 Collaboration Preview (frontend_dev2/)
 * 
 * All instances connect to the unified SQLite database:
 *   backend/college_attendance.sqlite
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const dev2Dir = path.join(rootDir, 'frontend_dev2');

const V1_PORT = process.env.PORT_V1 || 3000;
const V2_PORT = process.env.PORT_V2 || 3001;
const DEV2_PORT = process.env.PORT_DEV2 || 3002;

console.log('\n======================================================');
console.log('🚀 VIDYAOS TRI-PORT MULTI-RUNTIME');
console.log('======================================================');
console.log(`📡 Port ${V1_PORT}  ➜  V1 Legacy Frontend (frontend/)`);
console.log(`📡 Port ${V2_PORT}  ➜  V2 Modern Frontend (frontend-v2/)`);
console.log(`📡 Port ${DEV2_PORT}  ➜  Dev 2 Workspace     (frontend_dev2/)`);
console.log(`🗄️ Database : backend/college_attendance.sqlite (Shared)`);
console.log('------------------------------------------------------');
console.log(`🔗 Browser Access:`);
console.log(`   ➜ V1 Old Frontend   : http://localhost:${V1_PORT}`);
console.log(`   ➜ V2 Modern Frontend: http://localhost:${V2_PORT}`);
console.log(`   ➜ Dev 2 Workspace   : http://localhost:${DEV2_PORT}`);
console.log('======================================================\n');

const children = [];

// 1. V1 Server
children.push(spawn(
  process.execPath,
  ['-e', `process.env.PORT=${V1_PORT}; process.env.FRONTEND_DIR='../frontend'; require('./server.js')`],
  { cwd: backendDir, stdio: 'inherit', env: { ...process.env, PORT: String(V1_PORT), FRONTEND_DIR: '../frontend' } }
));

// 2. V2 Server
children.push(spawn(
  process.execPath,
  ['-e', `process.env.PORT=${V2_PORT}; process.env.FRONTEND_DIR='../frontend-v2'; require('./server.js')`],
  { cwd: backendDir, stdio: 'inherit', env: { ...process.env, PORT: String(V2_PORT), FRONTEND_DIR: '../frontend-v2' } }
));

// 3. Dev 2 Server (if directory exists)
if (fs.existsSync(dev2Dir)) {
  children.push(spawn(
    process.execPath,
    ['-e', `process.env.PORT=${DEV2_PORT}; process.env.FRONTEND_DIR='../frontend_dev2'; require('./server.js')`],
    { cwd: backendDir, stdio: 'inherit', env: { ...process.env, PORT: String(DEV2_PORT), FRONTEND_DIR: '../frontend_dev2' } }
  ));
} else {
  console.warn(`[WARN] frontend_dev2/ directory not found. Skipping Port ${DEV2_PORT}.`);
}

function shutdown() {
  console.log('\nShutting down all runtime instances...');
  children.forEach(child => {
    try { child.kill(); } catch (_) {}
  });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
