import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
  return (
    <View
      style={[
        styles.baseCard,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.base,
    marginBottom: THEME.spacing.md,
  },
  elevated: {
    ...THEME.shadows.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  flat: {
    backgroundColor: THEME.colors.surfaceSubtle,
  },
});

