/**
 * =============================================================================
 * VidyaOS Institutional Campus OS — PM2 Production Ecosystem Configuration
 * =============================================================================
 * Usage:
 *   pm2 start deploy/ecosystem.config.js --env production
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'vidyaos-backend',
      script: './backend/server.js',
      cwd: './',
      instances: 1, // Single instance for SQLite WAL concurrency
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      exp_backoff_restart_delay: 100,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_CLIENT: 'sqlite',
        SQLITE_FILE: './server-data/db/college_attendance.sqlite',
        UPLOADS_DIR: './server-data/uploads',
        WHATSAPP_SESSION_DIR: './server-data/whatsapp-session',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
