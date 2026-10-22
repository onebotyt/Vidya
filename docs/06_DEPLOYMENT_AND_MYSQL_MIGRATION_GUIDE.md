# 🚀 Deployment & MySQL Production Migration Guide

Vidya features a **Dual-Engine Database Architecture** configured in `backend/src/config/db.js`.
- **Local Testing & Development**: Zero-configuration embedded **SQLite3**.
- **Production Deployment**: Enterprise-grade **MySQL 8.x / MariaDB 10.5+** with connection pooling.

Switching between SQLite and MySQL requires **zero code changes**—only changing the `DB_CLIENT` flag and database credentials in `.env`.

---

## 1. Dual-Engine Architecture Overview

```
                      ┌────────────────────────────┐
                      │    Vidya Express Server    │
                      └─────────────┬──────────────┘
                                    │
                         backend/src/config/db.js
                                    │
                    ┌───────────────┴───────────────┐
                    │  DB_CLIENT environment switch │
                    └───────┬───────────────┬───────┘
                            │               │
     If DB_CLIENT=sqlite    │               │  If DB_CLIENT=mysql
                            ▼               ▼
                ┌──────────────────┐ ┌──────────────────────────┐
                │ SQLite Engine    │ │ MySQL 8.x Engine         │
                │ • Local dev/test │ │ • mysql2 connection pool │
                │ • Synchronous    │ │ • Production concurrency │
                │ • Zero config    │ │ • Cloud VPS / cPanel     │
                └──────────────────┘ └──────────────────────────┘
```

The unified query wrapper (`query(sql, params)`) automatically formats parameters and handles queries across both engines.

---

## 2. Step-by-Step MySQL Setup for Production

### Step 2.1: Provision the MySQL Database
Log in to your MySQL terminal, cPanel phpMyAdmin, or Cloud database console (e.g. AWS RDS, DigitalOcean, PlanetScale):

```sql
-- 1. Create database with full Unicode UTF-8 support
CREATE DATABASE college_attendance 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 2. Create a dedicated database user with strong password
CREATE USER 'vidya_admin'@'%' IDENTIFIED BY 'YourStrongRandomPassword2026!';

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON college_attendance.* TO 'vidya_admin'@'%';
FLUSH PRIVILEGES;
```

---

### Step 2.2: Import Production Schema

The project includes an optimized, production-ready schema dump under:
`backend/database/cpanel_production_mysql.sql`

#### Method A: Via MySQL Command Line
```bash
cd backend/database
mysql -u vidya_admin -p -h localhost college_attendance < cpanel_production_mysql.sql
```

#### Method B: Via cPanel phpMyAdmin
1. Open **cPanel ➔ Databases ➔ phpMyAdmin**.
2. Select your newly created `college_attendance` database from the left sidebar.
3. Click the **Import** tab at the top.
4. Click **Choose File** and select `backend/database/cpanel_production_mysql.sql`.
5. Click **Go** (all 25+ relational tables, indexes, and initial admin credentials will import cleanly).

---

### Step 2.3: Configure Production `.env`

In your production `backend/.env` file, switch `DB_CLIENT` to `mysql` and configure the connection parameters:

```ini
# =============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# =============================================================================
PORT=3000
NODE_ENV=production

# -----------------------------------------------------------------------------
# DATABASE: SWITCHED TO MYSQL
# -----------------------------------------------------------------------------
DB_CLIENT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=vidya_admin
DB_PASSWORD=YourStrongRandomPassword2026!
DB_NAME=college_attendance
DB_CONNECTION_LIMIT=15

# -----------------------------------------------------------------------------
# JWT SECURITY (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# -----------------------------------------------------------------------------
JWT_SECRET=b7f83a0937c86e09e..._REPLACE_WITH_LONG_RANDOM_SECRET_...f28a7c
JWT_EXPIRES_IN=7d
JWT_ACCESS_SECRET=b7f83a0937c86e09e...
JWT_REFRESH_SECRET=c8d94e1048d97f10f...

# -----------------------------------------------------------------------------
# CORS & HOSTING
# -----------------------------------------------------------------------------
CORS_ORIGIN=https://campus.yourcollege.edu
UPLOADS_DIR=uploads
```

---

### Step 2.4: Migrate Data from Local SQLite to MySQL (Optional)

If you have accumulated active academic data, enrolled students, or attendance registers in your local `backend/college_attendance.sqlite` that you wish to transfer to production MySQL:

1. Run the built-in migration script:
   ```bash
   cd backend
   node scripts/generate-cpanel-mysql.js
   ```
2. This script reads the active SQLite database and generates a populated SQL dump (`cpanel_production_mysql.sql`) containing:
   - All departments, academic years, and curriculum subjects.
   - Faculty user accounts and passwords.
   - Enrolled students, cohorts, and class roll numbers.
   - Historical attendance registers and sessions.
3. Import the generated file into your MySQL database as shown in Step 2.2.

---

## 3. Production Deployment Platforms

### Option A: Cloud VPS (Ubuntu / Debian / Nginx / PM2)
1. **Clone repository on VPS**:
   ```bash
   git clone <REPO_URL> /var/www/vidya
   cd /var/www/vidya/backend
   npm install --production
   ```
2. **Start with PM2 Process Manager**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "vidya-backend" -i max
   pm2 save
   pm2 startup
   ```
3. **Configure Nginx Reverse Proxy**:
   ```nginx
   server {
       listen 80;
       server_name campus.yourcollege.edu;

       # Serve static frontend
       location / {
           root /var/www/vidya/frontend;
           index index.html;
           try_files $uri $uri/ =404;
       }

       # Proxy API requests to Node backend
       location /api/ {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. **Issue SSL Certificate**:
   ```bash
   sudo certbot --nginx -d campus.yourcollege.edu
   ```

---

### Option B: cPanel / Shared Hosting (Node.js Application Manager)
1. Compress the clean project archive and upload via cPanel File Manager to `public_html` or a dedicated app directory.
2. In cPanel, navigate to **Software ➔ Setup Node.js App**.
3. Click **Create Application**:
   - **Node.js version**: 20.x or higher.
   - **Application mode**: `Production`.
   - **Application root**: `vidya/backend`.
   - **Application startup file**: `server.js`.
4. Click **Run NPM Install**.
5. Add Environment Variables in the cPanel Node.js interface (`DB_CLIENT=mysql`, `DB_HOST=localhost`, etc.).
6. Click **Restart**.

---

### Option C: Docker / Docker Compose
A `Dockerfile` and `docker-compose.yml` are included in the repository root:
```bash
# Build and run containers with embedded MySQL service
docker-compose up -d --build
```

---

## 4. Pre-Deployment Verification Checklist

Before opening the campus portal to students and teachers, verify:
- [ ] `DB_CLIENT=mysql` is active in `backend/.env`.
- [ ] MySQL connection pool reports successful connection on startup (`node server.js` logs *"MySQL Database connected successfully"*).
- [ ] System Administrator password has been changed from default (`Admin@123`).
- [ ] Node environment is set to `NODE_ENV=production`.
- [ ] File uploads directory (`backend/uploads/`) has write permissions.
- [ ] SSL/HTTPS certificate is valid and active.
