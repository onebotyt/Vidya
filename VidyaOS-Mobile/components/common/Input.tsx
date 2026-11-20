import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helperText?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  isPassword = false,
  containerStyle,
  style,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focusedWrapper,
          Boolean(error) && styles.errorWrapper,
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={error ? THEME.colors.error : isFocused ? THEME.colors.primary : THEME.colors.textMuted}
            style={styles.icon}
          />
        )}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={THEME.colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={THEME.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.semibold,
    color: THEME.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 12,
  },
  focusedWrapper: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#FAFCFF',
  },
  errorWrapper: {
    borderColor: THEME.colors.error,
    backgroundColor: '#FFFBFB',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.textPrimary,
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.error,
    marginTop: 4,
    fontWeight: THEME.typography.weights.medium,
  },
  helperText: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
});

