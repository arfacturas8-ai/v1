import React, { useState, useEffect, useRef } from 'react';
import { Plus, TrendingUp, Users, Eye } from 'lucide-react';
import ReactionPicker, { DEFAULT_REACTIONS } from './ReactionPicker';
// Single reaction display component
function ReactionDisplay({ 
  reaction, 
  count, 
  users = [], 
  isUserReacted = false, 
  onToggle, 
  onViewUsers,
  showCount = true,
  size = 'medium',
  interactive = true 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!interactive) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    if (onToggle) {
      onToggle(reaction, !isUserReacted);
    }
  };

  const handleUserListToggle = (e) => {
    e.stopPropagation();
    setShowUserList(!showUserList);
    if (onViewUsers) {
      onViewUsers(reaction, users);
    }
  };

  const formatCount = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getReactionData = () => {
    if (typeof reaction === 'string') {
      return DEFAULT_REACTIONS.find(r => r.type === reaction) || {
        type: reaction,
        emoji: reaction,
        label: reaction,
        color: '#888'
      };
    }
    return reaction;
  };

  const reactionData = getReactionData();

  return (
    <div className="reaction-display-container">
      <button
        className={`reaction-display ${size} ${isUserReacted ? 'user-reacted' : ''} ${isAnimating ? 'animating' : ''} ${!interactive ? 'non-interactive' : ''}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={!interactive}
        style={{
          '--reaction-color': reactionData.color,
          '--hover-scale': isHovered && interactive ? '1.05' : '1'
        }}
        title={`${reactionData.label} (${count})`}
        aria-label={`${reactionData.label} reaction, ${count} users`}
        aria-pressed={isUserReacted}
      >
        <span className="reaction-emoji">{reactionData.emoji}</span>
        {showCount && count > 0 && (
          <span className="reaction-count">{formatCount(count)}</span>
        )}
        
        {/* Animated background for user reactions */}
        {isUserReacted && <div className="user-reaction-bg" />}
        
        {/* Pulse animation for new reactions */}
        {isAnimating && <div className="reaction-pulse" />}
      </button>

      {/* User list tooltip on hover */}
      {isHovered && users.length > 0 && (
        <div className="reaction-users-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-emoji">{reactionData.emoji}</span>
            <span className="tooltip-title">{reactionData.label}</span>
            <span className="tooltip-count">({count})</span>
          </div>
          
          <div className="users-preview">
            {users.slice(0, 5).map((user, index) => (
              <div key={user.id || index} className="user-preview">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} style={{ width: "64px", height: "64px", flexShrink: 0 }} />
                ) : (
                  <div className="user-avatar-placeholder">
                    {(user.username || user.display_name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="user-name">
                  {user.display_name || user.username}
                </span>
              </div>
            ))}
            
            {users.length > 5 && (
              <button 
                className="view-all-users"
                onClick={handleUserListToggle}
              >
                +{users.length - 5} more
              </button>
            )}
          </div>
          
          {users.length <= 5 && users.length > 1 && (
            <button 
              className="view-all-users"
              onClick={handleUserListToggle}
            >
              View all reactions
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Main reaction bar component
function ReactionBar({
  contentType,
  contentId,
  reactions = {},
  userReactions = [],
  totalReactions = 0,
  reactionUsers = {},
  onReactionToggle,
  onViewReactionUsers,
  showPicker = true,
  showTrending = false,
  showAnalytics = false,
  compact = false,
  maxVisible = 6,
  className = ''
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [reactionCounts, setReactionCounts] = useState(reactions);
  const [userReactionList, setUserReactionList] = useState(userReactions);
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const barRef = useRef(null);

  // Update local state when props change
  useEffect(() => {
    setReactionCounts(reactions);
    setUserReactionList(userReactions);
  }, [reactions, userReactions]);

  // Handle real-time reaction updates via Socket.io
  useEffect(() => {
    if (!window.socket) return;

    const handleReactionUpdate = (data) => {
      if (data.contentType === contentType && data.contentId === contentId) {
        if (data.type === 'REACTION_ADDED') {
          setReactionCounts(prev => ({
            ...prev,
            [data.reactionType]: (prev[data.reactionType] || 0) + 1
          }));
          
          // Add to user reactions if it's the current user
          if (data.userId === window.currentUserId) {
            setUserReactionList(prev => [...prev.filter(r => r !== data.reactionType), data.reactionType]);
          }
        } else if (data.type === 'REACTION_REMOVED') {
          setReactionCounts(prev => ({
            ...prev,
            [data.reactionType]: Math.max((prev[data.reactionType] || 0) - 1, 0)
          }));
          
          // Remove from user reactions if it's the current user
          if (data.userId === window.currentUserId) {
            setUserReactionList(prev => prev.filter(r => r !== data.reactionType));
          }
        }
      }
    };

    window.socket.on('reaction_update', handleReactionUpdate);
    
    // Join room for this content
    window.socket.emit('join_room', `${contentType}:${contentId}`);

    return () => {
      window.socket.off('reaction_update', handleReactionUpdate);
      window.socket.emit('leave_room', `${contentType}:${contentId}`);
    };
  }, [contentType, contentId]);

  const handleReactionSelect = async (reactionData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const isCurrentlyReacted = userReactionList.includes(reactionData.type);
      
      // Optimistic update
      if (isCurrentlyReacted) {
        setReactionCounts(prev => ({
          ...prev,
          [reactionData.type]: Math.max((prev[reactionData.type] || 0) - 1, 0)
        }));
        setUserReactionList(prev => prev.filter(r => r !== reactionData.type));
      } else {
        setReactionCounts(prev => ({
          ...prev,
          [reactionData.type]: (prev[reactionData.type] || 0) + 1
        }));
        setUserReactionList(prev => [...prev.filter(r => r !== reactionData.type), reactionData.type]);
      }

      // Call parent handler
      if (onReactionToggle) {
        await onReactionToggle(reactionData, !isCurrentlyReacted);
      }
      
    } catch (error) {
      console.error('Error toggling reaction:', error);
      
      // Revert optimistic update on error
      setReactionCounts(reactions);
      setUserReactionList(userReactions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUsers = (reactionType, users) => {
    if (onViewReactionUsers) {
      onViewReactionUsers(reactionType, users);
    }
  };

  const getTopReactions = () => {
    const reactionEntries = Object.entries(reactionCounts)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxVisible);
    
    return reactionEntries;
  };

  const getHiddenReactionsCount = () => {
    const total = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
    const visible = getTopReactions().reduce((sum, [_, count]) => sum + count, 0);
    return total - visible;
  };

  const topReactions = getTopReactions();
  const hiddenCount = getHiddenReactionsCount();

  return (
    <div 
      className={`reaction-bar ${compact ? 'compact' : ''} ${className}`} 
      ref={barRef}
      role="group"
      aria-label="Content reactions"
    >
      {/* Main reaction displays */}
      <div className="reaction-list">
        {topReactions.map(([reactionType, count]) => (
          <ReactionDisplay
            key={reactionType}
            reaction={reactionType}
            count={count}
            users={reactionUsers[reactionType] || []}
            isUserReacted={userReactionList.includes(reactionType)}
            onToggle={handleReactionSelect}
            onViewUsers={handleViewUsers}
            size={compact ? 'small' : 'medium'}
            showCount={!compact || count > 1}
          />
        ))}

        {/* Show hidden reactions count */}
        {hiddenCount > 0 && (
          <button 
            className="hidden-reactions-indicator"
            onClick={() => setIsPickerOpen(true)}
            title={`${hiddenCount} more reaction${hiddenCount !== 1 ? 's' : ''}`}
          >
            <Plus size={14} />
            <span>{hiddenCount}</span>
          </button>
        )}

        {/* Add reaction button */}
        {showPicker && (
          <button
            className="add-reaction-btn"
            onClick={() => setIsPickerOpen(true)}
            title="Add reaction"
            aria-label="Add reaction"
            disabled={isLoading}
          >
            <Plus size={compact ? 14 : 16} />
          </button>
        )}
      </div>

      {/* Analytics and metadata */}
      {!compact && (showTrending || showAnalytics || totalReactions > 0) && (
        <div className="reaction-metadata">
          {totalReactions > 0 && (
            <div className="total-reactions">
              <Users size={14} />
              <span>{totalReactions} reaction{totalReactions !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {showTrending && analytics?.trending && (
            <div className="trending-indicator">
              <TrendingUp size={14} />
              <span>Trending</span>
            </div>
          )}
          
          {showAnalytics && analytics?.views && (
            <div className="view-count">
              <Eye size={14} />
              <span>{analytics.views} views</span>
            </div>
          )}
        </div>
      )}

      {/* Reaction picker overlay */}
      {isPickerOpen && (
        <ReactionPicker
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onReactionSelect={handleReactionSelect}
          userReactions={userReactionList}
          position="bottom"
          className="reaction-bar-picker"
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="reaction-loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
}

// Reaction summary component for showing aggregated stats
function ReactionSummary({ 
  reactions, 
  totalUsers, 
  trending = false, 
  compact = false,
  onViewDetails 
}) {
  const topReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  if (totalReactions === 0) return null;

  return (
    <div className={`reaction-summary ${compact ? 'compact' : ''} ${trending ? 'trending' : ''}`}>
      <div className="summary-reactions">
        {topReactions.map(([reactionType, count]) => {
          const reactionData = DEFAULT_REACTIONS.find(r => r.type === reactionType) || {
            emoji: reactionType,
            color: '#888'
          };
          
          return (
            <div key={reactionType} className="summary-reaction">
              <span className="summary-emoji">{reactionData.emoji}</span>
              <span className="summary-count">{count}</span>
            </div>
          );
        })}
      </div>
      
      <div className="summary-stats">
        <span className="total-count">{totalReactions}</span>
        {totalUsers && totalUsers !== totalReactions && (
          <span className="unique-users">by {totalUsers} user{totalUsers !== 1 ? 's' : ''}</span>
        )}
        
        {trending && (
          <div className="trending-badge">
            <TrendingUp size={12} />
            <span>Trending</span>
          </div>
        )}
      </div>
      
      {onViewDetails && (
        <button className="view-details-btn" onClick={onViewDetails}>
          View Details
        </button>
      )}
    </div>
  );
}

// Quick reaction buttons for common actions
function QuickReactions({ 
  onReactionSelect, 
  userReactions = [], 
  className = '',
  reactions = ['like', 'love', 'laugh', 'fire'] 
}) {
  return (
    <div className={`quick-reactions ${className}`}>
      {reactions.map(reactionType => {
        const reactionData = DEFAULT_REACTIONS.find(r => r.type === reactionType);
        if (!reactionData) return null;
        
        const isSelected = userReactions.includes(reactionType);
        
        return (
          <button
            key={reactionType}
            className={`quick-reaction ${isSelected ? 'selected' : ''}`}
            onClick={() => onReactionSelect(reactionData)}
            title={reactionData.label}
            style={{ '--reaction-color': reactionData.color }}
          >
            {reactionData.emoji}
          </button>
        );
      })}
    </div>
  );
}
export default ReactionBar;
export { ReactionDisplay, ReactionSummary, QuickReactions };
