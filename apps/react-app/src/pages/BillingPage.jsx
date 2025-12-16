import React, { memo } from 'react'
import { CreditCard, Receipt, TrendingUp, Clock } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const BillingPage = () => {
  const { isMobile, isTablet } = useResponsive()

  return (
    <div className={`min-h-screen bg-[#0d1117] text-[#c9d1d9] ${isMobile ? 'py-10 px-4' : 'py-10 px-5'} pt-20`} role="main" aria-label="Billing page">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-10">
          <div className="w-18 h-18 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={isMobile ? 28 : 32} className="text-[#58a6ff]" />
          </div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2`}>Billing</h1>
          <p style={{color: "var(--text-secondary)"}} className="text-base ">Manage your subscription and payment methods</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className={`bg-[#161b22]/60  border border-white/10 rounded-2xl  ${isMobile ? 'p-5' : 'p-6'}`}>
            <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
              <Receipt size={24} className="text-[#58a6ff]" />
            </div>
            <h3 style={{color: "var(--text-primary)"}} className="text-base font-semibold  mb-2">Current Plan</h3>
            <p style={{color: "var(--text-secondary)"}} className="text-sm  mb-4">Free Tier</p>
            <button style={{color: "var(--text-primary)"}} className="w-full py-3 px-5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] border-none rounded-lg  text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">Upgrade Plan</button>
          </div>

          <div className={`bg-[#161b22]/60  border border-white/10 rounded-2xl  ${isMobile ? 'p-5' : 'p-6'}`}>
            <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
              <TrendingUp size={24} className="text-green-500" />
            </div>
            <h3 style={{color: "var(--text-primary)"}} className="text-base font-semibold  mb-2">Usage This Month</h3>
            <p style={{color: "var(--text-secondary)"}} className="text-sm  mb-4">0 / 1,000 API calls</p>
            <div className="card h-2   rounded overflow-hidden">
              <div className="w-0 h-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded" />
            </div>
          </div>

          <div className={`bg-[#161b22]/60  border border-white/10 rounded-2xl  ${isMobile ? 'p-5' : 'p-6'}`}>
            <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
              <Clock size={24} className="text-[#a371f7]" />
            </div>
            <h3 style={{color: "var(--text-primary)"}} className="text-base font-semibold  mb-2">Next Billing</h3>
            <p style={{color: "var(--text-secondary)"}} className="text-sm  mb-4">No upcoming charges</p>
          </div>
        </div>

        <div className={`bg-[#161b22]/60  border border-white/10 rounded-2xl  ${isMobile ? 'p-5' : 'p-6'}`}>
          <h3 style={{color: "var(--text-primary)"}} className="text-lg font-semibold  mb-4">Payment History</h3>
          <p style={{color: "var(--text-secondary)"}} className="text-sm  text-center py-8">No transactions yet</p>
        </div>
      </div>
    </div>
  )
}

export default memo(BillingPage)

