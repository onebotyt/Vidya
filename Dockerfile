# =============================================================================
# VidyaOS Institutional Campus Operating System — Production Dockerfile
# =============================================================================
# Node 20 with System Chromium for headless WhatsApp Web bot & PDF reporting
FROM node:20-bullseye-slim

# Install system dependencies & Chromium for WhatsApp Web bot
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-freefont-ttf \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set Environment Variables
ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    SQLITE_FILE=/app/data/college_attendance.sqlite \
    WHATSAPP_SESSION_DIR=/app/whatsapp_session \
    UPLOADS_DIR=/app/uploads

WORKDIR /app

# Copy dependency manifests
COPY backend/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --production

# Copy application source code
COPY backend/ ./
COPY database/ ./database/
COPY frontend/ ../frontend/

# Create persistent storage directories
RUN mkdir -p /app/data /app/uploads /app/whatsapp_session

# Expose server port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start VidyaOS server
CMD ["node", "server.js"]
