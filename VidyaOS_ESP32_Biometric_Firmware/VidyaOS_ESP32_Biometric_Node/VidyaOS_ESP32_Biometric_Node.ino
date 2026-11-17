/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VIDYAOS ESP32 BIOMETRIC ATTENDANCE TERMINAL — MAIN FIRMWARE
 * File: esp32_firmware/VidyaOS_ESP32_Biometric_Node/VidyaOS_ESP32_Biometric_Node.ino
 *
 * Implements all Specifications:
 *   1. Hardware Pinout Map: AS608, 0.96" OLED (SSD1306), W25Qxx SPI Flash,
 *      Piezo Buzzer (GPIO 14), 4 Status LEDs (WiFi Blue 27, Success Green 25,
 *      Fail Red 26, Low Batt Amber 4), 2S Battery Telemetry (GPIO 34).
 *   2. Behavioral Conditions & Operational Modes:
 *      - Successful Attendance: 2s 2400Hz beep, Green LED 2.5s, OLED details.
 *      - Failed Attendance: 3 short beeps, Red LED flashes 3x, OLED error.
 *      - Unregistered Finger: Continuous rapid 800Hz tone (< 2s), Red LED 2.0s, OLED alert.
 *      - Low Battery: 5 beeps in 5s, Amber LED solid/slow pulse, OLED battery gauge.
 *      - Idle / Standby: Blue WiFi LED, Clock, RSSI, Battery %, Scan prompt.
 *      - 2-Minute Sleep Mode: OLED off, LEDs off, wake on AS608 prism touch (GPIO 33).
 *   3. Secure Dual-Layer Slot Allocation & Two-Way Verification Protocol:
 *      - Matches AS608 slot_id, resolves student_id in W25Qxx.
 *      - Transmits AES-256-GCM encrypted { device_uid, student_id, slot_id, enrollment_no }.
 *      - Server verifies slot_id against device registry before marking PRESENT.
 * ═══════════════════════════════════════════════════════════════════════════
 */

#include <WiFi.h>
#include <WiFiMulti.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include "time.h"
#include "config.h"
#include "crypto_aes_gcm.h"
#include "w25q32_storage.h"
#include "as608_driver.h"
#include "oled_buzzer_ui.h"

VidyaCryptoEngine   cryptoEngine;
W25Q32FlashManager  flashStorage;
VidyaAS608Sensor    fingerprintSensor(&Serial2);
VidyaPeripheralsUI  ui;
WiFiMulti           wifiMulti;
Preferences         wifiPrefs;
WiFiClient          tcpClient;
PubSubClient        mqttClient(tcpClient);

String currentConnectedSsid = WIFI_SSID;
String defaultWifiSsid      = DEFAULT_FACTORY_WIFI_SSID;
String defaultWifiPass      = DEFAULT_FACTORY_WIFI_PASS;

unsigned long lastHeartbeatMs    = 0;
unsigned long lastActivityMs     = 0;
unsigned long lastBatteryCheckMs = 0;
unsigned long lastLowBattAlertMs = 0;
unsigned long lastMqttRetryMs    = 0;

static const char* activeEnrollName = "";
static uint16_t    activeEnrollRoll = 0;

void onEnrollStageUpdate(const char* stageMsg) {
  ui.showEnrollmentScreen(activeEnrollName, activeEnrollRoll, stageMsg);
}

/**
 * Posts an AES-256-GCM encrypted JSON payload to the VidyaOS backend and decrypts the response.
 */
bool postEncryptedToServer(const String& endpointPath, const String& plainJson, String& outDecryptedJson) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(VIDYAOS_SERVER_BASE_URL) + endpointPath;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-UID", DEVICE_UID);

  String encryptedBody = cryptoEngine.encryptJsonEnvelope(DEVICE_UID, plainJson);
  int httpCode = http.POST(encryptedBody);
  if (httpCode < 200 || httpCode >= 300) {
    http.end();
    return false;
  }

  String respStr = http.getString();
  http.end();

  StaticJsonDocument<4096> doc;
  if (deserializeJson(doc, respStr) != DeserializationError::Ok) return false;

  JsonObject enc = doc["encrypted_response"];
  if (!enc.isNull() && enc["encrypted"] == true) {
    return cryptoEngine.decryptEnvelope(
      enc["iv"] | "",
      enc["tag"] | "",
      String((const char*)(enc["ciphertext"] | "")),
      outDecryptedJson
    );
  }
  outDecryptedJson = respStr;
  return true;
}

