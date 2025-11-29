import React, { memo } from 'react'
import { X, Users, Hash, Settings } from 'lucide-react'

const MobileCommunityDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div style={styles.container} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div style={styles.drawer}>
        <button onClick={onClose} style={styles.closeButton} aria-label="Close drawer">
          <X style={styles.closeIcon} />
        </button>
        <h2 id="drawer-title" style={styles.title}>Communities</h2>
        <div style={styles.list}>
          <div style={{...styles.item, ...styles.itemActive}}>
            <Users style={styles.itemIcon} />
            <span>Gaming</span>
          </div>
          <div style={styles.item}>
            <Hash style={styles.itemIconSecondary} />
            <span>Music</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(MobileCommunityDrawer)

