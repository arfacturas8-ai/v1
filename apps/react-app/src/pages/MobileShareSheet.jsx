import React, { memo } from 'react'
import { Share2, Copy, Facebook, Twitter, Mail } from 'lucide-react'

const MobileShareSheet = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-sheet-title">
      <div style={styles.sheet} onClick={e => e.stopPropagation()}>
        <h3 id="share-sheet-title" style={styles.title}>Share</h3>
        <div style={styles.grid}>
          <button style={styles.shareButton}>
            <div style={{...styles.iconCircle, background: '#58a6ff'}}>
              <Copy style={styles.shareIcon} />
            </div>
            <span style={styles.shareLabel}>Copy</span>
          </button>
          <button style={styles.shareButton}>
            <div style={{...styles.iconCircle, background: '#1877f2'}}>
              <Facebook style={styles.shareIcon} />
            </div>
            <span style={styles.shareLabel}>Facebook</span>
          </button>
          <button style={styles.shareButton}>
            <div style={{...styles.iconCircle, background: '#1da1f2'}}>
              <Twitter style={styles.shareIcon} />
            </div>
            <span style={styles.shareLabel}>Twitter</span>
          </button>
          <button style={styles.shareButton}>
            <div style={{...styles.iconCircle, background: '#ef4444'}}>
              <Mail style={styles.shareIcon} />
            </div>
            <span style={styles.shareLabel}>Email</span>
          </button>
        </div>
        <button onClick={onClose} style={styles.cancelButton}>Cancel</button>
      </div>
    </div>
  )
}

export default memo(MobileShareSheet)