/**
 * Formats current RTC time into standard strings:
 *   - timeStrFull: "10:45:12 AM"
 *   - timeStrShort: "10:45 AM"
 */
void getFormattedTime(char* outFull, size_t fullSize, char* outShort, size_t shortSize) {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    if (outFull && fullSize > 0) {
      strftime(outFull, fullSize, "%I:%M:%S %p", &timeinfo);
    }
    if (outShort && shortSize > 0) {
      strftime(outShort, shortSize, "%I:%M %p", &timeinfo);
    }
  } else {
    if (outFull && fullSize > 0) strncpy(outFull, "10:45:12 AM", fullSize);
    if (outShort && shortSize > 0) strncpy(outShort, "10:45 AM", shortSize);
  }
}

/**
 * Enters Low-Power Light Sleep after 2 minutes of inactivity.
 * Preserves RAM & flash state, wakes immediately upon finger touch on AS608 prism (GPIO 33).
 */
void enterLowPowerSleep() {
  float battVolts = ui.readBatteryVoltage();
  int battPct = ui.readBatteryPercentage(battVolts);

  // 1. Show brief sleep banner on OLED then turn off display controller
  ui.showSleepBanner(battPct);
  delay(800);
  ui.powerOffDisplay();

  // Turn off LEDs (keep amber indicator if battery is low)
  ui.turnOffAllLeds();
  if (battVolts < BATTERY_LOW_THRESHOLD_VOLTS) {
    ui.setLowBattLed(true);
  }

  // 2. Turn off AS608 optical LED
  fingerprintSensor.setBacklight(false);

  // 3. Configure Touch Wakeup on GPIO 33 (Active HIGH)
  esp_sleep_enable_ext0_wakeup((gpio_num_t)AS608_TOUCH_WAKE_PIN, 1);

  // 4. Enter Light Sleep (preserves RAM, W25Qxx state, and instant resumption)
  esp_light_sleep_start();

  // 5. Execution resumes right here upon finger touch!
  lastActivityMs = millis();
  ui.powerOnDisplay();
  fingerprintSensor.setBacklight(true);
  ui.showWakingScreen();
  delay(500);
}

/**
 * Downloads all portable 512-byte student fingerprint templates
 * for this department from MySQL and loads them into local AS608 slots + W25Q32 Flash.
 */
void syncDepartmentTemplatesFromServer() {
  ui.setWifiLed(true);
  String decryptedResp;
  if (!postEncryptedToServer("/templates-sync", "{\"action\":\"SYNC\"}", decryptedResp)) {
    return;
  }

  DynamicJsonDocument doc(32768);
  if (deserializeJson(doc, decryptedResp) != DeserializationError::Ok) {
    return;
  }

  JsonArray arr = doc["templates"].as<JsonArray>();
  uint8_t rawTemplate[AS608_TEMPLATE_SIZE];

  for (JsonObject t : arr) {
    uint32_t studentId = t["student_id"] | 0;
    uint16_t rollNo    = t["class_roll_no"] | 0;
    const char* name   = t["full_name"] | "Student";
    const char* enroll = t["official_enrollment_no"] | "";
    const char* sha    = t["template_sha256"] | "";
    String b64         = String((const char*)(t["template_base64"] | ""));

    if (studentId == 0 || b64.length() == 0) continue;

    // Allocate local AS608 slot
    uint16_t localSlot = flashStorage.findOrAllocateSlotForStudent(studentId);
    if (localSlot == 0) continue;

    size_t decodedLen = VidyaCryptoEngine::base64Decode(b64, rawTemplate, AS608_TEMPLATE_SIZE);
    if (decodedLen == AS608_TEMPLATE_SIZE) {
      if (fingerprintSensor.writeTemplateToSlot(localSlot, rawTemplate)) {
        flashStorage.saveStudentSlotMapping(localSlot, studentId, rollNo, enroll, name, sha);
      }
    }
  }
  ui.chimeEnrollSuccess();
}

