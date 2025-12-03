import React, { memo } from 'react'
import { BookOpen, FileText, Search, Plus } from 'lucide-react'

const CommunityWikiPage = () => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#A0A0A0] py-6 px-4 sm:py-10 sm:px-5" role="main" aria-label="Community wiki page">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <BookOpen size={32} className="text-[#58a6ff]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
            Community Wiki
          </h1>
          <p className="text-sm sm:text-base text-[#666666]">Knowledge base and documentation for the community</p>
        </div>

        <div className="flex items-center gap-3 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-3 sm:p-4 mb-4 sm:mb-6">
          <Search size={20} className="text-[#666666] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search wiki articles..."
            className="flex-1 bg-transparent border-none outline-none text-white text-sm sm:text-base placeholder:text-[#666666]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6 cursor-pointer transition-colors hover:border-white/10">
            <div className="w-12 h-12 bg-[#58a6ff]/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center mb-3 sm:mb-4">
              <FileText size={24} className="text-[#58a6ff]" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Getting Started</h3>
            <p className="text-xs sm:text-sm text-[#666666]">Learn the basics of our community</p>
          </div>

          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6 cursor-pointer transition-colors hover:border-white/10">
            <div className="w-12 h-12 bg-[#58a6ff]/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center mb-3 sm:mb-4">
              <FileText size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Community Guidelines</h3>
            <p className="text-xs sm:text-sm text-[#666666]">Rules and best practices</p>
          </div>

          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6 cursor-pointer transition-colors hover:border-white/10 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-[#58a6ff]/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center mb-3 sm:mb-4">
              <FileText size={24} className="text-[#a371f7]" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2">FAQ</h3>
            <p className="text-xs sm:text-sm text-[#666666]">Frequently asked questions</p>
          </div>
        </div>

        <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-white m-0">Recent Articles</h3>
            <button className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] border-none rounded-lg text-white text-xs sm:text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">
              <Plus size={16} />
              New Article
            </button>
          </div>
          <p className="text-xs sm:text-sm text-[#666666] text-center py-6 sm:py-8">
            No wiki articles have been created yet.
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(CommunityWikiPage)

