import React, { useRef, memo } from 'react'
import { Camera, X } from 'lucide-react'

const MobileCameraIntegration = ({ onClose, onCapture }) => {
  const videoRef = useRef(null)

  return (
    <div className="fixed inset-0 z-50 bg-black" role="dialog" aria-modal="true" aria-label="Camera">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4">
        <button onClick={onClose} className="p-4 bg-[#161b22]/60 backdrop-blur-xl rounded-full text-white min-h-[60px] min-w-[60px]">
          <X size={24} />
        </button>
        <button onClick={onCapture} className="p-6 bg-blue-600 rounded-full text-white min-h-[80px] min-w-[80px]">
          <Camera size={32} />
        </button>
      </div>
    </div>
  )
}

export default memo(MobileCameraIntegration)

