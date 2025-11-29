import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { height: screenHeight } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: 'bottom-sheet' | 'center' | 'fullscreen';
  showCloseButton?: boolean;
  scrollable?: boolean;
  primaryAction?: {
    title: string;
    onPress: () => void;
    loading?: boolean;
    variant?: 'primary' | 'destructive';
  };
  secondaryAction?: {
    title: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  variant = 'center',
  showCloseButton = true,
  scrollable = false,
  primaryAction,
  secondaryAction,
  style,
}: ModalProps) {
  const { colors, spacing, typography, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  const getModalStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flex: 1,
      justifyContent: variant === 'bottom-sheet' ? 'flex-end' : 'center',
      alignItems: 'center',
      backgroundColor: colors.overlay,
    };

    return baseStyle;
  };

  const getContentStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.surface,
      borderRadius: variant === 'bottom-sheet' ? spacing.md : spacing.md,
      overflow: 'hidden',
      ...shadows.lg,
    };

    switch (variant) {
      case 'bottom-sheet':
        baseStyle.width = '100%';
        baseStyle.maxHeight = screenHeight * 0.9;
        baseStyle.borderBottomLeftRadius = 0;
        baseStyle.borderBottomRightRadius = 0;
        break;
      case 'fullscreen':
        baseStyle.width = '100%';
        baseStyle.height = '100%';
        baseStyle.borderRadius = 0;
        baseStyle.marginTop = insets.top;
        break;
      default: // center
        baseStyle.width = '90%';
        baseStyle.maxWidth = 400;
        baseStyle.maxHeight = screenHeight * 0.8;
    }

    return baseStyle;
  };

  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <RNModal
      visible={visible}
      animationType={variant === 'bottom-sheet' ? 'slide' : 'fade'}
      transparent
      onRequestClose={onClose}
    >
      <View style={getModalStyle()}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
          activeOpacity={1}
        />
        
        <View style={[getContentStyle(), style]}>
          {/* Header */}
          {(title || showCloseButton) && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: typography.fontSizes.lg,
                  fontWeight: typography.fontWeights.semibold,
                  color: colors.text,
                  flex: 1,
                }}
              >
                {title || ''}
              </Text>
              
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    padding: spacing.xs,
                    marginLeft: spacing.sm,
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Content */}
          <ContentWrapper
            style={{
              flex: variant === 'fullscreen' ? 1 : undefined,
              padding: spacing.md,
            }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ContentWrapper>
          
          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                gap: spacing.sm,
              }}
            >
              {secondaryAction && (
                <Button
                  title={secondaryAction.title}
                  onPress={secondaryAction.onPress}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              )}
              {primaryAction && (
                <Button
                  title={primaryAction.title}
                  onPress={primaryAction.onPress}
                  variant={primaryAction.variant || 'primary'}
                  loading={primaryAction.loading}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
}