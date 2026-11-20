/**
 * Native Dynamic Roll-Call QR Code Camera Scanner
 * Uses expo-camera (CameraView) to scan live institutional QR attendance codes.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { studentService } from '../../services/studentService';
import { Button } from '../../components/common';

export default function StudentQrScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  useEffect(() => {
    // Check if there is an active attendance session
    const fetchSession = async () => {
      try {
        const sessions = await studentService.getOpenAttendanceSessions();
        if (sessions.length > 0) {
          setActiveSessionId(sessions[0].id);
        }
      } catch (err) {
        console.warn('Failed to retrieve open attendance sessions', err);
      }
    };
    fetchSession();
  }, []);

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.infoText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permIconCircle}>
          <MaterialCommunityIcons name="camera-off" size={40} color={THEME.colors.danger} />
        </View>
        <Text style={styles.permTitle}>Camera Permission Required</Text>
        <Text style={styles.permDesc}>
          VidyaOS requires camera access to scan dynamic roll-call QR codes during live attendance sessions.
        </Text>
        <Button
          title="Grant Camera Permission"
          variant="primary"
          onPress={requestPermission}
          style={{ width: '100%', marginBottom: THEME.spacing.sm }}
        />
        <Button
          title="Go Back"
          variant="outline"
          onPress={() => router.back()}
          style={{ width: '100%' }}
        />
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || submitting) return;
    setScanned(true);
    setSubmitting(true);

    try {
      // Determine sessionId from active session or parse from QR payload
      let sessionId = activeSessionId;
      let token = data;

      // Handle structured QR payload if JSON e.g. {"sessionId": 12, "token": "xyz"}
      if (data.startsWith('{')) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.sessionId) sessionId = parsed.sessionId;
          if (parsed.token) token = parsed.token;
        } catch {
          // Plain token string
        }
      }

      if (!sessionId) {
        // Fallback fetch latest open session
        const sessions = await studentService.getOpenAttendanceSessions();
        if (sessions.length > 0) {
          sessionId = sessions[0].id;
        } else {
          throw new Error('No open attendance roll-call session found for this course.');
        }
      }

      await studentService.submitSelfAttendance(sessionId, 'QR', token);

      Alert.alert(
        'Attendance Recorded!',
        'Your attendance has been verified and registered for this class session.',
        [
          {
            text: 'Return to Attendance',
            onPress: () => router.replace('/(student)/attendance'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Scan Failed',
        err?.message || 'Could not register QR attendance. Please retry or enter the 6-digit PIN manually.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setSubmitting(false);
            },
          },
          {
            text: 'Enter PIN Manually',
            onPress: () => router.replace('/(student)/attendance'),
            style: 'cancel',
          },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Top Header Bar Overlay */}
      <View style={styles.topOverlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Roll-Call QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Viewfinder Target Mask */}
      <View style={styles.viewfinderCenter}>
        <View style={styles.targetFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {submitting && (
            <View style={styles.submittingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.submittingText}>Registering Check-In...</Text>
            </View>
          )}
        </View>
        <Text style={styles.instructionText}>
          Align the camera with the dynamic QR code displayed on the classroom screen.
        </Text>
      </View>

      {/* Bottom Actions Overlay */}
      <View style={styles.bottomOverlay}>
        <TouchableOpacity
          style={styles.manualPinBtn}
          onPress={() => router.replace('/(student)/attendance')}
        >
          <MaterialCommunityIcons name="dialpad" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.manualPinText}>Enter 6-Digit PIN Instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  infoText: {
    marginTop: THEME.spacing.sm,
    color: THEME.colors.textMuted,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
    backgroundColor: THEME.colors.background,
  },
  permIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
    textAlign: 'center',
  },
  permDesc: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
    lineHeight: 18,
  },
  topOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  viewfinderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetFrame: {
    width: 250,
    height: 250,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: THEME.colors.primary,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submittingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  manualPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  manualPinText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
