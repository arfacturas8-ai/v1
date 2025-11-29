import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Vote } from 'lucide-react'

const CreateProposalPage = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('7')

  return (
    <div
      role="main"
      aria-label="Create proposal page"
      className="min-h-screen bg-[#0d1117] p-4 md:p-6"
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Vote className="w-7 h-7 md:w-8 md:h-8 text-[#58a6ff]" aria-hidden="true" />
            <h1 className="text-xl md:text-2xl font-bold text-white m-0">
              Create Proposal
            </h1>
          </div>
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proposal title"
                className="w-full px-4 py-3 bg-[#21262d] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-[#c9d1d9] text-base outline-none focus:border-[#58a6ff]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your proposal"
                rows={6}
                className="w-full px-4 py-3 bg-[#21262d] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-[#c9d1d9] text-base outline-none resize-y focus:border-[#58a6ff]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                Voting Duration (days)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 bg-[#21262d] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-[#c9d1d9] text-base outline-none focus:border-[#58a6ff]/50 transition-colors"
              />
            </div>
            <button
              className="w-full px-6 py-3.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] border-0 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white text-base font-semibold cursor-pointer transition-opacity hover:opacity-90"
              aria-label="Submit proposal"
            >
              Submit Proposal
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(CreateProposalPage)

