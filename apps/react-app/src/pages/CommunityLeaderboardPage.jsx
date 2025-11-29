import React, { memo } from 'react'
import { Trophy, Medal, Crown, Star } from 'lucide-react'

const CommunityLeaderboardPage = () => {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-6 px-4 sm:py-10 sm:px-5" role="main" aria-label="Community leaderboard page">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Trophy size={32} className="text-amber-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
            Community Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-[#8b949e]">Top contributors and most active members</p>
        </div>

        <div className="flex flex-col sm:flex-row items-end justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="w-full sm:w-auto order-2 sm:order-1 bg-[#161b22]/60 backdrop-blur-xl border border-[#c0c0c0]/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6 text-center flex flex-col items-center min-h-[140px] sm:min-h-[160px]">
            <Medal size={32} className="text-[#c0c0c0]" />
            <div className="text-xl sm:text-2xl font-bold text-white my-2 sm:my-3">2</div>
            <div className="text-sm sm:text-base font-semibold text-white mb-1">--</div>
            <div className="text-xs sm:text-sm text-[#8b949e]">0 pts</div>
          </div>

          <div className="w-full sm:w-auto order-1 sm:order-2 bg-[#161b22]/60 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6 text-center flex flex-col items-center min-h-[160px] sm:min-h-[200px]">
            <Crown size={40} className="text-amber-500" />
            <div className="text-xl sm:text-2xl font-bold text-white my-2 sm:my-3">1</div>
            <div className="text-sm sm:text-base font-semibold text-white mb-1">--</div>
            <div className="text-xs sm:text-sm text-[#8b949e]">0 pts</div>
          </div>

          <div className="w-full sm:w-auto order-3 bg-[#161b22]/60 backdrop-blur-xl border border-[#cd7f32]/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6 text-center flex flex-col items-center min-h-[120px] sm:min-h-[140px]">
            <Star size={32} className="text-[#cd7f32]" />
            <div className="text-xl sm:text-2xl font-bold text-white my-2 sm:my-3">3</div>
            <div className="text-sm sm:text-base font-semibold text-white mb-1">--</div>
            <div className="text-xs sm:text-sm text-[#8b949e]">0 pts</div>
          </div>
        </div>

        <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">All Rankings</h3>
          <p className="text-xs sm:text-sm text-[#8b949e] text-center py-6 sm:py-8">
            No rankings available yet. Start participating to earn points!
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(CommunityLeaderboardPage)

