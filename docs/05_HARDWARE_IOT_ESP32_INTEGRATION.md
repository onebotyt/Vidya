# 🔌 ESP32 Biometric Hardware Terminal Integration

Vidya integrates with physical classroom IoT attendance terminals powered by **ESP32 microcontrollers** equipped with capacitive optical fingerprint sensors and TFT touch displays.

---

## 1. Hardware Architecture

```
 ┌────────────────────────────────────────────────────────┐
 │            ESP32 Classroom Terminal Device             │
 │                                                        │
 │  ┌───────────────────────┐  ┌───────────────────────┐  │
 │  │ Optical Fingerprint   │  │ TFT Touch Display     │  │
 │  │ Sensor (R307/AS608)   │  │ (Status, Student Name)│  │
 │  └───────────┬───────────┘  └───────────▲───────────┘  │
 │              │ UART                     │ SPI          │
 │              ▼                          │              │
 │  ┌──────────────────────────────────────┴───────────┐  │
 │  │ ESP32 Microcontroller Core (Wi-Fi 802.11 b/g/n)  │  │
 │  │ • Device UID & Token Storage in Flash NVS        │  │
 │  │ • Offline Scan Ring Buffer (Up to 500 scans)     │  │
 │  └──────────────────────────┬───────────────────────┘  │
 └─────────────────────────────┼──────────────────────────┘
                               │ HTTPS / TLS REST API
                               ▼
 ┌────────────────────────────────────────────────────────┐
 │           Vidya Backend Express API Server             │
 │                                                        │
 │  • POST /api/v1/devices/heartbeat                      │
 │  • POST /api/v1/devices/presence                       │
 │  • Fingerprint Slot ➔ Student Enrollment Mapping       │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Provisioning Protocol

1. **Device Registration (Admin Portal)**:
   - Administrator registers a new device at `/admin/terminals.html`.
   - Specifies `device_uid` (e.g. `ESP32-DEPT-IT-01`), Department, Year, and a shared device Secret.
   - The backend hashes the secret using bcrypt and issues a permanent terminal API token.
2. **Terminal Configuration**:
   - The ESP32 firmware is flashed with:
     - Institutional Wi-Fi SSID & Password.
     - Backend API URL (`https://campus.domain.edu/api/v1`).
     - Terminal `device_uid` and Secret Key.

---

## 3. Communication Protocols

### 3.1 Device Heartbeat (Liveness Monitoring)
Every 60 seconds, the terminal sends a heartbeat to report hardware health and Wi-Fi signal strength:
```http
POST /api/v1/devices/heartbeat HTTP/1.1
Content-Type: application/json
X-Device-UID: ESP32-DEPT-IT-01
X-Device-Secret: <SECRET_KEY>

{
  "device_uid": "ESP32-DEPT-IT-01",
  "firmware_version": "v2.4.1",
  "wifi_rssi": -58,
  "sensor_status": "READY",
  "uptime_seconds": 86420
}
```

**Backend Response**:
```json
{
  "success": true,
  "data": {
    "device_status": "ACTIVE",
    "server_time": "2026-10-21T21:30:00Z",
    "commands": []
  }
}
```

### 3.2 Presence Event (Biometric Scan Clock-In)
When a student scans their finger:
1. The optical sensor matches the print to a local slot ID (1–1000).
2. The ESP32 displays the confirmation on the TFT screen.
3. Transmits the scan payload:
```http
POST /api/v1/devices/presence HTTP/1.1
Content-Type: application/json
X-Device-UID: ESP32-DEPT-IT-01
X-Device-Secret: <SECRET_KEY>

{
  "device_uid": "ESP32-DEPT-IT-01",
  "fingerprint_slot": 42,
  "scan_time": "2026-10-21T09:15:32Z",
  "battery_voltage": 4.12
}
```

**Backend Logic**:
1. Verifies terminal credentials and checks if the terminal is assigned to an active department.
2. Queries `fingerprint_slots` to resolve `slot_id: 42` to the student's `student_id` and `official_enrollment_no`.
3. Inserts the record into `esp32_presence`.
4. If an active attendance session is currently open for that cohort, marks the student `PRESENT` in real time.

---

## 4. Offline Fallback & Sync Buffer

If Wi-Fi drops:
- The ESP32 saves timestamped scans to its internal non-volatile flash storage ring buffer (capacity: 500 scans).
- When Wi-Fi reconnects, the terminal drains the buffer in batch mode, preserving original scan timestamps.
- Duplicate scans within a 5-minute window are filtered out automatically by SQLite unique constraints.
