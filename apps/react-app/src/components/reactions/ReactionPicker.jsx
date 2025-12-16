import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Laugh, ThumbsUp, ThumbsDown, Fire, Rocket, 
  Eye, Brain, Angry, Frown, Plus, Search, Star, Clock
} from 'lucide-react';
// Default reaction types with their emojis and metadata
const DEFAULT_REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like', color: '#1da1f2', category: 'positive' },
  { type: 'love', emoji: '❤️', label: 'Love', color: '#e91e63', category: 'positive' },
  { type: 'laugh', emoji: '😂', label: 'Laugh', color: '#ff9800', category: 'positive' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: '#9c27b0', category: 'surprised' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: '#607d8b', category: 'negative' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: '#f44336', category: 'negative' },
  { type: 'fire', emoji: '🔥', label: 'Fire', color: '#ff5722', category: 'positive' },
  { type: 'rocket', emoji: '🚀', label: 'Rocket', color: '#3f51b5', category: 'positive' },
  { type: 'heart_eyes', emoji: '😍', label: 'Heart Eyes', color: '#e91e63', category: 'positive' },
  { type: 'thinking', emoji: '🤔', label: 'Thinking', color: '#795548', category: 'neutral' },
  { type: 'clap', emoji: '👏', label: 'Clap', color: '#4caf50', category: 'positive' },
  { type: 'thumbs_up', emoji: '👍', label: 'Thumbs Up', color: '#4caf50', category: 'positive' },
  { type: 'thumbs_down', emoji: '👎', label: 'Thumbs Down', color: '#f44336', category: 'negative' }
];

// Categories for organizing reactions
const REACTION_CATEGORIES = [
  { id: 'recent', label: 'Recently Used', icon: Clock },
  { id: 'positive', label: 'Positive', icon: Heart },
  { id: 'negative', label: 'Negative', icon: Frown },
  { id: 'neutral', label: 'Neutral', icon: Brain },
  { id: 'custom', label: 'Custom', icon: Star }
];

function ReactionButton({ reaction, onSelect, isSelected, showLabel = true, size = 'medium' }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onSelect(reaction);
  };

  const sizeClasses = {
    small: 'p-1.5 rounded-lg',
    medium: 'p-3 w-[72px] min-h-[64px] rounded-xl',
    large: 'p-4 w-24 min-h-20 rounded-xl'
  };

  return (
    <button
      className={`
        relative flex flex-col items-center justify-center gap-1
        bg-transparent border-2 transition-all duration-200 cursor-pointer overflow-hidden
        ${sizeClasses[size]}
        ${isSelected ? 'border-current' : 'border-transparent'}
        ${isHovered ? 'bg-white/10 scale-110' : ''}
        ${isPressed ? 'scale-95' : ''}
        hover:bg-white/10
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title={reaction.label}
      style={{
        borderColor: isSelected ? reaction.color : 'transparent',
        backgroundColor: isSelected ? reaction.color : undefined
      }}
    >
      <span className={`leading-none transition-transform duration-200 ${size === 'small' ? 'text-lg' : size === 'large' ? 'text-[32px]' : 'text-2xl'}`}>
        {reaction.emoji}
      </span>
      {showLabel && size !== 'small' && (
        <span className={`text-[11px] font-semibold text-center leading-tight transition-colors duration-200 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
          {reaction.label}
        </span>
      )}

      {/* Animated ripple effect */}
      {isPressed && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 rounded-full pointer-events-none animate-[ripple_0.4s_ease-out]"
          style={{
            background: `radial-gradient(circle, ${reaction.color} 0%, transparent 70%)`
          }}
        />
      )}

      {/* Hover glow effect */}
      {isHovered && (
        <div
          className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 rounded-[14px] opacity-30 blur-[8px] pointer-events-none animate-[glow_0.3s_ease-out]"
          style={{ backgroundColor: reaction.color }}
        />
      )}
    </button>
  );
}

