const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const backupDir = path.join(rootDir, 'frontend_backup_v1');

const action = process.argv[2] || 'backup';

if (action === 'backup') {
  console.log('📦 Creating snapshot backup of frontend/ to frontend_backup_v1/ ...');
  if (fs.existsSync(backupDir)) {
    console.log('⚠️ frontend_backup_v1 already exists. Keeping original baseline safe.');
    console.log('   (If you want to overwrite, delete frontend_backup_v1 first).');
  } else {
    fs.cpSync(frontendDir, backupDir, { recursive: true });
    console.log('✅ Snapshot created successfully at frontend_backup_v1/');
  }
} else if (action === 'revert' || action === 'restore') {
  console.log('🔄 Reverting frontend/ from frontend_backup_v1/ ...');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ Error: frontend_backup_v1/ not found! Cannot revert.');
    process.exit(1);
  }
  // Create emergency temp backup of current frontend before reverting
  const emergencyDir = path.join(rootDir, 'frontend_temp_before_revert');
  if (fs.existsSync(emergencyDir)) {
    fs.rmSync(emergencyDir, { recursive: true, force: true });
  }
  fs.cpSync(frontendDir, emergencyDir, { recursive: true });

  // Clear current frontend and copy from backup
  fs.rmSync(frontendDir, { recursive: true, force: true });
  fs.cpSync(backupDir, frontendDir, { recursive: true });

  console.log('✅ Revert complete! frontend/ has been restored to the exact previous design.');
  console.log('   (A temporary safety copy was saved at frontend_temp_before_revert/)');
} else if (action === 'status') {
  const hasBackup = fs.existsSync(backupDir);
  console.log(`Backup status: ${hasBackup ? '✅ frontend_backup_v1 exists' : '❌ No backup found'}`);
} else {
  console.log(`Usage: node scripts/ui-backup-revert.js [backup|revert|status]`);
}
