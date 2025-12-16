/**
 * AuditLogPage.jsx
 * Admin audit log page with filterable log of all system actions
 */
import React, { useState, useEffect } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Search,
  Download,
  Filter,
  Calendar,
  User,
  Activity,
  Eye,
  Trash2,
  Edit,
  UserPlus,
  UserMinus,
  Settings,
  Lock,
  Unlock,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  FileText,
} from 'lucide-react'

export default function AuditLogPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('all')
  const [selectedUser, setSelectedUser] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const logsPerPage = 20

  const actionTypes = [
    { value: 'all', label: 'All Actions', icon: Activity },
    { value: 'user.created', label: 'User Created', icon: UserPlus },
    { value: 'user.deleted', label: 'User Deleted', icon: UserMinus },
    { value: 'user.banned', label: 'User Banned', icon: Lock },
    { value: 'user.unbanned', label: 'User Unbanned', icon: Unlock },
    { value: 'content.deleted', label: 'Content Deleted', icon: Trash2 },
    { value: 'content.edited', label: 'Content Edited', icon: Edit },
    { value: 'settings.changed', label: 'Settings Changed', icon: Settings },
    { value: 'login.success', label: 'Login Success', icon: CheckCircle },
    { value: 'login.failed', label: 'Login Failed', icon: XCircle },
  ]

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [searchTerm, selectedAction, selectedUser, dateRange, logs])

  const loadLogs = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/audit-logs', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || generateMockLogs())
      } else {
        // Use mock data for demo
        setLogs(generateMockLogs())
      }
    } catch (err) {
      console.error('Load logs error:', err)
      // Use mock data for demo
      setLogs(generateMockLogs())
    } finally {
      setLoading(false)
    }
  }

  const generateMockLogs = () => {
    const actions = actionTypes.filter(a => a.value !== 'all')
    const users = ['admin@cryb.com', 'mod1@cryb.com', 'mod2@cryb.com', 'system']
    const mockLogs = []

    for (let i = 0; i < 50; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)]
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)

      mockLogs.push({
        id: `log-${i}`,
        action: action.value,
        actionLabel: action.label,
        user: users[Math.floor(Math.random() * users.length)],
        target: `user-${Math.floor(Math.random() * 1000)}`,
        timestamp: timestamp.toISOString(),
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: {
          reason: 'Violation of community guidelines',
          changes: { status: 'banned' },
        },
        severity: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
      })
    }

    return mockLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const filterLogs = () => {
    let filtered = [...logs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actionLabel.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction)
    }

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.user === selectedUser)
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(dateRange.start))
    }
    if (dateRange.end) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(dateRange.end))
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }

  const handleExport = async () => {
    setExporting(true)

    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1500))

      const csvContent = [
        ['Timestamp', 'User', 'Action', 'Target', 'IP Address', 'Severity'].join(','),
        ...filteredLogs.map(log => [
          log.timestamp,
          log.user,
          log.actionLabel,
          log.target,
          log.ipAddress,
          log.severity,
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      setError('Failed to export logs')
    } finally {
      setExporting(false)
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <Info className="w-5 h-5 text-[#58a6ff]" />
    }
  }

  const getActionIcon = (action) => {
    const actionType = actionTypes.find(a => a.value === action)
    const Icon = actionType?.icon || Activity
    return <Icon className="w-4 h-4" />
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    }
  }

  const uniqueUsers = [...new Set(logs.map(log => log.user))]

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12  text-[#58a6ff] mx-auto mb-4" />
          <p style={{color: "var(--text-secondary)"}} className="">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} role="main" aria-label="Audit log">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-[#58a6ff]" />
            <h1 className="text-2xl sm:text-3xl font-bold">Audit Log</h1>
          </div>
          <p style={{color: "var(--text-secondary)"}} className="text-sm sm:text-base ">
            Comprehensive log of all system actions and administrative activities
          </p>
        </div>

        {/* Filters and Search */}
        <div style={{borderColor: "var(--border-subtle)"}} className="card   rounded-lg border  p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4">
            <div className="flex-1 relative">
              <Search style={{color: "var(--text-secondary)"}} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 " />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs by user, action, or target..."
                style={{borderColor: "var(--border-subtle)"}} className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base bg-[#21262d] border  rounded-lg focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{borderColor: "var(--border-subtle)"}} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 bg-[#21262d] border  rounded-lg hover:bg-[#30363d] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Filters</span>
                {showFilters ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
              </button>
              <button
                onClick={loadLogs}
                disabled={loading}
                style={{borderColor: "var(--border-subtle)"}} className="px-3 sm:px-4 py-2 sm:py-3 bg-[#21262d] border  rounded-lg hover:bg-[#30363d] transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? '' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || filteredLogs.length === 0}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base whitespace-nowrap"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Filter options */}
          {showFilters && (
            <div style={{borderColor: "var(--border-subtle)"}} className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t ">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Action Type</label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  style={{borderColor: "var(--border-subtle)"}} className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#21262d] border  rounded-lg focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none"
                >
                  {actionTypes.map(action => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{borderColor: "var(--border-subtle)"}} className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#21262d] border  rounded-lg focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none"
                >
                  <option value="all">All Users</option>
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    style={{borderColor: "var(--border-subtle)"}} className="flex-1 px-2 sm:px-3 py-2 text-sm sm:text-base bg-[#21262d] border  rounded-lg focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    style={{borderColor: "var(--border-subtle)"}} className="flex-1 px-2 sm:px-3 py-2 text-sm sm:text-base bg-[#21262d] border  rounded-lg focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p style={{color: "var(--text-secondary)"}} className="text-sm ">
            Showing {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} logs
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
          </div>
        )}

        {/* Logs table */}
        <div style={{borderColor: "var(--border-subtle)"}} className="card   rounded-lg border  overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead style={{borderColor: "var(--border-subtle)"}} className="bg-[#21262d] border-b ">
                <tr>
                  <th style={{color: "var(--text-secondary)"}} className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium ">Severity</th>
                  <th style={{color: "var(--text-secondary)"}} className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium ">Timestamp</th>
                  <th style={{color: "var(--text-secondary)"}} className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium ">User</th>
                  <th style={{color: "var(--text-secondary)"}} className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium ">Action</th>
                  <th style={{color: "var(--text-secondary)"}} className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium  hidden md:table-cell">Target</th>
                  <th style={{color: "var(--text-secondary)"}} className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium  hidden lg:table-cell">IP Address</th>
                  <th style={{color: "var(--text-secondary)"}} className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium ">Details</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.length > 0 ? (
                  currentLogs.map((log) => {
                    const timestamp = formatTimestamp(log.timestamp)
                    return (
                      <tr key={log.id} style={{borderColor: "var(--border-subtle)"}} className="border-b  hover:bg-[#21262d] transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {getSeverityIcon(log.severity)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm">
                            <div style={{color: "var(--text-primary)"}} className="">{timestamp.date}</div>
                            <div style={{color: "var(--text-secondary)"}} className=" text-xs">{timestamp.time}</div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2">
                            <User style={{color: "var(--text-secondary)"}} className="w-3 h-3 sm:w-4 sm:h-4  flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{log.user}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-xs sm:text-sm">{log.actionLabel}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          <span style={{color: "var(--text-secondary)"}} className="text-xs sm:text-sm font-mono ">{log.target}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                          <span style={{color: "var(--text-secondary)"}} className="text-xs sm:text-sm font-mono ">{log.ipAddress}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">View</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                      <FileText style={{color: "var(--text-secondary)"}} className="w-8 h-8 sm:w-12 sm:h-12  mx-auto mb-3" />
                      <p style={{color: "var(--text-secondary)"}} className="text-sm sm:text-base ">No logs found matching your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{borderColor: "var(--border-subtle)"}} className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#21262d] border  rounded-lg hover:bg-[#30363d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                        : 'bg-[#21262d] border border-white/10 hover:bg-[#30363d]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{borderColor: "var(--border-subtle)"}} className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#21262d] border  rounded-lg hover:bg-[#30363d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Detail modal */}
        {selectedLog && (
          <div style={{background: "var(--bg-primary)"}} className="fixed inset-0 /80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedLog(null)}>
            <div style={{borderColor: "var(--border-subtle)"}} className="card /95  rounded-lg border  p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  {getSeverityIcon(selectedLog.severity)}
                  <h2 className="text-lg sm:text-xl font-bold">{selectedLog.actionLabel}</h2>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  style={{color: "var(--text-secondary)"}} className=" hover: transition-colors"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label style={{color: "var(--text-secondary)"}} className="block text-xs sm:text-sm  mb-1">User</label>
                    <p className="text-sm sm:text-base font-medium break-all">{selectedLog.user}</p>
                  </div>
                  <div>
                    <label style={{color: "var(--text-secondary)"}} className="block text-xs sm:text-sm  mb-1">Target</label>
                    <p className="text-xs sm:text-sm font-mono break-all">{selectedLog.target}</p>
                  </div>
                  <div>
                    <label style={{color: "var(--text-secondary)"}} className="block text-xs sm:text-sm  mb-1">Timestamp</label>
                    <p className="text-xs sm:text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <label style={{color: "var(--text-secondary)"}} className="block text-xs sm:text-sm  mb-1">IP Address</label>
                    <p className="text-xs sm:text-sm font-mono">{selectedLog.ipAddress}</p>
                  </div>
                </div>

                <div>
                  <label style={{color: "var(--text-secondary)"}} className="block text-xs sm:text-sm  mb-1">User Agent</label>
                  <p className="text-xs sm:text-sm break-all">{selectedLog.userAgent}</p>
                </div>

                <div>
                  <label style={{color: "var(--text-secondary)"}} className="block text-xs sm:text-sm  mb-1">Details</label>
                  <pre style={{borderColor: "var(--border-subtle)"}} className="bg-[#21262d] border  rounded-lg p-3 sm:p-4 text-xs sm:text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

