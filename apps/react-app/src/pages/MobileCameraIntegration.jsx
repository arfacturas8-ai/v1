import React, { useRef, memo } from 'react'
import { Camera, X } from 'lucide-react'

const MobileCameraIntegration = ({ onClose, onCapture }) => {
  const videoRef = useRef(null)

  return (
    <div style={{background: "var(--bg-primary)"}} className="fixed inset-0 z-50 " role="dialog" aria-modal="true" aria-label="Camera">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4">
        <button onClick={onClose} style={{color: "var(--text-primary)"}} className="card p-4   rounded-full  min-h-[60px] min-w-[60px]">
          <X size={24} />
        </button>
        <button onClick={onCapture} style={{color: "var(--text-primary)"}} className="p-6 bg-blue-600 rounded-full  min-h-[80px] min-w-[80px]">
          <Camera size={32} />
        </button>
      </div>
    </div>
  )
}

export default memo(MobileCameraIntegration)

