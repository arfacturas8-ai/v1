import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Plus, X, Check } from 'lucide-react'

const TokenGatingSetupPage = () => {
  const [gates, setGates] = useState([])
  const [showAddGate, setShowAddGate] = useState(false)

  const addGate = (gate) => {
    setGates([...gates, { ...gate, id: Date.now() }])
    setShowAddGate(false)
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Token gating setup page">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card card-elevated">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-gradient)' }}>
              <Shield className="w-5 h-5" style={{ color: 'var(--text-inverse)' }} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Token Gating Setup</h1>
          </div>
          <p className="text-sm md:text-base mb-6 md:mb-8" style={{ color: 'var(--text-secondary)' }}>Control access to your community with token requirements</p>

          <div className="flex flex-col gap-3 md:gap-4">
            {gates.map(gate => (
              <div key={gate.id} className="card" style={{ background: 'var(--color-info-light)', borderColor: 'var(--brand-primary)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <Lock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--brand-primary)' }} />
                    <div className="min-w-0">
                      <div className="text-sm md:text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{gate.name}</div>
                      <div className="text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>Min {gate.amount} tokens required</div>
                    </div>
                  </div>
                  <button onClick={() => setGates(gates.filter(g => g.id !== gate.id))} className="btn-ghost p-2 rounded-lg flex-shrink-0">
                    <X className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setShowAddGate(true)} className="btn-primary w-full mt-6 md:mt-8 py-3 md:py-3.5 text-sm md:text-base font-semibold flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Add Token Gate
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(TokenGatingSetupPage)

