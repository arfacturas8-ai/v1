import React, { useState, useEffect, useCallback } from 'react';

const ModerationQueue = ({ socket, filters, onFiltersChange, onItemAction, onUserSelect }) => {
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  const fetchQueueItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/moderation/queue?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setQueueItems(data.data.items);
        setPagination(prev => ({
          ...prev,
          total: data.data.total,
          totalPages: data.data.totalPages,
        }));
      } else {
        console.error('Failed to fetch queue items');
      }
    } catch (error) {
      console.error('Error fetching queue items:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchQueueItems();
  }, [fetchQueueItems]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdate = () => {
      fetchQueueItems();
    };

    socket.on('queue_item_assigned', handleQueueUpdate);
    socket.on('moderation_event', handleQueueUpdate);

    return () => {
      socket.off('queue_item_assigned', handleQueueUpdate);
      socket.off('moderation_event', handleQueueUpdate);
    };
  }, [socket, fetchQueueItems]);

  const handleItemSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === queueItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(queueItems.map(item => item.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.size === 0) return;

    const notes = prompt('Add notes for this bulk action (optional):');
    
    for (const itemId of selectedItems) {
      try {
        await onItemAction(itemId, bulkAction, notes);
      } catch (error) {
        console.error(`Failed to apply action to item ${itemId}:`, error);
      }
    }

    setSelectedItems(new Set());
    setBulkAction('');
    fetchQueueItems();
  };

  const handleAssignToSelf = async (itemId) => {
    if (!socket) return;

    socket.emit('assign_queue_item', { queue_id: itemId });
  };

  const handleAnalyzeContent = async (content) => {
    if (!socket) return;

    socket.emit('analyze_content_realtime', {
      content: content,
      content_type: 'post', // or determine from item
    });

    socket.once('analysis_result', (result) => {
      alert(`AI Analysis Results:\n
        Toxicity: ${(result.analysis.toxicity_score * 100).toFixed(1)}%\n
        Flagged Categories: ${result.analysis.flagged_categories.join(', ')}\n
        Recommended Action: ${result.analysis.recommended_action}`);
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 4: return '#e53e3e';
      case 3: return '#f56500';
      case 2: return '#d69e2e';
      case 1: return '#38a169';
      default: return '#a0aec0';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 4: return 'Critical';
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'Unknown';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white backdrop-blur-[10px] rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-[var(--border-subtle)]">
        <div className="flex justify-center items-center p-12 text-[var(--text-secondary)]">
          <div className="inline-block w-5 h-5 border-2 border-[var(--border-subtle)] rounded-full border-t-[#58a6ff] "></div>
          <span>Loading moderation queue...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white backdrop-blur-[10px] rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-[var(--border-subtle)]">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border-subtle)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] m-0">Moderation Queue</h2>
        <div>
          <button
            className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:opacity-90 hover:-translate-y-px disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
            onClick={fetchQueueItems}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-center mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Status</label>
          <select
            className="px-2 py-2 border border-[var(--border-subtle)] rounded-md text-sm bg-white text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[#58a6ff] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Priority</label>
          <select
            className="px-2 py-2 border border-[var(--border-subtle)] rounded-md text-sm bg-white text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[#58a6ff] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
            value={filters.priority}
            onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
          >
            <option value="">All Priorities</option>
            <option value="4">Critical</option>
            <option value="3">High</option>
            <option value="2">Medium</option>
            <option value="1">Low</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Content Type</label>
          <select
            className="px-2 py-2 border border-[var(--border-subtle)] rounded-md text-sm bg-white text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[#58a6ff] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
            value={filters.content_type}
            onChange={(e) => onFiltersChange({ ...filters, content_type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="message">Messages</option>
          </select>
        </div>
      </div>

      {selectedItems.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-[#667eea]/5 border border-[#667eea]/20 rounded-lg mb-4">
          <span className="font-semibold text-[#58a6ff]">{selectedItems.size} items selected</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-2 py-2 border border-[var(--border-subtle)] rounded-md text-sm bg-white text-[var(--text-primary)]"
          >
            <option value="">Choose bulk action...</option>
            <option value="approved">Approve All</option>
            <option value="rejected">Reject All</option>
            <option value="escalated">Escalate All</option>
          </select>
          <button
            className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:opacity-90 hover:-translate-y-px disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
            onClick={handleBulkAction}
            disabled={!bulkAction}
          >
            Apply Bulk Action
          </button>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-t-lg border-b border-[var(--border-subtle)] font-semibold text-[var(--text-secondary)]">
          <label className="relative block cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedItems.size === queueItems.length && queueItems.length > 0}
              onChange={handleSelectAll}
              className="absolute opacity-0 cursor-pointer h-0 w-0 peer"
            />
            <span className="relative block h-[18px] w-[18px] bg-white border-2 border-[var(--border-subtle)] rounded-sm transition-all peer-hover:border-[#58a6ff] peer-checked:bg-[#58a6ff] peer-checked:border-[#58a6ff] after:content-[''] after:absolute after:hidden after:left-[5px] after:top-[2px] after:w-1 after:h-2 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 peer-checked:after:block"></span>
          </label>
          <span>Select All</span>
        </div>

        {queueItems.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-[var(--text-secondary)]">
            <span>🎉 No items in the moderation queue!</span>
            <p>All caught up with content moderation.</p>
          </div>
        ) : (
          queueItems.map(item => (
            <div
              key={item.id}
              className={`border border-[var(--border-subtle)] border-t-0 bg-white transition-all hover:bg-[var(--bg-secondary)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] last:rounded-b-lg ${selectedItems.has(item.id) ? 'bg-[#667eea]/5 border-[#58a6ff]' : ''}`}
            >
              <div className="flex items-center gap-4 p-4">
                <label className="relative block cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleItemSelect(item.id)}
                    className="absolute opacity-0 cursor-pointer h-0 w-0 peer"
                  />
                  <span className="relative block h-[18px] w-[18px] bg-white border-2 border-[var(--border-subtle)] rounded-sm transition-all peer-hover:border-[#58a6ff] peer-checked:bg-[#58a6ff] peer-checked:border-[#58a6ff] after:content-[''] after:absolute after:hidden after:left-[5px] after:top-[2px] after:w-1 after:h-2 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 peer-checked:after:block"></span>
                </label>

                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: getPriorityColor(item.priority) }}
                  title={`Priority: ${getPriorityLabel(item.priority)}`}
                >
                  {item.priority}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded uppercase tracking-wide">{item.content_type.toUpperCase()}</span>
                    <span className="font-mono text-sm text-[var(--text-secondary)]">#{item.content_id.slice(-8)}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-xl uppercase tracking-wide ${
                      item.status === 'pending' ? 'bg-gray-300/20 text-[var(--text-secondary)]' :
                      item.status === 'reviewing' ? 'bg-blue-500/10 text-[#58a6ff]' :
                      item.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                      item.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                      item.status === 'escalated' ? 'bg-orange-500/10 text-orange-500' : ''
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span>By: {item.username || 'Unknown User'}</span>
                    <span>•</span>
                    <span>{formatTime(item.created_at)}</span>
                    {item.toxicity_score && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-red-600">
                          Toxicity: {(item.toxicity_score * 100).toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:opacity-90 hover:-translate-y-px disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  >
                    {expandedItem === item.id ? '🔼' : '🔽'} Details
                  </button>
                  <button
                    className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:opacity-90 hover:-translate-y-px disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={() => handleAssignToSelf(item.id)}
                    disabled={item.assigned_moderator}
                  >
                    {item.assigned_moderator ? '✅ Assigned' : '👋 Take'}
                  </button>
                </div>
              </div>

              {expandedItem === item.id && (
                <div className="px-4 pb-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <div className="mb-4">
                    <h4 className="m-0 mb-2 text-sm font-semibold text-[var(--text-primary)]">Content Preview:</h4>
                    <div className="p-3 bg-white border border-[var(--border-subtle)] rounded-md text-sm leading-relaxed text-[var(--text-primary)] max-h-[200px] overflow-y-auto">
                      {item.content_preview || 'No preview available'}
                    </div>
                  </div>

                  {item.flagged_categories && item.flagged_categories.length > 0 && (
                    <div className="mb-4">
                      <h4 className="m-0 mb-2 text-sm font-semibold text-[var(--text-primary)]">Flagged Categories:</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.flagged_categories.map(category => (
                          <span key={category} className="inline-block px-2 py-1 bg-red-500/10 text-red-600 rounded text-xs font-semibold uppercase tracking-wide">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.triggered_rules && item.triggered_rules.length > 0 && (
                    <div className="mb-4">
                      <h4 className="m-0 mb-2 text-sm font-semibold text-[var(--text-primary)]">Triggered Rules:</h4>
                      <ul className="m-0 p-0 list-none">
                        {item.triggered_rules.map(ruleId => (
                          <li key={ruleId} className="py-1 text-sm text-[var(--text-secondary)]">Rule ID: {ruleId}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <button
                      className="bg-[#38a169] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:bg-[#2f855a] hover:-translate-y-px disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={() => {
                        const notes = prompt('Add approval notes (optional):');
                        onItemAction(item.id, 'approved', notes);
                      }}
                    >
                      ✅ Approve
                    </button>

                    <button
                      className="bg-[#e53e3e] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:bg-[#c53030] hover:-translate-y-px disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={() => {
                        const notes = prompt('Add rejection reason:');
                        if (notes) onItemAction(item.id, 'rejected', notes);
                      }}
                    >
                      ❌ Reject
                    </button>

                    <button
                      className="bg-[#f56500] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:bg-[#dd6b20] hover:-translate-y-px disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={() => {
                        const notes = prompt('Add escalation reason:');
                        if (notes) onItemAction(item.id, 'escalated', notes);
                      }}
                    >
                      ⬆️ Escalate
                    </button>

                    <button
                      className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:opacity-90 hover:-translate-y-px disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={() => handleAnalyzeContent(item.content_preview)}
                    >
                      🔍 Re-analyze
                    </button>

                    <button
                      className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all inline-flex items-center gap-2 hover:opacity-90 hover:-translate-y-px disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={() => onUserSelect(item.user_id)}
                    >
                      👤 View User History
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-8 p-4 bg-[var(--bg-secondary)] rounded-lg">
          <button
            className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none px-4 py-2 rounded-md text-sm cursor-pointer transition-all hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
          >
            ‹ Previous
          </button>

          <span className="text-sm text-[var(--text-secondary)]">
            Page {pagination.page} of {pagination.totalPages}
            ({pagination.total} total items)
          </span>

          <button
            className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none px-4 py-2 rounded-md text-sm cursor-pointer transition-all hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
};

export default ModerationQueue;