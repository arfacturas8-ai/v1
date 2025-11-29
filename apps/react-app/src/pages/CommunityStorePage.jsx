import React, { memo } from 'react'
import { Store, ShoppingBag, Tag, Gift } from 'lucide-react'

const CommunityStorePage = () => {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-6 px-4 sm:py-10 sm:px-5" role="main" aria-label="Community store page">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Store size={32} className="text-[#58a6ff]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
            Community Store
          </h1>
          <p className="text-sm sm:text-base text-[#8b949e]">Exclusive items and merchandise for community members</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6 text-center">
            <div className="w-12 h-12 bg-[#58a6ff]/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <ShoppingBag size={24} className="text-[#58a6ff]" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Digital Items</h3>
            <p className="text-xs sm:text-sm text-[#8b949e]">Badges, emotes, and profile customizations</p>
          </div>

          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6 text-center">
            <div className="w-12 h-12 bg-[#58a6ff]/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Tag size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Special Offers</h3>
            <p className="text-xs sm:text-sm text-[#8b949e]">Exclusive discounts for members</p>
          </div>

          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6 text-center sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-[#58a6ff]/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Gift size={24} className="text-[#a371f7]" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Rewards</h3>
            <p className="text-xs sm:text-sm text-[#8b949e]">Redeem your community points</p>
          </div>
        </div>

        <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Available Items</h3>
          <p className="text-xs sm:text-sm text-[#8b949e] text-center py-6 sm:py-8">
            No items available in the store yet. Check back soon!
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(CommunityStorePage)