/**
 * Remote student fingerprint enrollment handler:
 * Allocates free slot, guides 2-scan enrollment, extracts template, saves in W25Qxx,
 * and uploads { student_id, slot_id, template_base64 } to MySQL.
 */
void handleRemoteStudentEnrollment(JsonObject cmd) {
  uint32_t commandId = cmd["command_id"] | 0;
  uint32_t studentId = cmd["student_id"] | 0;
  uint16_t rollNo    = cmd["class_roll_no"] | 0;
  const char* name   = cmd["full_name"] | "Student";
  const char* enroll = cmd["official_enrollment_no"] | "";
  uint8_t fingerIdx  = cmd["finger_index"] | 1;

  activeEnrollName = name;
  activeEnrollRoll = rollNo;
  ui.setWifiLed(true);
  ui.playTone(1400, 90);

  // Allocate first free slot
  uint16_t localSlot = 0;
  if (!flashStorage.getNextFreeSlot(localSlot)) {
    fingerprintSensor.findFirstAvailableSlot(localSlot);
  }
  if (localSlot == 0) {
    localSlot = flashStorage.findOrAllocateSlotForStudent(studentId);
  }

  uint8_t extractedTemplate[AS608_TEMPLATE_SIZE];
  uint16_t qualityScore = 96;

  bool ok = fingerprintSensor.enrollAndExtractTemplate(localSlot, extractedTemplate, qualityScore, onEnrollStageUpdate);
  if (!ok) {
    ui.chimeError();
    ui.flashFailLed(3, 150);
    ui.showEnrollmentScreen(name, rollNo, "Enrollment Failed/Timeout");
    delay(2000);
    return;
  }

  String tplB64 = VidyaCryptoEngine::base64Encode(extractedTemplate, AS608_TEMPLATE_SIZE);
  String tplSha = VidyaCryptoEngine::sha256Hex(extractedTemplate, AS608_TEMPLATE_SIZE);

  // Save slot -> student mapping in local W25Q32 SPI Flash
  flashStorage.recordSlotAssignment(localSlot, studentId, enroll, name, rollNo);

  // Upload portable template with slot_id to server
  String payload = "{";
  payload += "\"command_id\":" + String(commandId) + ",";
  payload += "\"student_id\":" + String(studentId) + ",";
  payload += "\"slot_id\":" + String(localSlot) + ",";
  payload += "\"finger_index\":" + String(fingerIdx) + ",";
  payload += "\"quality_score\":" + String(qualityScore) + ",";
  payload += "\"template_base64\":\"" + tplB64 + "\"";
  payload += "}";

  String decryptedResp;
  postEncryptedToServer("/template-upload", payload, decryptedResp);

  ui.chimeEnrollSuccess();
  ui.setSuccessLed(true);
  ui.showEnrollmentScreen(name, rollNo, "FINGERPRINT SAVED!");
  delay(SUCCESS_LED_HOLD_MS);
  ui.setSuccessLed(false);
}

/**
 * Drains unsynced offline attendance scans from W25Q32 SPI Flash to the server.
 */
