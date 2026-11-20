import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconName,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const effectiveIcon = icon || iconName;
  const getVariantStyles = (): { btn: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          btn: { backgroundColor: THEME.colors.surfaceSubtle, borderWidth: 1, borderColor: THEME.colors.border },
          text: { color: THEME.colors.textPrimary },
        };
      case 'outline':
        return {
          btn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: THEME.colors.primary },
          text: { color: THEME.colors.primary },
        };
      case 'danger':
        return {
          btn: { backgroundColor: THEME.colors.error },
          text: { color: '#FFFFFF' },
        };
      case 'ghost':
        return {
          btn: { backgroundColor: 'transparent' },
          text: { color: THEME.colors.textSecondary },
        };
      case 'primary':
      default:
        return {
          btn: { backgroundColor: THEME.colors.primary },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const getSizeStyles = (): { btn: ViewStyle; text: TextStyle; iconSize: number } => {
    switch (size) {
      case 'sm':
        return {
          btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: THEME.radii.sm },
          text: { fontSize: THEME.typography.sizes.xs },
          iconSize: 16,
        };
      case 'lg':
        return {
          btn: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: THEME.radii.lg },
          text: { fontSize: THEME.typography.sizes.md },
          iconSize: 22,
        };
      case 'md':
      default:
        return {
          btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: THEME.radii.md },
          text: { fontSize: THEME.typography.sizes.base },
          iconSize: 18,
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.baseButton,
        vStyles.btn,
        sStyles.btn,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vStyles.text.color} />
      ) : (
        <>
          {effectiveIcon && iconPosition === 'left' && (
            <MaterialCommunityIcons
              name={effectiveIcon}
              size={sStyles.iconSize}
              color={(vStyles.text.color as string) || '#FFFFFF'}
              style={styles.leftIcon}
            />
          )}
          <Text style={[styles.baseText, vStyles.text, sStyles.text, textStyle]}>
            {title}
          </Text>
          {effectiveIcon && iconPosition === 'right' && (
            <MaterialCommunityIcons
              name={effectiveIcon}
              size={sStyles.iconSize}
              color={(vStyles.text.color as string) || '#FFFFFF'}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  baseText: {
    fontWeight: THEME.typography.weights.semibold,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});
