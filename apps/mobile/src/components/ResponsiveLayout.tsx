/**
 * RESPONSIVE LAYOUT COMPONENT
 * Provides responsive layout containers for different screen sizes
 */

import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deviceInfo, responsivePadding, layout, spacing } from '../utils/responsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  safeArea?: boolean;
  centered?: boolean;
  maxWidth?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  testID?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  style,
  contentContainerStyle,
  scrollable = false,
  safeArea = true,
  centered = false,
  maxWidth = false,
  padding = 'medium',
  testID,
}) => {
  const containerStyle = [
    styles.container,
    style,
    padding !== 'none' && getPaddingStyle(padding),
    maxWidth && styles.maxWidth,
    centered && styles.centered,
  ];

  const content = scrollable ? (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={[
        styles.scrollContent,
        contentContainerStyle,
        centered && styles.centeredContent,
      ]}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={containerStyle} testID={testID}>
      {children}
    </View>
  );

  return safeArea ? (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  ) : (
    content
  );
};

// Grid Layout Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: number;
  style?: ViewStyle;
  testID?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  spacing: gridSpacing = spacing.md,
  style,
  testID,
}) => {
  const numColumns = columns || layout.gridColumns;
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[styles.grid, { gap: gridSpacing }, style]} testID={testID}>
      {Array.from({ length: Math.ceil(childrenArray.length / numColumns) }, (_, rowIndex) => (
        <View key={rowIndex} style={[styles.gridRow, { gap: gridSpacing }]}>
          {Array.from({ length: numColumns }, (_, colIndex) => {
            const childIndex = rowIndex * numColumns + colIndex;
            const child = childrenArray[childIndex];
            return child ? (
              <View key={childIndex} style={styles.gridItem}>
                {child}
              </View>
            ) : (
              <View key={childIndex} style={styles.gridItem} />
            );
          })}
        </View>
      ))}
    </View>
  );
};

// Two Column Layout for Tablets
interface ResponsiveTwoColumnProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftWidth?: number | string;
  rightWidth?: number | string;
  style?: ViewStyle;
  testID?: string;
}

export const ResponsiveTwoColumn: React.FC<ResponsiveTwoColumnProps> = ({
  leftContent,
  rightContent,
  leftWidth = '40%',
  rightWidth = '60%',
  style,
  testID,
}) => {
  // On phones, stack vertically; on tablets, show side by side
  if (!deviceInfo.isTablet) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        <View style={styles.stackedColumn}>{leftContent}</View>
        <View style={styles.stackedColumn}>{rightContent}</View>
      </View>
    );
  }

  return (
    <View style={[styles.twoColumn, style]} testID={testID}>
      <View style={[styles.leftColumn, { width: leftWidth }]}>
        {leftContent}
      </View>
      <View style={[styles.rightColumn, { width: rightWidth }]}>
        {rightContent}
      </View>
    </View>
  );
};

// Master-Detail Layout for Large Tablets
interface ResponsiveMasterDetailProps {
  masterContent: React.ReactNode;
  detailContent: React.ReactNode;
  masterWidth?: number;
  showMaster?: boolean;
  onMasterToggle?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const ResponsiveMasterDetail: React.FC<ResponsiveMasterDetailProps> = ({
  masterContent,
  detailContent,
  masterWidth = layout.sidebarWidth,
  showMaster = true,
  style,
  testID,
}) => {
  // On phones and small tablets, show only one panel at a time
  if (!deviceInfo.isLargeTablet) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        {showMaster ? masterContent : detailContent}
      </View>
    );
  }

  // On large tablets, show master-detail layout
  return (
    <View style={[styles.masterDetail, style]} testID={testID}>
      {showMaster && (
        <View style={[styles.masterPanel, { width: masterWidth }]}>
          {masterContent}
        </View>
      )}
      <View style={styles.detailPanel}>
        {detailContent}
      </View>
    </View>
  );
};

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'small' | 'medium' | 'large';
  elevated?: boolean;
  testID?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  style,
  padding = 'medium',
  elevated = true,
  testID,
}) => {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.cardElevated,
        getPaddingStyle(padding),
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

// Helper function to get padding styles
const getPaddingStyle = (padding: 'small' | 'medium' | 'large') => {
  switch (padding) {
    case 'small':
      return { padding: spacing.sm };
    case 'medium':
      return { padding: spacing.md };
    case 'large':
      return { padding: spacing.lg };
    default:
      return { padding: spacing.md };
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  maxWidth: {
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  
  // Grid Layout
  grid: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridItem: {
    flex: 1,
  },
  
  // Two Column Layout
  twoColumn: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.lg,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  stackedColumn: {
    marginBottom: spacing.md,
  },
  
  // Master-Detail Layout
  masterDetail: {
    flexDirection: 'row',
    flex: 1,
  },
  masterPanel: {
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  detailPanel: {
    flex: 1,
  },
  
  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    ...deviceInfo.isTablet && {
      borderRadius: 16,
    },
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

// Responsive spacing hook
export const useResponsiveSpacing = () => {
  return {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    container: responsivePadding.container,
    horizontal: responsivePadding.horizontal,
    vertical: responsivePadding.vertical,
  };
};