function QuickReactionBar({ reactions, userReactions, onReactionSelect, className = '' }) {
  const quickReactions = reactions.slice(0, 6); // Show first 6 reactions

  return (
    <div className={`flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-full backdrop-blur-[10px] ${className}`}>
      {quickReactions.map(reaction => (
        <ReactionButton
          key={reaction.type}
          reaction={reaction}
          onSelect={onReactionSelect}
          isSelected={userReactions.includes(reaction.type)}
          showLabel={false}
          size="small"
        />
      ))}
      <button
        style={{color: "var(--text-primary)", width: "48px", height: "48px", flexShrink: 0}}
        title="More reactions"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function ReactionPicker({ 
  isOpen, 
  onClose, 
  onReactionSelect, 
  userReactions = [], 
  customEmojis = [],
  recentReactions = [],
  position = 'bottom',
  trigger,
  className = ''
}) {
  const [activeCategory, setActiveCategory] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [animations, setAnimations] = useState({});
  const pickerRef = useRef(null);
  const searchRef = useRef(null);

  // Focus search when picker opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'Tab':
          event.preventDefault();
          // Handle tab navigation between reactions
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleReactionSelect = (reaction) => {
    // Trigger animation
    setAnimations(prev => ({
      ...prev,
      [reaction.type]: Date.now()
    }));

    // Call parent handler
    onReactionSelect(reaction);
    
    // Close picker after selection
    setTimeout(() => onClose(), 200);
  };

  const getFilteredReactions = () => {
    let reactions = [];

    switch (activeCategory) {
      case 'recent':
        reactions = recentReactions.length > 0 ? recentReactions : DEFAULT_REACTIONS.slice(0, 12);
        break;
      case 'custom':
        reactions = customEmojis;
        break;
      default:
        reactions = DEFAULT_REACTIONS.filter(r => r.category === activeCategory);
    }

    if (searchQuery) {
      reactions = reactions.filter(r => 
        r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.emoji.includes(searchQuery)
      );
    }

    return reactions;
  };

  const getPositionClasses = () => {
    const baseClasses = 'reaction-picker';
    const positionClasses = {
      'top': 'position-top',
      'bottom': 'position-bottom',
      'left': 'position-left',
      'right': 'position-right'
    };
    
    return `${baseClasses} ${positionClasses[position] || 'position-bottom'}`;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[9999] pointer-events-none bg-black/10 backdrop-blur-[2px] opacity-0 animate-[fadeIn_0.2s_ease-out_forwards] ${className}`}>
      <div
        ref={pickerRef}
        className={`absolute w-[420px] max-w-[90vw] bg-gradient-to-br from-zinc-900/90 to-zinc-950/80 border border-zinc-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-auto backdrop-blur-[20px] ${
          position === 'bottom' ? 'bottom-[60px] left-1/2 -translate-x-1/2' :
          position === 'top' ? 'top-[60px] left-1/2 -translate-x-1/2' :
          position === 'left' ? 'left-[60px] top-1/2 -translate-y-1/2' :
          'right-[60px] top-1/2 -translate-y-1/2'
        } scale-75 opacity-0 animate-[pickerSlideIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]`}
        role="dialog"
        aria-label="Select a reaction"
      >
        {/* Header with search */}
        <div className="p-4 border-b border-zinc-800">
          <div className="relative flex items-center gap-2">
            <Search size={16} className="absolute left-3 text-gray-500 z-10" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search reactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{color: "var(--text-primary)"}} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 pl-9  text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(88,166,255,0.2)] placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex p-2 gap-1 border-b border-zinc-800 overflow-x-auto scrollbar-none">
          {REACTION_CATEGORIES.map(category => {
            const IconComponent = category.icon;
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-500 hover:bg-zinc-800 hover:text-white'
                }`}
                onClick={() => setActiveCategory(category.id)}
                title={category.label}
              >
                <IconComponent size={16} />
                <span className="text-[11px] font-semibold uppercase tracking-wider">{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Reaction grid */}
        <div className="p-4 grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700">
          {getFilteredReactions().map(reaction => {
            const isSelected = userReactions.includes(reaction.type);
            const isAnimating = animations[reaction.type];

            return (
              <div
                key={reaction.type || reaction.id}
                className={`relative flex flex-col items-center ${isSelected ? 'scale-105' : ''} ${isAnimating ? 'animate-[reactionSelect_0.4s_cubic-bezier(0.68,-0.55,0.265,1.55)]' : ''}`}
                onMouseEnter={() => setHoveredReaction(reaction)}
                onMouseLeave={() => setHoveredReaction(null)}
              >
                <ReactionButton
                  reaction={reaction}
                  onSelect={handleReactionSelect}
                  isSelected={isSelected}
                  showLabel={true}
                  size="medium"
                />

                {/* Tooltip with reaction info */}
                {hoveredReaction === reaction && (
                  <div style={{color: "var(--text-primary)"}} className="absolute bottom-full left-1/2 -translate-x-1/2   px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10 mb-2 opacity-0 animate-[tooltipFadeIn_0.2s_ease-out_forwards] after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-black">
                    <span className="mr-1.5">{reaction.emoji}</span>
                    <span>{reaction.label}</span>
                    {reaction.usage_count && (
                      <span className="text-gray-400 ml-2 text-[11px]">Used {reaction.usage_count} times</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {getFilteredReactions().length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-2 py-8 px-8 text-gray-500 text-sm">
              <span>No reactions found</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{color: "var(--text-primary)"}} className="bg-blue-500 border-none rounded-md px-3 py-1.5  text-xs cursor-pointer transition-colors duration-200 hover:bg-blue-600"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-800 bg-zinc-900/50 rounded-b-2xl">
          <div className="flex gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] font-inherit mr-1">Esc</kbd>
              Close
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] font-inherit mr-1">Tab</kbd>
              Navigate
            </span>
          </div>

          {customEmojis.length === 0 && activeCategory === 'custom' && (
            <button style={{color: "var(--text-primary)"}} className="flex items-center gap-1 bg-transparent border border-zinc-700 rounded-md px-2 py-1 text-gray-500 text-[11px] cursor-pointer transition-all duration-200 hover: hover:border-blue-500">
              <Plus size={14} />
              Add Custom Emoji
            </button>
          )}
        </div>

        {/* Animated background particles for visual flair */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-500 rounded-full opacity-30 animate-[floatParticle_4s_infinite_ease-in-out]"
              style={{
                animationDelay: `${i * 0.5}s`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReactionPicker;
export { QuickReactionBar, ReactionButton, DEFAULT_REACTIONS };