void syncOfflineQueueToServer() {
  if (WiFi.status() != WL_CONNECTED || flashStorage.getUnsyncedCount() == 0) return;

  OfflineAttendanceRecord batch[OFFLINE_SYNC_BATCH_SIZE];
  uint32_t indices[OFFLINE_SYNC_BATCH_SIZE];
  size_t count = flashStorage.fetchUnsyncedBatch(batch, indices, OFFLINE_SYNC_BATCH_SIZE);
  if (count == 0) return;

  String json = "{\"scans\":[";
  for (size_t i = 0; i < count; i++) {
    if (i > 0) json += ",";
    json += "{";
    json += "\"event_id\":\"" + String(batch[i].event_id) + "\",";
    json += "\"student_id\":" + String(batch[i].student_id) + ",";
    json += "\"slot_id\":" + String(batch[i].as608_slot) + ",";
    json += "\"enrollment_no\":\"" + String(batch[i].enrollment_no) + "\",";
    json += "\"scanned_at\":" + String(batch[i].scanned_at_epoch) + ",";
    json += "\"confidence\":" + String(batch[i].confidence) + ",";
    json += "\"is_offline_sync\":true";
    json += "}";
  }
  json += "]}";

  String decryptedResp;
  if (postEncryptedToServer("/attendance", json, decryptedResp)) {
    for (size_t i = 0; i < count; i++) {
      flashStorage.markRecordSynced(indices[i]);
    }
  }
}

/**
 * Connects to a specific Wi-Fi SSID with timeout.
 */
bool connectToNetwork(const String& ssid, const String& pass, uint32_t timeoutMs) {
  WiFi.disconnect();
  delay(100);
  WiFi.begin(ssid.c_str(), pass.c_str());
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - t0 < timeoutMs)) {
    ui.setWifiLed(!digitalRead(LED_WIFI_PIN));
    delay(200);
  }
  bool connected = (WiFi.status() == WL_CONNECTED);
  ui.setWifiLed(connected);
  return connected;
}

/**
 * Initializes persistent Wi-Fi storage (NVS) and attempts connection
 * to the stored default network, with automatic fallback to factory credentials.
 */
void initWifiManager() {
  wifiPrefs.begin(NVS_WIFI_NAMESPACE, false);
  defaultWifiSsid = wifiPrefs.getString("def_ssid", DEFAULT_FACTORY_WIFI_SSID);
  defaultWifiPass = wifiPrefs.getString("def_pass", DEFAULT_FACTORY_WIFI_PASS);

  WiFi.mode(WIFI_STA);
  wifiMulti.addAP(defaultWifiSsid.c_str(), defaultWifiPass.c_str());
  if (defaultWifiSsid != DEFAULT_FACTORY_WIFI_SSID) {
    wifiMulti.addAP(DEFAULT_FACTORY_WIFI_SSID, DEFAULT_FACTORY_WIFI_PASS);
  }

  bool ok = connectToNetwork(defaultWifiSsid, defaultWifiPass, WIFI_CONNECT_TIMEOUT_MS);
  if (!ok && defaultWifiSsid != DEFAULT_FACTORY_WIFI_SSID) {
    ok = connectToNetwork(DEFAULT_FACTORY_WIFI_SSID, DEFAULT_FACTORY_WIFI_PASS, WIFI_FALLBACK_TIMEOUT_MS);
    if (ok) currentConnectedSsid = DEFAULT_FACTORY_WIFI_SSID;
  } else if (ok) {
    currentConnectedSsid = defaultWifiSsid;
  }
}

/**
 * Scans nearby Wi-Fi networks in real-time, compiles RSSI, channel,
 * encryption type, and transmits the report encrypted to the server.
 */
void scanNearbyWifiNetworksAndReport() {
  ui.setWifiLed(true);
  int n = WiFi.scanNetworks();
  if (n < 0) n = 0;

  String reportJson = "{\"networks\":[";
  for (int i = 0; i < n; i++) {
    if (i > 0) reportJson += ",";
    String encType = "OPEN";
    wifi_auth_mode_t auth = WiFi.encryptionType(i);
    if (auth == WIFI_AUTH_WPA_PSK) encType = "WPA_PSK";
    else if (auth == WIFI_AUTH_WPA2_PSK) encType = "WPA2_PSK";
    else if (auth == WIFI_AUTH_WPA_WPA2_PSK) encType = "WPA_WPA2_PSK";
    else if (auth == WIFI_AUTH_WPA2_ENTERPRISE) encType = "WPA2_ENTERPRISE";
    else if (auth == WIFI_AUTH_WPA3_PSK) encType = "WPA3_PSK";

    reportJson += "{";
    reportJson += "\"ssid\":\"" + WiFi.SSID(i) + "\",";
    reportJson += "\"bssid\":\"" + WiFi.BSSIDstr(i) + "\",";
    reportJson += "\"rssi\":" + String(WiFi.RSSI(i)) + ",";
    reportJson += "\"channel\":" + String(WiFi.channel(i)) + ",";
    reportJson += "\"encryption_type\":\"" + encType + "\"";
    reportJson += "}";
  }
  reportJson += "]}";

  String decryptedResp;
  postEncryptedToServer("/wifi-scan-report", reportJson, decryptedResp);

  if (ENABLE_MQTT_TELEMETRY && mqttClient.connected()) {
    mqttClient.publish(MQTT_TOPIC_WIFI_REPORT, reportJson.c_str());
  }
}

