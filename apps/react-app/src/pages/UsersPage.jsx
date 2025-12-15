import React, { useState, useEffect } from 'react'
import { Users, Search, Filter, UserPlus, Mail, Shield, Ban, Trash2, Edit, Eye, Download, ChevronLeft, ChevronRight, MoreVertical, UserCheck, UserX, Clock } from 'lucide-react'
import userService from '../services/userService'
import apiService from '../services/api'
import { useResponsive } from '../hooks/useResponsive'

function UsersPage() {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const compactSpacing = {
    formGap: isMobile ? 16 : isTablet ? 14 : 12,
    headerMargin: isMobile ? 20 : isTablet ? 18 : 16,
    logoMargin: isMobile ? 12 : isTablet ? 10 : 8,
    labelMargin: isMobile ? 8 : 6,
    inputPadding: isMobile ? 12 : 10,
    dividerMargin: isMobile ? 20 : isTablet ? 18 : 14,
    cardPadding: isMobile ? 20 : isTablet ? 24 : 20,
    sectionGap: isMobile ? 16 : isTablet ? 14 : 12
  }
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
    banned: 0
  })
  const [message, setMessage] = useState('')

  const usersPerPage = 10

  useEffect(() => {
    loadUsers()
  }, [currentPage, filterRole, filterStatus])

  useEffect(() => {
    updateStats()
  }, [users])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: usersPerPage,
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchQuery && { q: searchQuery })
      }

      const response = await apiService.get('/users', { params })

      if (response.success && response.data) {
        setUsers(response.data.users || response.data || [])
        setTotalPages(response.data.totalPages || 1)
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const updateStats = () => {
    const totalUsers = users.length
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const activeToday = users.filter(u => {
      const lastActive = new Date(u.lastActive || u.updatedAt)
      return lastActive >= today
    }).length

    const newThisWeek = users.filter(u => {
      const created = new Date(u.createdAt)
      return created >= weekAgo
    }).length

    const banned = users.filter(u => u.status === 'banned').length

    setStats({ totalUsers, activeToday, newThisWeek, banned })
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadUsers()
  }

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleEditRole = async (userId, newRole) => {
    try {
      const response = await apiService.put(`/users/${userId}/role`, { role: newRole })
      if (response.success) {
        showMessage('Role updated successfully', 'success')
        loadUsers()
      }
    } catch (error) {
      showMessage('Failed to update role', 'error')
    }
  }

  const handleBanUser = async (userId, currentStatus) => {
    const action = currentStatus === 'banned' ? 'unban' : 'ban'
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return
    }

    try {
      const response = await apiService.post(`/users/${userId}/${action}`)
      if (response.success) {
        showMessage(`User ${action}ned successfully`, 'success')
        loadUsers()
      }
    } catch (error) {
      showMessage(`Failed to ${action} user`, 'error')
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await apiService.delete(`/users/${userId}`)
      if (response.success) {
        showMessage('User deleted successfully', 'success')
        loadUsers()
      }
    } catch (error) {
      showMessage('Failed to delete user', 'error')
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      showMessage('No users selected', 'error')
      return
    }

    if (!window.confirm(`Perform ${action} on ${selectedUsers.length} selected users?`)) {
      return
    }

    try {
      const response = await apiService.post('/users/bulk', {
        action,
        userIds: selectedUsers
      })
      if (response.success) {
        showMessage(`Bulk ${action} completed`, 'success')
        setSelectedUsers([])
        loadUsers()
      }
    } catch (error) {
      showMessage(`Bulk ${action} failed`, 'error')
    }
  }

  const handleExportUsers = async () => {
    try {
      const response = await apiService.get('/users/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users-${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showMessage('Users exported successfully', 'success')
    } catch (error) {
      showMessage('Failed to export users', 'error')
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      admin: 'bg-red-500/20 text-red-300',
      moderator: 'bg-orange-500/20 text-orange-300',
      user: 'bg-slate-500/20 text-slate-300',
      premium: 'bg-purple-500/20 text-purple-300'
    }
    return roleMap[role] || 'bg-slate-500/20 text-slate-300'
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      active: 'bg-emerald-500/20 text-emerald-300',
      inactive: 'bg-slate-500/20 text-slate-300',
      banned: 'bg-red-500/20 text-red-300',
      suspended: 'bg-orange-500/20 text-orange-300'
    }
    return statusMap[status] || 'bg-slate-500/20 text-slate-300'
  }

  return (
    <div className="min-h-screen bg-rgb(var(--color-neutral-50)) text-primary p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-rgb(var(--color-neutral-200))">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
            User Management
          </h1>
          <p className="text-sm text-secondary">Manage and monitor platform users</p>
        </div>
        <button
          style={{color: "var(--text-primary)"}} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          onClick={handleExportUsers}
        >
          <Download size={20} />
          {!isMobile && 'Export Users'}
        </button>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`fixed top-6 right-6 px-6 py-4 rounded-2xl  font-semibold z-50 animate-slide-in ${
          message.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
            : 'bg-red-500/20 border border-red-500/50 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:-translate-y-1 hover:border-purple-500/50 transition-all">
          <div className="w-12 h-12 rounded-2xl shadow-sm bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <div className="text-sm text-secondary">Total Users</div>
          </div>
        </div>
        <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:-translate-y-1 hover:border-purple-500/50 transition-all">
          <div className="w-12 h-12 rounded-2xl shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
            <div className="text-sm text-secondary">Active Today</div>
          </div>
        </div>
        <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:-translate-y-1 hover:border-purple-500/50 transition-all">
          <div className="w-12 h-12 rounded-2xl shadow-sm bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
            <UserPlus size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.newThisWeek}</div>
            <div className="text-sm text-secondary">New This Week</div>
          </div>
        </div>
        <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:-translate-y-1 hover:border-purple-500/50 transition-all">
          <div className="w-12 h-12 rounded-2xl shadow-sm bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Ban size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.banned}</div>
            <div className="text-sm text-secondary">Banned</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-rgb(var(--color-neutral-400))" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-4 py-3 bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm text-primary placeholder:text-rgb(var(--color-neutral-400)) focus:outline-none focus:border-[#a371f7] transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-3 bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm text-primary text-sm cursor-pointer focus:outline-none focus:border-[#a371f7] transition-colors"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="premium">Premium</option>
            <option value="user">User</option>
          </select>
          <select
            className="px-4 py-3 bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm text-primary text-sm cursor-pointer focus:outline-none focus:border-[#a371f7] transition-colors"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="font-semibold text-[#a371f7]">{selectedUsers.length} users selected</span>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-white border border-rgb(var(--color-neutral-200)) rounded-lg text-primary text-sm font-semibold flex items-center gap-2 hover:bg-rgb(var(--color-neutral-50)) transition-colors" onClick={() => handleBulkAction('ban')}>
              <Ban size={16} />
              Ban Selected
            </button>
            <button className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-600 text-sm font-semibold flex items-center gap-2 hover:bg-red-500/30 transition-colors" onClick={() => handleBulkAction('delete')}>
              <Trash2 size={16} />
              Delete Selected
            </button>
            <button className="px-4 py-2 bg-white border border-rgb(var(--color-neutral-200)) rounded-lg text-primary text-sm font-semibold hover:bg-rgb(var(--color-neutral-50)) transition-colors" onClick={() => setSelectedUsers([])}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-20 text-secondary">
          <div className="w-12 h-12 border-4 border-rgb(var(--color-neutral-200)) border-t-[#a371f7] rounded-full  mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-secondary">
          <Users size={48} className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-primary mb-2">No Users Found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-rgb(var(--color-neutral-50))">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="accent-[#a371f7]"
                      />
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary uppercase tracking-wide">User</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary uppercase tracking-wide hidden md:table-cell">Email</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary uppercase tracking-wide">Role</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary uppercase tracking-wide hidden lg:table-cell">Join Date</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary uppercase tracking-wide hidden xl:table-cell">Last Active</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary uppercase tracking-wide">Status</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-rgb(var(--color-neutral-200)) hover:bg-rgb(var(--color-neutral-50)) transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="accent-[#a371f7]"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div style={{color: "var(--text-primary)"}} className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  font-bold">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              user.username?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{user.username}</div>
                            <div className="text-xs text-rgb(var(--color-neutral-400))">#{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell text-secondary">{user.email}</td>
                      <td className="px-4 py-4">
                        <select
                          className={`px-3 py-1 rounded-md text-xs font-semibold border-0 ${getRoleBadgeClass(user.role)}`}
                          value={user.role || 'user'}
                          onChange={(e) => handleEditRole(user.id, e.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="premium">Premium</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell text-secondary text-sm">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <div className="flex items-center gap-2 text-secondary text-sm">
                          <Clock size={14} />
                          {formatDate(user.lastActive || user.updatedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-md text-xs font-semibold ${getStatusBadgeClass(user.status || 'active')}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 bg-white border border-rgb(var(--color-neutral-200)) rounded-lg hover:bg-rgb(var(--color-neutral-50)) hover:-translate-y-0.5 transition-all"
                            onClick={() => handleViewUser(user)}
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className={`p-2 bg-white border border-rgb(var(--color-neutral-200)) rounded-lg hover:bg-rgb(var(--color-neutral-50)) hover:-translate-y-0.5 transition-all ${user.status === 'banned' ? 'text-emerald-500' : 'text-red-600'}`}
                            onClick={() => handleBanUser(user.id, user.status)}
                            title={user.status === 'banned' ? 'Unban' : 'Ban'}
                          >
                            <Ban size={16} />
                          </button>
                          <button
                            className="p-2 bg-white border border-rgb(var(--color-neutral-200)) rounded-lg text-red-600 hover:bg-rgb(var(--color-neutral-50)) hover:-translate-y-0.5 transition-all"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-6">
            <button
              className="px-5 py-2.5 bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm text-primary flex items-center gap-2 hover:bg-purple-500/20 hover:border-[#a371f7] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            <div className="text-secondary">
              Page {currentPage} of {totalPages}
            </div>
            <button
              className="px-5 py-2.5 bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-sm text-primary flex items-center gap-2 hover:bg-purple-500/20 hover:border-[#a371f7] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div style={{background: "var(--bg-primary)"}} className="fixed inset-0 /50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white border border-rgb(var(--color-neutral-200)) rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-rgb(var(--color-neutral-200)) flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">User Profile</h2>
              <button className="text-3xl leading-none hover:bg-rgb(var(--color-neutral-50)) rounded-lg w-8 h-8 flex items-center justify-center transition-colors" onClick={() => setShowUserModal(false)}>
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-6 mb-8 pb-6 border-b border-rgb(var(--color-neutral-200))">
                <div style={{color: "var(--text-primary)"}} className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  text-3xl font-bold flex-shrink-0">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{selectedUser.username}</h3>
                  <p className="text-secondary mb-3">{selectedUser.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-md text-xs font-semibold ${getRoleBadgeClass(selectedUser.role)}`}>
                      {selectedUser.role || 'user'}
                    </span>
                    <span className={`px-3 py-1 rounded-md text-xs font-semibold ${getStatusBadgeClass(selectedUser.status || 'active')}`}>
                      {selectedUser.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-rgb(var(--color-neutral-50)) rounded-lg">
                  <span className="text-secondary font-semibold">User ID:</span>
                  <span className="text-primary">#{selectedUser.id}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rgb(var(--color-neutral-50)) rounded-lg">
                  <span className="text-secondary font-semibold">Joined:</span>
                  <span className="text-primary">{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rgb(var(--color-neutral-50)) rounded-lg">
                  <span className="text-secondary font-semibold">Last Active:</span>
                  <span className="text-primary">{formatDate(selectedUser.lastActive || selectedUser.updatedAt)}</span>
                </div>
                {selectedUser.bio && (
                  <div className="flex justify-between items-center p-3 bg-rgb(var(--color-neutral-50)) rounded-lg">
                    <span className="text-secondary font-semibold">Bio:</span>
                    <span className="text-primary">{selectedUser.bio}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-rgb(var(--color-neutral-200)) flex justify-end gap-3">
              <button className="px-4 py-2 bg-white border border-rgb(var(--color-neutral-200)) rounded-lg text-primary font-semibold hover:bg-rgb(var(--color-neutral-50)) transition-colors" onClick={() => setShowUserModal(false)}>
                Close
              </button>
              <button
                className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-600 font-semibold flex items-center gap-2 hover:bg-red-500/30 transition-colors"
                onClick={() => {
                  handleDeleteUser(selectedUser.id, selectedUser.username)
                  setShowUserModal(false)
                }}
              >
                <Trash2 size={16} />
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
