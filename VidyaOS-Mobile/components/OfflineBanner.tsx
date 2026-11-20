/**
 * Lightweight Offline & Network Status Banner
 * Handles Render cloud cold-starts gracefully:
 * - Distinguishes true offline (device has no internet) from slow backend cold-start
 * - Uses reliable public 204 ping (connectivitycheck.gstatic.com/generate_204)
 * - 25-second initial mount grace period so cold-starts never flash offline
 * - Requires 3 consecutive failed checks before displaying red offline banner
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const failureCountRef = useRef(0);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const checkInternetAccess = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('https://connectivitycheck.gstatic.com/generate_204', {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        });
        clearTimeout(timeoutId);
        return res.status === 204 || res.ok;
      } catch {
        // Fallback secondary check
        try {
          const fallbackCtrl = new AbortController();
          const fbTimeout = setTimeout(() => fallbackCtrl.abort(), 6000);
          const fbRes = await fetch('https://1.1.1.1/', {
            method: 'HEAD',
            signal: fallbackCtrl.signal,
          });
          clearTimeout(fbTimeout);
          return fbRes.ok || fbRes.status < 500;
        } catch {
          return false;
        }
      }
    };

    const runCheck = async () => {
      const hasInternet = await checkInternetAccess();
      if (!isMountedRef.current) return;

      if (hasInternet) {
        failureCountRef.current = 0;
        setIsOffline(false);
      } else {
        failureCountRef.current += 1;
        // Require 3 consecutive failed checks (60 seconds of zero internet) before showing banner
        if (failureCountRef.current >= 3) {
          setIsOffline(true);
        }
      }
    };

    // Grace period on initial mount (first check after 25s to allow cold-start)
    const initialTimer = setTimeout(() => {
      runCheck();
      interval = setInterval(runCheck, 20000);
    }, 25000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimer);
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="wifi-off" size={16} color="#FFFFFF" />
      <Text style={styles.bannerText}>
        No internet connection detected. Offline changes will sync when reconnected.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
