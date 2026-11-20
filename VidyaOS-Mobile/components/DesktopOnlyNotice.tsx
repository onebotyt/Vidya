/**
 * Reusable Desktop-Only Gate Component
 * Displayed for heavy desktop modules (Sheets, Course-File, Assessment-Process, ESP32, HOD-Archive)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { CONFIG } from '../constants/config';

interface DesktopOnlyNoticeProps {
  moduleName: string;
  description?: string;
  webPath?: string;
  onGoBack?: () => void;
}

export const DesktopOnlyNotice: React.FC<DesktopOnlyNoticeProps> = ({
  moduleName,
  description = 'This feature includes extensive multi-column ledgers, advanced formula calculation tools, and document review panels built specifically for desktop screens.',
  webPath = '/faculty/sheets/',
  onGoBack,
}) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const cleanPath = webPath.startsWith('/') ? webPath : `/${webPath}`;
  const fullWebUrl = `${CONFIG.WEB_BASE_URL}${cleanPath}`;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(fullWebUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      {/* Visual Illustration Card */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="monitor-dashboard" size={54} color={THEME.colors.primary} />
        </View>

        {/* Mandatory Heading */}
        <Text style={styles.mainHeading}>Please move to Desktop</Text>
        <Text style={styles.subHeading}>Optimized for Desktop Browser</Text>

        {/* Module Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{moduleName}</Text>
        </View>

        {/* Explanation Description */}
        <Text style={styles.description}>{description}</Text>

        {/* Web URL Card */}
        <View style={styles.urlCard}>
          <Text style={styles.urlLabel}>Open on your PC / Mac browser:</Text>
          <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="middle">
            {fullWebUrl}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.primaryButton, copied && styles.copiedButton]}
            onPress={handleCopyLink}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={copied ? 'check-circle' : 'content-copy'}
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>
              {copied ? 'Web Link Copied!' : 'Copy Web Link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={THEME.colors.textSecondary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    ...THEME.shadows.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: THEME.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  mainHeading: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subHeading: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textMuted,
    fontWeight: THEME.typography.weights.medium,
    marginBottom: THEME.spacing.md,
  },
  badge: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  badgeText: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.semibold,
    color: THEME.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: 8,
  },
  urlCard: {
    width: '100%',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xl,
  },
  urlLabel: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  urlText: {
    fontSize: THEME.typography.sizes.xs,
    fontFamily: 'monospace',
    color: THEME.colors.primaryDark,
    fontWeight: THEME.typography.weights.semibold,
  },
  buttonGroup: {
    width: '100%',
    gap: THEME.spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: THEME.radii.md,
    width: '100%',
  },
  copiedButton: {
    backgroundColor: THEME.colors.success,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: THEME.typography.sizes.base,
    fontWeight: THEME.typography.weights.semibold,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    width: '100%',
  },
  secondaryButtonText: {
    color: THEME.colors.textSecondary,
    fontSize: THEME.typography.sizes.base,
    fontWeight: THEME.typography.weights.medium,
  },
});