/**
 * Handles incoming SCAN_WIFI remote command.
 */
void handleScanWifiCommand(JsonObject cmd) {
  scanNearbyWifiNetworksAndReport();
}

/**
 * Handles incoming SWITCH_WIFI or ADD_WIFI remote command.
 */
void handleSwitchWifiCommand(JsonObject cmd) {
  JsonObject payload = cmd["payload"].is<JsonObject>() ? cmd["payload"].as<JsonObject>() : cmd;
  String ssid = payload["ssid"] | "";
  String pass = payload["password"] | "";
  bool isDef  = payload["is_default"] | false;

  if (ssid.length() == 0) return;

  if (isDef) {
    wifiPrefs.putString("def_ssid", ssid);
    wifiPrefs.putString("def_pass", pass);
    defaultWifiSsid = ssid;
    defaultWifiPass = pass;
  }

  bool ok = connectToNetwork(ssid, pass, WIFI_CONNECT_TIMEOUT_MS);
  if (ok) {
    currentConnectedSsid = ssid;
    wifiMulti.addAP(ssid.c_str(), pass.c_str());
    ui.setSuccessLed(true);
    ui.playTone(2000, 300);
    delay(500);
    ui.setSuccessLed(false);
  } else {
    ui.beepAttendanceFailed();
    connectToNetwork(defaultWifiSsid, defaultWifiPass, WIFI_FALLBACK_TIMEOUT_MS);
    currentConnectedSsid = defaultWifiSsid;
  }
}

/**
 * Handles incoming FALLBACK_WIFI command.
 */
void handleFallbackWifiCommand(JsonObject cmd) {
  bool ok = connectToNetwork(defaultWifiSsid, defaultWifiPass, WIFI_FALLBACK_TIMEOUT_MS);
  if (ok) {
    currentConnectedSsid = defaultWifiSsid;
    ui.setSuccessLed(true);
    ui.playTone(1800, 200);
    delay(300);
    ui.setSuccessLed(false);
  } else {
    connectToNetwork(DEFAULT_FACTORY_WIFI_SSID, DEFAULT_FACTORY_WIFI_PASS, WIFI_FALLBACK_TIMEOUT_MS);
    currentConnectedSsid = DEFAULT_FACTORY_WIFI_SSID;
  }
}

/**
 * Handles incoming RESET_WIFI command (Emergency factory reset).
 */
void handleResetWifiCommand(JsonObject cmd) {
  wifiPrefs.clear();
  defaultWifiSsid = DEFAULT_FACTORY_WIFI_SSID;
  defaultWifiPass = DEFAULT_FACTORY_WIFI_PASS;
  connectToNetwork(DEFAULT_FACTORY_WIFI_SSID, DEFAULT_FACTORY_WIFI_PASS, WIFI_FALLBACK_TIMEOUT_MS);
  currentConnectedSsid = DEFAULT_FACTORY_WIFI_SSID;
  ui.setFailLed(true);
  ui.playTone(1000, 500);
  delay(500);
  ui.setFailLed(false);
}

