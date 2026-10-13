# 🚀 VidyaOS Production Deployment Guide

This guide covers production deployment for the **VidyaOS Institutional Campus Management & Biometric Attendance System**.

---

## 🏗️ Deployment Architecture

VidyaOS is designed with an institutional, zero-downtime architecture:
- **Application Server**: Node.js 20+ Express REST API (`backend/server.js`) with HTTP compression, rate limiting, and graceful termination.
- **Database Engine**: SQLite 3 with **WAL mode (Write-Ahead Logging)**, in-memory temp tables, 64MB cache, and concurrent read/write throughput.
- **Static Web Client**: Pure HTML5/CSS3/Vanilla JS served by Express or reverse-proxied via Nginx.
- **Persistent Data**:
  - SQLite database: `/app/data/college_attendance.sqlite`
  - Coursework submissions & attachments: `/app/uploads`
  - WhatsApp Web multi-device session: `/app/whatsapp_session`

---

## Option 1: Docker Compose (Recommended)

Docker Compose provides full containerization with persistent data isolation and automatic restart policies.

### 1. Prerequisites
- Docker Engine 24+ & Docker Compose v2+ installed.

### 2. Launching VidyaOS
From the root directory:
```bash
# 1. Build and start containers in detached mode
docker compose up -d --build

# 2. View live server logs
docker compose logs -f vidyaos-server

# 3. Check health status
curl http://localhost:3000/api/v1/health
```

### 3. Updating the Production Container
Use the automated updater script:
```bash
bash deploy/update.sh
```

---

## Option 2: Linux VPS / Bare-Metal with PM2 & Nginx

For institutional server rooms or standard Linux VPS (Ubuntu 22.04 / 24.04 LTS).

### 1. Install Node.js 20+ and PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 2. Configure Directory & Dependencies
```bash
cd /var/www/vidyaos/backend
npm ci --production
```

### 3. Start Application with PM2
```bash
cd /var/www/vidyaos
pm2 start deploy/ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Setup Nginx Reverse Proxy
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/vidyaos.conf
sudo ln -s /etc/nginx/sites-available/vidyaos.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Provision SSL Certificate
```bash
sudo certbot --nginx -d attendance.college.edu.in
```

---

## 🔒 Production Environment Variables (`.env`)

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations & caching |
| `PORT` | `3000` | Port for Express HTTP server |
| `DB_CLIENT` | `sqlite` | Database adapter (`sqlite` or `mysql`) |
| `SQLITE_FILE` | `./server-data/db/college_attendance.sqlite` | Path to persistent SQLite database |
| `JWT_SECRET` | *(Random 64-char string)* | Cryptographic key for authentication tokens |
| `UPLOADS_DIR` | `./server-data/uploads` | Path to store student file submissions |
| `WHATSAPP_SESSION_DIR` | `./server-data/whatsapp-session` | Persistent WhatsApp session storage |
| `CLEAN_ADMIN_ONLY` | `true` | When true on fresh install, provisions only 1 Admin |

---

## 💾 Backup & Disaster Recovery

### Automated Database Backup Cron
Add the following line to `crontab -e` to generate daily hot backups of the SQLite database:
```bash
0 2 * * * sqlite3 /var/www/vidyaos/server-data/db/college_attendance.sqlite ".backup '/backup/vidyaos_$(date +\%Y\%m\%d).sqlite'"
```
Because VidyaOS runs in **WAL mode**, `sqlite3 .backup` executes concurrently **without stopping or blocking the live web server**.
