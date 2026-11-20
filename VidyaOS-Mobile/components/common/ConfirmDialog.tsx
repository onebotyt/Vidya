import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';
import { Button } from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  variant,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const destructive = isDestructive || variant === 'danger';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          <View
            style={[
              styles.iconCircle,
              destructive ? styles.destructiveIcon : styles.normalIcon,
            ]}
          >
            <MaterialCommunityIcons
              name={destructive ? 'alert-outline' : 'help-circle-outline'}
              size={32}
              color={destructive ? THEME.colors.error : THEME.colors.primary}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <Button
              title={cancelText}
              onPress={onCancel}
              variant="secondary"
              disabled={loading}
              style={{ flex: 1, marginRight: 8 }}
              fullWidth={false}
            />
            <Button
              title={confirmText}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'primary'}
              loading={loading}
              style={{ flex: 1, marginLeft: 8 }}
              fullWidth={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    ...THEME.shadows.elevated,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  normalIcon: {
    backgroundColor: THEME.colors.primaryLight,
  },
  destructiveIcon: {
    backgroundColor: '#FEE2E2',
  },
  title: {
    fontSize: 18,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: THEME.spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
  },
});

