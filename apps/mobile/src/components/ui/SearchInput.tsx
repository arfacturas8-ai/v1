import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface SearchInputProps extends Omit<TextInputProps, 'style'> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  debounceMs?: number;
  showSearchIcon?: boolean;
  showClearButton?: boolean;
  containerStyle?: ViewStyle;
  autoFocus?: boolean;
}

export function SearchInput({
  onSearch,
  onClear,
  onFocus,
  onBlur,
  debounceMs = 300,
  showSearchIcon = true,
  showClearButton = true,
  containerStyle,
  autoFocus = false,
  placeholder = "Search...",
  value,
  onChangeText,
  ...props
}: SearchInputProps) {
  const { colors, spacing, typography, shadows } = useTheme();
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (!onSearch || searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch, debounceMs]);

  const handleChangeText = (text: string) => {
    setSearchQuery(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    if (onChangeText) {
      onChangeText('');
    }
    if (onClear) {
      onClear();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  };

  const containerStyles = [
    styles.container(colors, spacing, shadows),
    isFocused && styles.containerFocused(colors),
    containerStyle,
  ];

  return (
    <View style={containerStyles}>
      {showSearchIcon && (
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? colors.primary : colors.textSecondary}
          style={styles.searchIcon(spacing)}
        />
      )}
      
      <TextInput
        style={styles.input(colors, typography, spacing, showSearchIcon)}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        value={searchQuery}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      
      {showClearButton && searchQuery.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton(spacing)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = {
  container: (colors: any, spacing: any, shadows: any) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  }),
  containerFocused: (colors: any) => ({
    borderColor: colors.primary,
    ...{
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
  }),
  searchIcon: (spacing: any) => ({
    marginRight: spacing.sm,
  }),
  input: (colors: any, typography: any, spacing: any, hasSearchIcon: boolean) => ({
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.text,
    paddingVertical: 0, // Remove default padding
    marginLeft: hasSearchIcon ? 0 : spacing.xs,
  }),
  clearButton: (spacing: any) => ({
    marginLeft: spacing.sm,
    padding: 2,
  }),
};