/**
 * MQTT Message Callback for dual-stack remote commands.
 */
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  DynamicJsonDocument doc(2048);
  if (deserializeJson(doc, payload, length) == DeserializationError::Ok) {
    JsonObject cmd = doc.as<JsonObject>();
    String cmdType = cmd["command_type"] | "";
    if (cmdType == "SCAN_WIFI") handleScanWifiCommand(cmd);
    else if (cmdType == "SWITCH_WIFI") handleSwitchWifiCommand(cmd);
    else if (cmdType == "FALLBACK_WIFI") handleFallbackWifiCommand(cmd);
    else if (cmdType == "RESET_WIFI") handleResetWifiCommand(cmd);
  }
}

/**
 * Initializes and maintains dual-stack MQTT client when enabled.
 */
void initMqtt() {
  if (!ENABLE_MQTT_TELEMETRY) return;
  mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void maintainMqtt() {
  if (!ENABLE_MQTT_TELEMETRY || WiFi.status() != WL_CONNECTED) return;
  if (!mqttClient.connected()) {
    if (millis() - lastMqttRetryMs >= 10000UL) {
      lastMqttRetryMs = millis();
      if (mqttClient.connect(MQTT_CLIENT_ID)) {
        mqttClient.subscribe(MQTT_TOPIC_COMMANDS);
      }
    }
  } else {
    mqttClient.loop();
  }
}

void publishMqttTelemetry(float battVolts, int battPct) {
  if (!ENABLE_MQTT_TELEMETRY || !mqttClient.connected()) return;
  String p = "{";
  p += "\"device_uid\":\"" + String(DEVICE_UID) + "\",";
  p += "\"battery_voltage\":" + String(battVolts, 2) + ",";
  p += "\"battery_pct\":" + String(battPct) + ",";
  p += "\"wifi_rssi\":" + String(WiFi.RSSI()) + ",";
  p += "\"connected_ssid\":\"" + currentConnectedSsid + "\"";
  p += "}";
  mqttClient.publish(MQTT_TOPIC_TELEMETRY, p.c_str());
}

void setup() {
  Serial.begin(115200);
  ui.begin();
  cryptoEngine.begin(DEVICE_AES_SECRET);
  flashStorage.begin();
  fingerprintSensor.begin();

  initWifiManager();
  initMqtt();

  if (WiFi.status() == WL_CONNECTED) {
    ui.setWifiLed(true);
    configTime(19800, 0, "pool.ntp.org", "time.nist.gov"); // IST UTC+5:30
  } else {
    ui.setWifiLed(false);
  }

  ui.chimeBoot();
  lastActivityMs = millis();
}

void loop() {
  float battVolts = ui.readBatteryVoltage();
  int   battPct   = ui.readBatteryPercentage(battVolts);
  bool  isOnline  = (WiFi.status() == WL_CONNECTED);

  // 1. Wi-Fi Status LED & Dual-Stack MQTT Maintenance
  maintainMqtt();
  if (isOnline) {
    ui.setWifiLed(true);
  } else {
    // Blink Wi-Fi LED if offline or reconnecting
    static unsigned long lastBlinkMs = 0;
    if (millis() - lastBlinkMs >= 500) {
      lastBlinkMs = millis();
      ui.setWifiLed(!digitalRead(LED_WIFI_PIN));
    }
  }

  // 2. Battery Telemetry & Low Battery Condition (Every 10 seconds)
  if (millis() - lastBatteryCheckMs >= 10000UL) {
    lastBatteryCheckMs = millis();
    if (battVolts < BATTERY_LOW_THRESHOLD_VOLTS) {
      ui.setLowBattLed(true);
      // Alert with 5 beeps in 5 seconds at most once every 60s
      if (millis() - lastLowBattAlertMs >= 60000UL) {
        lastLowBattAlertMs = millis();
        ui.showLowBatteryScreen(battVolts, battPct);
        ui.beepLowBattery();
      }
    } else {
      ui.setLowBattLed(false);
    }
  }

  // 3. Inactivity Watchdog: Enter Light Sleep after 2 minutes of no user interaction
  if (millis() - lastActivityMs >= INACTIVITY_SLEEP_TIMEOUT_MS) {
    enterLowPowerSleep();
    return;
  }

  // 4. Poll AS608 Fingerprint Sensor for Attendance Scan
  uint16_t matchedSlot = 0;
  uint16_t confidence  = 0;
  int scanStatus = fingerprintSensor.pollAndSearch(matchedSlot, confidence);

  if (scanStatus != 0) {
    // Reset inactivity timer on any finger interaction
    lastActivityMs = millis();
  }

  // ─── Behavioral Condition 1: Successful Attendance OR Condition 2: Failed ───
  if (scanStatus == 1) {
    LocalStudentSlotEntry student;
    bool found = flashStorage.lookupStudentBySlot(matchedSlot, student);

    char fullTime[24];
    char shortTime[16];
    getFormattedTime(fullTime, sizeof(fullTime), shortTime, sizeof(shortTime));

    if (!found) {
      // Finger is in sensor but unassigned in local flash database
      ui.setFailLed(true);
      ui.showFingerNotRegistered();
      ui.beepFingerNotRegistered();
      delay(200);
      ui.setFailLed(false);
    } else {
      time_t nowEpoch;
      time(&nowEpoch);
      char eventId[40];
      snprintf(eventId, sizeof(eventId), "EVT_%lu_%lu", (unsigned long)nowEpoch, (unsigned long)student.student_id);

      bool attendanceRecorded = false;
      bool serverRejected     = false;
      String serverTimeStr    = String(fullTime);

      if (isOnline) {
        // Construct authenticated payload with dual-layer keying { student_id, slot_id }
        String scanJson = "{\"device_uid\":\"" + String(DEVICE_UID) + "\",\"scans\":[{";
        scanJson += "\"event_id\":\"" + String(eventId) + "\",";
        scanJson += "\"student_id\":" + String(student.student_id) + ",";
        scanJson += "\"slot_id\":" + String(matchedSlot) + ",";
        scanJson += "\"enrollment_no\":\"" + String(student.enrollment_no) + "\",";
        scanJson += "\"confidence\":" + String(confidence) + ",";
        scanJson += "\"scanned_at\":" + String((unsigned long)nowEpoch) + ",";
        scanJson += "\"is_offline_sync\":false";
        scanJson += "}]}";

        String respJson;
        if (postEncryptedToServer("/attendance", scanJson, respJson)) {
          StaticJsonDocument<2048> doc;
          if (deserializeJson(doc, respJson) == DeserializationError::Ok) {
            bool ok = doc["success"] | false;
            String status = String((const char*)(doc["status"] | ""));
            if (ok || status == "ATTENDANCE_MARKED") {
              attendanceRecorded = true;
              const char* t = doc["time"] | doc["data"]["time"] | "";
              if (t && strlen(t) > 0) serverTimeStr = String(t);
            } else {
              serverRejected = true;
            }
          } else {
            attendanceRecorded = true;
          }
        } else {
          // If server returned HTTP 4xx/5xx rejection
          if (WiFi.status() == WL_CONNECTED) {
            serverRejected = true;
          }
        }
      }

      if (serverRejected) {
        // ─── Behavioral Condition 2: Failed Attendance ───
        // 3 continuous short beeps + Red LED flashes 3 times + OLED error
        ui.showAttendanceFailed("Class / Register Error", serverTimeStr.c_str());
        for (int i = 0; i < 3; i++) {
          ui.setFailLed(true);
          ui.playTone(1800, 150);
          ui.setFailLed(false);
          delay(100);
        }
        delay(1000);
      } else {
        // Online success or offline fallback
        if (!isOnline || !attendanceRecorded) {
          flashStorage.appendOfflineAttendance(
            student.student_id,
            matchedSlot,
            student.class_roll_no,
            student.full_name,
            student.enrollment_no,
            (uint32_t)nowEpoch,
            (uint8_t)confidence,
            eventId
          );
        }

        // ─── Behavioral Condition 1: Successful Attendance ───
        // 2-Second continuous long beep (2400 Hz for 2000 ms)
        // Green LED Solid ON for 2.5 seconds
        // OLED: Header "SUCCESSFULLY MARKED", Enroll No, Student Name, Time
        ui.setSuccessLed(true);
        ui.showAttendanceSuccess(student.enrollment_no, student.full_name, serverTimeStr.c_str());
        ui.beepAttendanceSuccess(); // 2000 ms
        delay(500);                 // Remaining 500 ms = 2.5s Green LED hold
        ui.setSuccessLed(false);
      }
    }
  }
  // ─── Behavioral Condition 3: Finger Not Registered ───
  else if (scanStatus == -2) {
    // Continuous rapid tone (< 2s) (800 Hz pulsed rapidly for 1800 ms)
    // Red LED Solid ON for 2.0 seconds
    // OLED: Header "NOT REGISTERED", Finger Not Found, Slot Unassigned, Contact HOD
    ui.setFailLed(true);
    ui.showFingerNotRegistered();
    ui.beepFingerNotRegistered(); // 1800 ms
    delay(200);                   // Remaining 200 ms = 2.0s Red LED hold
    ui.setFailLed(false);
  }

  // 5. Periodic Encrypted Heartbeat, W25Q32 Offline Sync & Remote Command Poll
  if (millis() - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = millis();

    if (isOnline) {
      syncOfflineQueueToServer();

      String hbJson = "{";
      hbJson += "\"battery_voltage\":" + String(battVolts, 2) + ",";
      hbJson += "\"battery_pct\":" + String(battPct) + ",";
      hbJson += "\"offline_queue_count\":" + String(flashStorage.getUnsyncedCount()) + ",";
      hbJson += "\"w25q32_used_kb\":" + String(flashStorage.getUsedFlashKb()) + ",";
      hbJson += "\"as608_enrolled_count\":" + String(flashStorage.getEnrolledStudentCount()) + ",";
      hbJson += "\"wifi_rssi\":" + String(WiFi.RSSI()) + ",";
      hbJson += "\"connected_ssid\":\"" + currentConnectedSsid + "\",";
      hbJson += "\"firmware_version\":\"" + String(FIRMWARE_VERSION) + "\"";
      hbJson += "}";

      publishMqttTelemetry(battVolts, battPct);

      String hbResp;
      if (postEncryptedToServer("/heartbeat", hbJson, hbResp)) {
        StaticJsonDocument<2048> doc;
        if (deserializeJson(doc, hbResp) == DeserializationError::Ok) {
          uint16_t cloudCount = doc["cloud_template_count"] | 0;
          if (cloudCount > 0 && flashStorage.getEnrolledStudentCount() == 0) {
            syncDepartmentTemplatesFromServer();
          }

          JsonObject cmd = doc["command"];
          if (!cmd.isNull()) {
            lastActivityMs = millis();
            String cmdType = String((const char*)(cmd["command_type"] | ""));
            if (cmdType == "ENROLL_STUDENT") {
              handleRemoteStudentEnrollment(cmd);
            } else if (cmdType == "SYNC_TEMPLATES") {
              syncDepartmentTemplatesFromServer();
            } else if (cmdType == "BUZZER_CHIME") {
              ui.beepAttendanceSuccess();
            } else if (cmdType == "SCAN_WIFI") {
              handleScanWifiCommand(cmd);
            } else if (cmdType == "SWITCH_WIFI" || cmdType == "ADD_WIFI") {
              handleSwitchWifiCommand(cmd);
            } else if (cmdType == "FALLBACK_WIFI") {
              handleFallbackWifiCommand(cmd);
            } else if (cmdType == "RESET_WIFI") {
              handleResetWifiCommand(cmd);
            }
          }
        }
      }
    }

    // ─── Behavioral Condition 5: Idle / Standby State ───
    char dummyFull[24];
    char clockStr[16];
    getFormattedTime(dummyFull, sizeof(dummyFull), clockStr, sizeof(clockStr));

    ui.showIdleScreen(
      battPct,
      battVolts,
      isOnline,
      clockStr,
      isOnline ? WiFi.RSSI() : -99
    );
  }

  delay(40);
}
