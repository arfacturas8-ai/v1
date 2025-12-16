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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{background: "var(--bg-primary)"}} className="fixed inset-0 z-50 flex items-center justify-center /60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="tip-modal-title">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl  overflow-hidden" style={{ background: 'rgba(22, 27, 34, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}>
          <div className="p-6" style={{ color: "var(--text-primary)", background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign style={{ width: "48px", height: "48px", flexShrink: 0 }} />
                <h2 id="tip-modal-title" className="text-2xl font-bold">Send Tip</h2>
              </div>
              <button onClick={onClose} className="card p-2 hover:  rounded-lg transition-colors">
                <X style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label style={{color: "var(--text-primary)"}} className="block text-sm font-medium mb-2 ">Amount</label>
              <div className="flex gap-2">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="flex-1 px-4 py-3 rounded-2xl outline-none" style={{ color: "var(--text-primary)", background: '#21262d', border: '1px solid var(--border-subtle)' }} />
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="px-4 py-3 rounded-2xl outline-none" style={{ color: "var(--text-primary)", background: '#21262d', border: '1px solid var(--border-subtle)' }}>
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="DAI">DAI</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{color: "var(--text-primary)"}} className="block text-sm font-medium mb-2 ">Message (optional)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a note..." rows={3} className="w-full px-4 py-3 rounded-2xl outline-none resize-none" style={{ color: "var(--text-primary)", background: '#21262d', border: '1px solid var(--border-subtle)' }} />
            </div>
            <button className="w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ color: "var(--text-primary)", background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)' }}>
              <Send style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              Send Tip
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(CryptoTippingModal)

