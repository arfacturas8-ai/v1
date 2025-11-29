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
    <div className="min-h-screen p-4 md:p-6 bg-[#0d1117]" role="main" aria-label="Token gating setup page">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center bg-gradient-to-br from-[#58a6ff] to-[#a371f7]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Token Gating Setup</h1>
          </div>
          <p className="text-sm md:text-base text-[#8b949e] mb-6 md:mb-8">Control access to your community with token requirements</p>

          <div className="flex flex-col gap-3 md:gap-4">
            {gates.map(gate => (
              <div key={gate.id} className="bg-[#a371f7]/10 border border-[#a371f7]/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-3 md:p-5 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <Lock className="w-5 h-5 text-[#a371f7] flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm md:text-base font-semibold text-white truncate">{gate.name}</div>
                    <div className="text-xs md:text-sm text-[#8b949e]">Min {gate.amount} tokens required</div>
                  </div>
                </div>
                <button onClick={() => setGates(gates.filter(g => g.id !== gate.id))} className="p-2 hover:bg-[#161b22]/60 backdrop-blur-xl rounded-lg transition-colors flex-shrink-0">
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => setShowAddGate(true)} className="w-full mt-6 md:mt-8 py-3 md:py-3.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-sm md:text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="w-5 h-5" />
            Add Token Gate
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(TokenGatingSetupPage)

