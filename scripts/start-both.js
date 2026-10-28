#!/usr/bin/env node
/**
 * VidyaOS Dual-Port Server Launcher
 * 
 * Runs both frontends simultaneously on 2 different ports:
 *   - Port 3000: Old Frontend (frontend/)
 *   - Port 3001: Modern Frontend V2 (frontend-v2/)
 * 
 * Both instances connect to the same shared SQLite database:
 *   backend/college_attendance.sqlite
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');

const V1_PORT = process.env.PORT_V1 || 3000;
const V2_PORT = process.env.PORT_V2 || 3001;

console.log('\n======================================================');
console.log('🚀 VIDYAOS DUAL-PORT RUNTIME');
console.log('======================================================');
console.log(`📡 Port ${V1_PORT}  ➜  OLD Frontend (frontend/)`);
console.log(`📡 Port ${V2_PORT}  ➜  V2 Frontend  (frontend-v2/)`);
console.log(`🗄️ Database : backend/college_attendance.sqlite (Shared)`);
console.log('------------------------------------------------------');
console.log(`🔗 Browser Access:`);
console.log(`   ➜ Old Frontend (v1) : http://localhost:${V1_PORT}`);
console.log(`   ➜ Modern Frontend (v2): http://localhost:${V2_PORT}`);
console.log('======================================================\n');

// 1. Launch V1 Server (Port 3000 -> frontend/)
const v1Process = spawn(
  process.execPath,
  ['-e', `process.env.PORT=${V1_PORT}; process.env.FRONTEND_DIR='../frontend'; require('./server.js')`],
  {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(V1_PORT), FRONTEND_DIR: '../frontend' }
  }
);

// 2. Launch V2 Server (Port 3001 -> frontend-v2/)
const v2Process = spawn(
  process.execPath,
  ['-e', `process.env.PORT=${V2_PORT}; process.env.FRONTEND_DIR='../frontend-v2'; require('./server.js')`],
  {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(V2_PORT), FRONTEND_DIR: '../frontend-v2' }
  }
);

function shutdown() {
  console.log('\nShutting down both servers...');
  try { v1Process.kill(); } catch (_) {}
  try { v2Process.kill(); } catch (_) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

v1Process.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`V1 server exited with code ${code}`);
  }
});

v2Process.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`V2 server exited with code ${code}`);
  }
});
