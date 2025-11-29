import React, { useState, useEffect, useRef } from 'react';
import { Plus, TrendingUp, Users, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { DEFAULT_REACTIONS } from './ReactionPicker';
// Mobile-optimized reaction display
function MobileReactionDisplay({ 
  reaction, 
  count, 
  users = [], 
  isUserReacted = false, 
  onToggle, 
  onLongPress,
  size = 'medium',
  interactive = true 
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const pressTimer = useRef(null);

  const handleTouchStart = (e) => {
    if (!interactive) return;
    
    setIsPressed(true);
    setTouchStart(Date.now());
    setLongPressTriggered(false);
    
    // Start long press timer
    pressTimer.current = setTimeout(() => {
      setLongPressTriggered(true);
      if (onLongPress) {
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        onLongPress(reaction, users);
      }
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = (e) => {
    if (!interactive) return;
    
    setIsPressed(false);
    
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    
    const touchEnd = Date.now();
    const touchDuration = touchEnd - (touchStart || touchEnd);
    
    // If it wasn't a long press and was a short tap
    if (!longPressTriggered && touchDuration < 500) {
      if (onToggle) {
        onToggle(reaction, !isUserReacted);
      }
    }
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
    setLongPressTriggered(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
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
    <button
      className={`mobile-reaction-display ${size} ${isUserReacted ? 'user-reacted' : ''} ${isPressed ? 'pressed' : ''} ${!interactive ? 'non-interactive' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      disabled={!interactive}
      style={{
        '--reaction-color': reactionData.color,
        '--press-scale': isPressed ? '0.95' : '1'
      }}
      aria-label={`${reactionData.label} reaction, ${count} users`}
      aria-pressed={isUserReacted}
    >
      <span className="reaction-emoji" role="img" aria-label={reactionData.label}>
        {reactionData.emoji}
      </span>
      
      {count > 0 && (
        <span className="reaction-count" aria-hidden="true">
          {formatCount(count)}
        </span>
      )}
      
      {/* Touch feedback indicator */}
      {isPressed && <div className="touch-feedback" />}
      
      {/* User reaction indicator */}
      {isUserReacted && <div className="user-indicator" />}
    </button>
  );
}

// Mobile-optimized quick reaction bar
function MobileQuickReactions({ 
  onReactionSelect, 
  userReactions = [], 
  className = '',
  reactions = ['like', 'love', 'laugh', 'fire', 'rocket'] 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef(null);

  const handleReactionSelect = (reactionType) => {
    const reactionData = DEFAULT_REACTIONS.find(r => r.type === reactionType);
    if (reactionData && onReactionSelect) {
      onReactionSelect(reactionData);
    }
  };

  const visibleReactions = isExpanded ? reactions : reactions.slice(0, 4);

  return (
    <div className={`mobile-quick-reactions ${className} ${isExpanded ? 'expanded' : ''}`}>
      <div 
        ref={scrollRef}
        className="reactions-scroll"
        role="group"
        aria-label="Quick reactions"
      >
        {visibleReactions.map(reactionType => {
          const reactionData = DEFAULT_REACTIONS.find(r => r.type === reactionType);
          if (!reactionData) return null;
          
          const isSelected = userReactions.includes(reactionType);
          
          return (
            <button
              key={reactionType}
              className={`quick-reaction ${isSelected ? 'selected' : ''}`}
              onClick={() => handleReactionSelect(reactionType)}
              style={{ '--reaction-color': reactionData.color }}
              aria-label={`${reactionData.label} reaction`}
              aria-pressed={isSelected}
            >
              <span role="img" aria-hidden="true">{reactionData.emoji}</span>
            </button>
          );
        })}
        
        {reactions.length > 4 && (
          <button
            className="expand-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Show fewer reactions" : "Show more reactions"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

// Main mobile reaction bar
function MobileReactionBar({
  contentType,
  contentId,
  reactions = {},
  userReactions = [],
  totalReactions = 0,
  reactionUsers = {},
  onReactionToggle,
  onViewReactionUsers,
  onShowPicker,
  compact = false,
  maxVisible = 4,
  className = ''
}) {
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const [reactionCounts, setReactionCounts] = useState(reactions);
  const [userReactionList, setUserReactionList] = useState(userReactions);
  const barRef = useRef(null);

  // Update local state when props change
  useEffect(() => {
    setReactionCounts(reactions);
    setUserReactionList(userReactions);
  }, [reactions, userReactions]);

  // Handle real-time updates
  useEffect(() => {
    if (!window.socket) return;

    const handleReactionUpdate = (data) => {
      if (data.contentType === contentType && data.contentId === contentId) {
        if (data.type === 'REACTION_ADDED') {
          setReactionCounts(prev => ({
            ...prev,
            [data.reactionType]: (prev[data.reactionType] || 0) + 1
          }));
          
          if (data.userId === window.currentUserId) {
            setUserReactionList(prev => [...prev.filter(r => r !== data.reactionType), data.reactionType]);
          }
        } else if (data.type === 'REACTION_REMOVED') {
          setReactionCounts(prev => ({
            ...prev,
            [data.reactionType]: Math.max((prev[data.reactionType] || 0) - 1, 0)
          }));
          
          if (data.userId === window.currentUserId) {
            setUserReactionList(prev => prev.filter(r => r !== data.reactionType));
          }
        }
      }
    };

    window.socket.on('reaction_update', handleReactionUpdate);
    return () => window.socket.off('reaction_update', handleReactionUpdate);
  }, [contentType, contentId]);

  const handleReactionSelect = async (reactionData) => {
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
      
      // Hide quick reactions after selection
      setShowQuickReactions(false);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Revert optimistic update
      setReactionCounts(reactions);
      setUserReactionList(userReactions);
    }
  };

  const handleLongPress = (reactionType, users) => {
    if (onViewReactionUsers) {
      onViewReactionUsers(reactionType, users);
    }
  };

  const handleAddReaction = () => {
    if (onShowPicker) {
      onShowPicker();
    } else {
      setShowQuickReactions(!showQuickReactions);
    }
  };

  const getTopReactions = () => {
    const reactionEntries = Object.entries(reactionCounts)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxVisible);
    
    return reactionEntries;
  };

  const topReactions = getTopReactions();
  const hiddenCount = totalReactions - topReactions.reduce((sum, [_, count]) => sum + count, 0);

  return (
    <div 
      className={`mobile-reaction-bar ${compact ? 'compact' : ''} ${className}`} 
      ref={barRef}
      role="group"
      aria-label="Reactions"
    >
      {/* Reaction displays */}
      <div className="reaction-displays">
        {topReactions.map(([reactionType, count]) => (
          <MobileReactionDisplay
            key={reactionType}
            reaction={reactionType}
            count={count}
            users={reactionUsers[reactionType] || []}
            isUserReacted={userReactionList.includes(reactionType)}
            onToggle={handleReactionSelect}
            onLongPress={handleLongPress}
            size={compact ? 'small' : 'medium'}
          />
        ))}

        {/* Hidden reactions indicator */}
        {hiddenCount > 0 && (
          <button 
            className="hidden-reactions"
            onClick={handleAddReaction}
            aria-label={`${hiddenCount} more reactions`}
          >
            <Plus size={14} />
            <span>{hiddenCount}</span>
          </button>
        )}

        {/* Add reaction button */}
        <button
          className="add-reaction-mobile"
          onClick={handleAddReaction}
          aria-label="Add reaction"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Quick reactions popup */}
      {showQuickReactions && (
        <div className="quick-reactions-popup">
          <MobileQuickReactions
            onReactionSelect={handleReactionSelect}
            userReactions={userReactionList}
          />
        </div>
      )}

      {/* Metadata for non-compact mode */}
      {!compact && totalReactions > 0 && (
        <div className="reaction-metadata">
          <span className="total-reactions">
            <Users size={12} />
            {totalReactions}
          </span>
        </div>
      )}
    </div>
  );
}

// Mobile reaction summary component
function MobileReactionSummary({ 
  reactions, 
  totalUsers, 
  trending = false, 
  onViewDetails,
  className = ''
}) {
  const topReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  if (totalReactions === 0) return null;

  return (
    <div className={`mobile-reaction-summary ${trending ? 'trending' : ''} ${className}`}>
      <div className="summary-reactions">
        {topReactions.map(([reactionType, count]) => {
          const reactionData = DEFAULT_REACTIONS.find(r => r.type === reactionType) || {
            emoji: reactionType,
            color: '#888'
          };
          
          return (
            <div key={reactionType} className="summary-reaction">
              <span className="summary-emoji" role="img" aria-label={reactionData.label}>
                {reactionData.emoji}
              </span>
              <span className="summary-count">{count}</span>
            </div>
          );
        })}
      </div>
      
      <div className="summary-stats">
        <span className="total-count">{totalReactions}</span>
        {totalUsers && totalUsers !== totalReactions && (
          <span className="unique-users">• {totalUsers}</span>
        )}
        
        {trending && (
          <div className="trending-badge">
            <TrendingUp size={10} />
          </div>
        )}
      </div>
      
      {onViewDetails && (
        <button 
          className="view-details-mobile" 
          onClick={onViewDetails}
          aria-label="View reaction details"
        >
          <Eye size={12} />
        </button>
      )}
    </div>
  );
}
export default MobileReactionBar;
export { MobileReactionDisplay, MobileQuickReactions, MobileReactionSummary };
