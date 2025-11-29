import React, { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Send } from 'lucide-react'

const CryptoTippingModal = ({ isOpen, onClose, recipient }) => {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('ETH')
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="tip-modal-title">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden" style={{ background: 'rgba(22, 27, 34, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="p-6 text-white" style={{ background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8" />
                <h2 id="tip-modal-title" className="text-2xl font-bold">Send Tip</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[#161b22]/60 backdrop-blur-xl rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#c9d1d9]">Amount</label>
              <div className="flex gap-2">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="flex-1 px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white outline-none" style={{ background: '#21262d', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white outline-none" style={{ background: '#21262d', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="DAI">DAI</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#c9d1d9]">Message (optional)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a note..." rows={3} className="w-full px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white outline-none resize-none" style={{ background: '#21262d', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
            </div>
            <button className="w-full py-3 text-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)' }}>
              <Send className="w-5 h-5" />
              Send Tip
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(CryptoTippingModal)

