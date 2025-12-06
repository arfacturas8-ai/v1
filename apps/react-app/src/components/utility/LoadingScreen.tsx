import React from 'react';
import { colors, spacing, typography } from '../../design-system/tokens';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  fullScreen = true,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : '400px',
        backgroundColor: fullScreen ? colors.bg.primary : 'transparent',
        padding: spacing[8],
        textAlign: 'center',
      }}
    >
      {message && (
        <p
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text.secondary,
            margin: 0,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingScreen;
