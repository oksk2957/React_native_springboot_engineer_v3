import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [styles.container];
    
    // Size styles
    switch (size) {
      case 'small':
        base.push(styles.sizeSmall);
        break;
      case 'large':
        base.push(styles.sizeLarge);
        break;
      default:
        base.push(styles.sizeMedium);
    }
    
    // Variant styles
    switch (variant) {
      case 'secondary':
        base.push(styles.variantSecondary);
        break;
      case 'outline':
        base.push(styles.variantOutline);
        break;
      case 'ghost':
        base.push(styles.variantGhost);
        break;
      default:
        base.push(styles.variantPrimary);
    }
    
    if (disabled) {
      base.push(styles.disabled);
    }
    
    return base;
  };
  
  const getTextStyle = (): TextStyle[] => {
    const base: TextStyle[] = [styles.text];
    
    switch (variant) {
      case 'outline':
      case 'ghost':
        base.push(styles.textOutline);
        break;
      default:
        base.push(styles.textPrimary);
    }
    
    return base;
  };
  
  return (
    <TouchableOpacity
      style={[...getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white} />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  sizeSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sizeMedium: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  sizeLarge: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  variantPrimary: {
    backgroundColor: colors.primary,
  },
  variantSecondary: {
    backgroundColor: colors.secondary,
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
  },
  textPrimary: {
    color: colors.white,
  },
  textOutline: {
    color: colors.primary,
  },
});