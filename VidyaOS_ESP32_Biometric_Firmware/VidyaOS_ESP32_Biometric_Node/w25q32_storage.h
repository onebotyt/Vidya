/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VIDYAOS EMBEDDED INTERNAL NVS & RAM SECURE ROSTER STORAGE DRIVER
 * File: VidyaOS_ESP32_Biometric_Node/w25q32_storage.h
 * 
 * Hardware-Independent Internal Non-Volatile Storage (NVS) & High-Speed RAM Cache.
 * Zero external SPI chips (W25Qxx) required! Uses ESP32 internal flash partition
 * via the Preferences library + static RAM cache for instantaneous sub-microsecond
 * student lookups during biometric attendance scans.
 * ═══════════════════════════════════════════════════════════════════════════
 */

#ifndef VIDYAOS_W25Q32_STORAGE_H
#define VIDYAOS_W25Q32_STORAGE_H

#include <Arduino.h>
#include <Preferences.h>
#include "config.h"

#define SLOT_RECORD_MAGIC           0x5653 // "VS" (Vidya Slot)
#define OFFLINE_RECORD_MAGIC        0x564F // "VO" (Vidya Offline)
#define MAX_OFFLINE_BUFFER_RECORDS  64

#pragma pack(push, 1)
struct LocalStudentSlotEntry {
  uint16_t magic;                  // 0x5653 when valid
  uint16_t as608_slot;             // Hardware slot id (1..300)
  uint32_t student_id;             // Institutional MySQL student.id
  uint16_t class_roll_no;          // Class roll number
  char     enrollment_no[20];      // e.g. "2024IT005"
  char     full_name[24];          // e.g. "Arjun Rao"
  char     template_sha256[65];    // SHA-256 hash of 512-byte template
  uint8_t  reserved[1];            // Pad to 120 bytes
};

struct OfflineAttendanceRecord {
  uint16_t magic;                  // 0x564F when written
  uint8_t  synced;                 // 0xFF = Unsynced, 0x00 = Synced to Server
  uint8_t  confidence;             // AS608 match confidence
  uint32_t student_id;             // MySQL student.id
  uint16_t as608_slot;             // AS608 slot id (1..300)
  uint16_t class_roll_no;          // Classroom Roll No
  uint32_t scanned_at_epoch;       // Unix timestamp
  char     event_id[34];           // Unique idempotency key
  char     full_name[44];          // Student Name
  char     enrollment_no[20];      // Enrollment No
  uint8_t  reserved[14];           // Pad to 128 bytes
};
#pragma pack(pop)

class W25Q32FlashManager {
private:
  LocalStudentSlotEntry ramRosterCache[AS608_MAX_SLOTS + 1];
  OfflineAttendanceRecord offlineQueue[MAX_OFFLINE_BUFFER_RECORDS];
  uint32_t writeHeadIndex = 0;
  uint32_t unsyncedCount  = 0;
  Preferences prefs;
  bool isInitialized = false;

  void makeSlotKey(uint16_t slot, char* outKey, size_t maxLen) {
    snprintf(outKey, maxLen, "s%u", slot);
  }

public:
  bool begin() {
    memset(ramRosterCache, 0, sizeof(ramRosterCache));
    memset(offlineQueue, 0, sizeof(offlineQueue));
    writeHeadIndex = 0;
    unsyncedCount  = 0;

    // Open NVS namespace for persistent student slot mappings
    if (prefs.begin("vidya_slots", false)) {
      isInitialized = true;
      uint16_t loadedCount = 0;

      // Restore all previously saved slots from internal flash NVS
      for (uint16_t slot = 1; slot <= AS608_MAX_SLOTS; slot++) {
        char key[16];
        makeSlotKey(slot, key, sizeof(key));
        if (prefs.isKey(key)) {
          size_t sz = prefs.getBytes(key, &ramRosterCache[slot], sizeof(LocalStudentSlotEntry));
          if (sz == sizeof(LocalStudentSlotEntry) && ramRosterCache[slot].magic == SLOT_RECORD_MAGIC) {
            loadedCount++;
          } else {
            memset(&ramRosterCache[slot], 0, sizeof(LocalStudentSlotEntry));
          }
        }
      }
      Serial.printf("[STORAGE] Internal NVS & RAM Roster Storage initialized. Restored %u slots from internal flash.\n", loadedCount);
    } else {
      Serial.println(F("[STORAGE] Failed to open NVS namespace 'vidya_slots'. Operating with RAM cache only."));
      isInitialized = true;
    }
    return true;
  }

  bool isHardwareFlashPresent() const {
    return true; // Internal ESP32 NVS flash is always present
  }

  bool getNextFreeSlot(uint16_t& outSlot) {
    for (uint16_t s = 1; s <= AS608_MAX_SLOTS; s++) {
      if (ramRosterCache[s].magic != SLOT_RECORD_MAGIC) {
        outSlot = s;
        return true;
      }
    }
    outSlot = 1;
    return true;
  }

  uint16_t findOrAllocateSlotForStudent(uint32_t studentId) {
    for (uint16_t s = 1; s <= AS608_MAX_SLOTS; s++) {
      if (ramRosterCache[s].magic == SLOT_RECORD_MAGIC && ramRosterCache[s].student_id == studentId) {
        return s;
      }
    }
    uint16_t freeSlot = 1;
    getNextFreeSlot(freeSlot);
    return freeSlot;
  }

