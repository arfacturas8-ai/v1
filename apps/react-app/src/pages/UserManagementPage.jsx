import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Filter, MoreVertical } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const UserManagementPage = () => {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const users = [
    { id: 1, username: 'alice', email: 'alice@example.com', status: 'active', role: 'user' },
    { id: 2, username: 'bob', email: 'bob@example.com', status: 'active', role: 'moderator' }
  ]

  return (
    <div style={{background: "var(--bg-primary)"}} className="min-h-screen  p-4 sm:p-6" role="main" aria-label="User management page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={`font-bold flex items-center text-white mb-6 sm:mb-8 gap-3 sm:gap-4 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          <div className="w-10 h-10 rounded-2xl  flex items-center justify-center bg-gradient-to-br from-[#58a6ff] to-[#a371f7]">
            <Users style={{color: "var(--text-primary)"}} className="w-5 h-5 " aria-hidden="true" />
          </div>
          User Management
        </h1>
        <div style={{borderColor: "var(--border-subtle)"}} className="card rounded-2xl  overflow-hidden  backdrop-blur-sm border ">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#21262d]">
                  <th style={{color: "var(--text-secondary)"}} className="text-left  px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">User</th>
                  <th style={{color: "var(--text-secondary)"}} className="text-left  px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">Email</th>
                  <th style={{color: "var(--text-secondary)"}} className="text-left  px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{borderColor: "var(--border-subtle)"}} className="card border-t  hover:  transition-colors">
                    <td style={{color: "var(--text-primary)"}} className=" px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{u.username}</td>
                    <td style={{color: "var(--text-primary)"}} className=" px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{u.email}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
export default memo(UserManagementPage)

