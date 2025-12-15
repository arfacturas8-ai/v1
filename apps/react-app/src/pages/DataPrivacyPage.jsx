import React, { memo } from 'react'
import { useResponsive } from '../hooks/useResponsive'

const DataPrivacyPage = () => {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const compactSpacing = {
    formGap: isMobile ? 16 : isTablet ? 14 : 12,
    headerMargin: isMobile ? 20 : isTablet ? 18 : 16,
    logoMargin: isMobile ? 12 : isTablet ? 10 : 8,
    labelMargin: isMobile ? 8 : 6,
    inputPadding: isMobile ? 12 : 10,
    dividerMargin: isMobile ? 20 : isTablet ? 18 : 14,
    cardPadding: isMobile ? 20 : isTablet ? 24 : 20,
    sectionGap: isMobile ? 16 : isTablet ? 14 : 12
  }
  return (
    <div className={`min-h-screen ${isMobile ? 'p-3' : 'p-4'} bg-[var(--color-bg-primary)] pt-20`} role="main" aria-label="Data privacy page">
      <div className="max-w-7xl mx-auto">
        <div className={`bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl ${isMobile ? 'p-5' : 'p-6'} shadow-[0_4px_16px_rgba(0,0,0,0.05)]`}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-6 text-[var(--color-text-primary)]`}>Data Privacy</h1>
          <p className="text-base leading-relaxed text-[var(--color-text-primary)]">This is the DataPrivacyPage page. Content will be implemented here.</p>
        </div>
      </div>
    </div>
  )
}

export default memo(DataPrivacyPage)