  void saveStudentSlotMapping(
    uint16_t slot,
    uint32_t studentId,
    uint16_t rollNo,
    const char* enrollmentNo,
    const char* fullName,
    const char* templateSha256
  ) {
    if (slot < 1 || slot > AS608_MAX_SLOTS) return;
    LocalStudentSlotEntry& entry = ramRosterCache[slot];
    entry.magic = SLOT_RECORD_MAGIC;
    entry.as608_slot = slot;
    entry.student_id = studentId;
    entry.class_roll_no = rollNo;
    strncpy(entry.enrollment_no, enrollmentNo ? enrollmentNo : "", sizeof(entry.enrollment_no) - 1);
    entry.enrollment_no[sizeof(entry.enrollment_no) - 1] = '\0';
    strncpy(entry.full_name, fullName ? fullName : "Student", sizeof(entry.full_name) - 1);
    entry.full_name[sizeof(entry.full_name) - 1] = '\0';
    strncpy(entry.template_sha256, templateSha256 ? templateSha256 : "", sizeof(entry.template_sha256) - 1);
    entry.template_sha256[sizeof(entry.template_sha256) - 1] = '\0';

    // Persist to internal ESP32 NVS Flash
    char key[16];
    makeSlotKey(slot, key, sizeof(key));
    prefs.putBytes(key, &entry, sizeof(LocalStudentSlotEntry));
    Serial.printf("[STORAGE] Mapped Slot %u -> Student ID %lu (%s) in Internal NVS Flash\n", slot, (unsigned long)studentId, entry.full_name);
  }

  void recordSlotAssignment(
    uint16_t slot,
    uint32_t studentId,
    const char* enrollNo,
    const char* name,
    uint16_t rollNo
  ) {
    saveStudentSlotMapping(slot, studentId, rollNo, enrollNo, name, "");
  }

  void clearStudentSlotMapping(uint16_t slot) {
    if (slot < 1 || slot > AS608_MAX_SLOTS) return;
    memset(&ramRosterCache[slot], 0, sizeof(LocalStudentSlotEntry));

    // Remove from internal ESP32 NVS Flash
    char key[16];
    makeSlotKey(slot, key, sizeof(key));
    if (prefs.isKey(key)) {
      prefs.remove(key);
    }
    Serial.printf("[STORAGE] Cleared Slot %u from Internal NVS Flash\n", slot);
  }

  bool lookupStudentBySlot(uint16_t slot, LocalStudentSlotEntry& outEntry) {
    if (slot < 1 || slot > AS608_MAX_SLOTS) return false;
    if (ramRosterCache[slot].magic == SLOT_RECORD_MAGIC) {
      outEntry = ramRosterCache[slot];
      return true;
    }
    return false;
  }

  uint16_t getEnrolledStudentCount() const {
    uint16_t count = 0;
    for (uint16_t s = 1; s <= AS608_MAX_SLOTS; s++) {
      if (ramRosterCache[s].magic == SLOT_RECORD_MAGIC) count++;
    }
    return count;
  }

  // ─── Offline Scans Buffer (Circular RAM Buffer) ─────────────────────────
  void scanOfflineQueuePointers() {
    // Unsynced count is maintained live in memory
  }

  bool appendOfflineAttendance(
    uint32_t studentId,
    uint16_t as608Slot,
    uint16_t rollNo,
    const char* fullName,
    const char* enrollNo,
    uint32_t epochSec,
    uint8_t confidence,
    const char* eventId
  ) {
    uint32_t idx = writeHeadIndex % MAX_OFFLINE_BUFFER_RECORDS;
    OfflineAttendanceRecord& rec = offlineQueue[idx];
    rec.magic = OFFLINE_RECORD_MAGIC;
    rec.synced = 0xFF; // Unsynced
    rec.confidence = confidence;
    rec.student_id = studentId;
    rec.as608_slot = as608Slot;
    rec.class_roll_no = rollNo;
    rec.scanned_at_epoch = epochSec;
    strncpy(rec.event_id, eventId ? eventId : "", sizeof(rec.event_id) - 1);
    rec.event_id[sizeof(rec.event_id) - 1] = '\0';
    strncpy(rec.full_name, fullName ? fullName : "Student", sizeof(rec.full_name) - 1);
    rec.full_name[sizeof(rec.full_name) - 1] = '\0';
    strncpy(rec.enrollment_no, enrollNo ? enrollNo : "", sizeof(rec.enrollment_no) - 1);
    rec.enrollment_no[sizeof(rec.enrollment_no) - 1] = '\0';
    memset(rec.reserved, 0, sizeof(rec.reserved));

    writeHeadIndex++;
    if (unsyncedCount < MAX_OFFLINE_BUFFER_RECORDS) {
      unsyncedCount++;
    }
    return true;
  }

  size_t fetchUnsyncedBatch(OfflineAttendanceRecord* outBatch, uint32_t* outIndices, size_t maxRecords) {
    size_t count = 0;
    for (size_t i = 0; i < MAX_OFFLINE_BUFFER_RECORDS && count < maxRecords; i++) {
      if (offlineQueue[i].magic == OFFLINE_RECORD_MAGIC && offlineQueue[i].synced == 0xFF) {
        outBatch[count] = offlineQueue[i];
        outIndices[count] = (uint32_t)i;
        count++;
      }
    }
    return count;
  }

  void markRecordSynced(uint32_t index) {
    if (index < MAX_OFFLINE_BUFFER_RECORDS) {
      offlineQueue[index].synced = 0x00;
      if (unsyncedCount > 0) unsyncedCount--;
    }
  }

  uint32_t getUnsyncedCount() const { return unsyncedCount; }
  uint32_t getUsedFlashKb() const   {
    return (uint32_t)((getEnrolledStudentCount() * sizeof(LocalStudentSlotEntry)) / 1024);
  }
};

typedef W25Q32FlashManager VidyaStorageManager;

#endif // VIDYAOS_W25Q32_STORAGE_H
