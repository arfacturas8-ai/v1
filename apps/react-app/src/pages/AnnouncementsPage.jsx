import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Bell, Pin, Calendar, ChevronRight } from 'lucide-react'

const AnnouncementsPage = () => {
  const [announcements] = useState([
    { id: 1, title: 'Platform Update v2.0', content: 'We\'ve released a major platform update with new features and improvements.', date: '2024-01-15', pinned: true, type: 'update' },
    { id: 2, title: 'Scheduled Maintenance', content: 'There will be scheduled maintenance on January 20th from 2-4 AM UTC.', date: '2024-01-14', pinned: false, type: 'maintenance' },
    { id: 3, title: 'New Community Guidelines', content: 'We\'ve updated our community guidelines. Please review the changes.', date: '2024-01-12', pinned: false, type: 'policy' },
  ])

  return (
    <div
      role="main"
      aria-label="Announcements page"
      className="min-h-screen bg-[#0d1117] p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 md:p-8 mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-7 h-7 md:w-8 md:h-8 text-white" aria-hidden="true" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Announcements
            </h1>
          </div>
          <p className="text-white/90 text-sm md:text-base">
            Stay updated with the latest news and updates
          </p>
        </motion.div>

        {/* Announcements List */}
        <div className="flex flex-col gap-4 md:gap-5">
          {announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-6 cursor-pointer hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.pinned && (
                      <Pin className="w-4 h-4 text-[#58a6ff] flex-shrink-0" aria-hidden="true" />
                    )}
                    <h3 className="text-base md:text-lg font-semibold text-white break-words">
                      {announcement.title}
                    </h3>
                  </div>
                  <p className="text-[#8b949e] text-sm md:text-base mb-3 leading-relaxed">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-2 text-[#8b949e] text-xs md:text-sm">
                    <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" aria-hidden="true" />
                    <span>{announcement.date}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8b949e] flex-shrink-0" aria-hidden="true" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(AnnouncementsPage)

