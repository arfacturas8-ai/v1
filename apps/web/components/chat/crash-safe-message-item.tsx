"use client";

import * as React from "react";
import { MoreHorizontal, Reply, Heart, Pin, Copy, Trash2, Edit, Flag, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message, DirectMessage, UserRole, MessageType } from "@/lib/types";
import { MessageErrorBoundary } from "@/components/error-boundaries/chat-error-boundary";
import { sanitizeMessageContent } from "@/lib/utils/input-sanitizer";

interface CrashSafeMessageItemProps {
  message: Message | DirectMessage;
  isDirectMessage: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  compact: boolean;
  onHeightChange?: (messageId: string, height: number) => void;
}

// Safe wrapper component for message content
const SafeMessageContent: React.FC<{
  message: Message | DirectMessage;
  getMessageContent: () => string;
}> = ({ message, getMessageContent }) => {
  const [error, setError] = React.useState<Error | null>(null);
  const [sanitizedContent, setSanitizedContent] = React.useState<string>('');

  React.useEffect(() => {
    try {
      const content = getMessageContent();
      const sanitizationResult = sanitizeMessageContent(content);
      
      if (!sanitizationResult.isValid) {
        console.warn('Message content failed validation:', sanitizationResult.errors);
        setSanitizedContent('[Message content could not be displayed safely]');
        return;
      }

      setSanitizedContent(sanitizationResult.sanitized);
      setError(null);
    } catch (err) {
      console.error('Error processing message content:', err);
      setError(err as Error);
      setSanitizedContent('[Error displaying message]');
    }
  }, [getMessageContent]);

  if (error) {
    return (
      <div className="text-red-400 text-sm italic">
        <AlertTriangle className="w-4 h-4 inline mr-1" />
        Failed to load message content
      </div>
    );
  }

  return (
    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
      {sanitizedContent}
    </div>
  );
};

// Safe avatar component with fallback handling
const SafeAvatar: React.FC<{
  author: Message['author'] | DirectMessage['author'];
  onClick: () => void;
}> = ({ author, onClick }) => {
  const [imageError, setImageError] = React.useState(false);
  const [displayName, setDisplayName] = React.useState('');
  const [username, setUsername] = React.useState('');

  React.useEffect(() => {
    try {
      // Safely extract display name and username
      const safeName = (author.displayName || '').trim();
      const safeUsername = (author.username || '').trim();
      
      setDisplayName(safeName);
      setUsername(safeUsername);
    } catch (error) {
      console.error('Error processing author data:', error);
      setDisplayName('Unknown User');
      setUsername('unknown');
    }
  }, [author]);

  const handleImageError = React.useCallback(() => {
    setImageError(true);
  }, []);

  const getFallbackText = React.useCallback(() => {
    if (displayName) return displayName[0]?.toUpperCase() || 'U';
    if (username) return username[0]?.toUpperCase() || 'U';
    return 'U';
  }, [displayName, username]);

  return (
    <Avatar className="cursor-pointer" onClick={onClick}>
      {!imageError && author.avatar && (
        <AvatarImage 
          src={author.avatar} 
          alt={displayName || username}
          onError={handleImageError}
        />
      )}
      <AvatarFallback>
        {getFallbackText()}
      </AvatarFallback>
    </Avatar>
  );
};

// Safe timestamp component
const SafeTimestamp: React.FC<{
  createdAt: Date | string;
  showTooltip?: boolean;
}> = ({ createdAt, showTooltip = false }) => {
  const [formattedTime, setFormattedTime] = React.useState('');
  const [formattedFullDate, setFormattedFullDate] = React.useState('');
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    try {
      const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      const time = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

      const fullDate = date.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      setFormattedTime(time);
      setFormattedFullDate(fullDate);
      setError(false);
    } catch (err) {
      console.error('Error formatting timestamp:', err);
      setFormattedTime('--:--');
      setFormattedFullDate('Invalid date');
      setError(true);
    }
  }, [createdAt]);

  if (error) {
    return <span className="text-xs text-red-400">Invalid time</span>;
  }

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className="text-xs text-gray-500 hover:text-gray-300">
              {formattedTime}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formattedFullDate}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className="text-xs text-gray-500">
      {formattedTime}
    </span>
  );
};

// Safe message actions component
const SafeMessageActions: React.FC<{
  message: Message | DirectMessage;
  isDirectMessage: boolean;
  isOwnMessage: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onPin: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}> = ({
  message,
  isDirectMessage,
  isOwnMessage,
  canEdit,
  canDelete,
  onReply,
  onReact,
  onPin,
  onCopy,
  onEdit,
  onDelete,
  onReport,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className="absolute -top-3 right-4 flex items-center space-x-1 bg-gray-800 border border-gray-600 rounded-md p-1 shadow-lg">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-400 hover:text-white"
              onClick={() => {
                try {
                  onReact("❤️");
                } catch (error) {
                  console.error('Error adding reaction:', error);
                }
              }}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add Reaction</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-400 hover:text-white"
              onClick={() => {
                try {
                  onReply();
                } catch (error) {
                  console.error('Error replying to message:', error);
                }
              }}
            >
              <Reply className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reply</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-400 hover:text-white"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              try {
                onCopy();
              } catch (error) {
                console.error('Error copying message:', error);
              }
            }}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </DropdownMenuItem>
            {!isDirectMessage && 'isPinned' in message && (
              <DropdownMenuItem onClick={() => {
                try {
                  onPin();
                } catch (error) {
                  console.error('Error pinning message:', error);
                }
              }}>
                <Pin className="w-4 h-4 mr-2" />
                {message.isPinned ? "Unpin Message" : "Pin Message"}
              </DropdownMenuItem>
            )}
            {canEdit && (
              <DropdownMenuItem onClick={() => {
                try {
                  onEdit();
                } catch (error) {
                  console.error('Error editing message:', error);
                }
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Message
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  try {
                    onDelete();
                  } catch (error) {
                    console.error('Error deleting message:', error);
                  }
                }} className="text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Message
                </DropdownMenuItem>
              </>
            )}
            {!isOwnMessage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  try {
                    onReport();
                  } catch (error) {
                    console.error('Error reporting message:', error);
                  }
                }} className="text-red-400">
                  <Flag className="w-4 h-4 mr-2" />
                  Report Message
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
};

export const CrashSafeMessageItem: React.FC<CrashSafeMessageItemProps> = ({
  message,
  isDirectMessage,
  isGroupStart,
  isGroupEnd,
  showAvatar,
  showTimestamp,
  compact,
  onHeightChange,
}) => {
  const { user: currentUser } = useAuthStore();
  const { openModal, showTimestamps } = useUIStore();
  const { updateMessage, removeMessage } = useChatStore();

  const [isHovered, setIsHovered] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const messageRef = React.useRef<HTMLDivElement>(null);

  // Measure height changes
  React.useEffect(() => {
    if (onHeightChange && messageRef.current) {
      const height = messageRef.current.offsetHeight;
      onHeightChange(message.id, height);
    }
  }, [message.id, onHeightChange, compact, isGroupStart, showAvatar]);

  // Safety checks for message and user data
  const safeMessage = React.useMemo(() => {
    try {
      if (!message || typeof message !== 'object') {
        throw new Error('Invalid message object');
      }
      
      if (!message.id || !message.authorId || !message.createdAt || !message.author) {
        throw new Error('Missing required message fields');
      }

      return message;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [message]);

  const safeCurrentUser = React.useMemo(() => {
    try {
      return currentUser && typeof currentUser === 'object' ? currentUser : null;
    } catch (err) {
      console.error('Error processing current user:', err);
      return null;
    }
  }, [currentUser]);

  // Safe computed values
  const isOwnMessage = React.useMemo(() => {
    try {
      return safeMessage && safeCurrentUser ? safeMessage.authorId === safeCurrentUser.id : false;
    } catch (err) {
      console.error('Error computing isOwnMessage:', err);
      return false;
    }
  }, [safeMessage, safeCurrentUser]);

  const canEdit = React.useMemo(() => {
    try {
      return isOwnMessage && safeMessage && safeMessage.type === MessageType.DEFAULT;
    } catch (err) {
      console.error('Error computing canEdit:', err);
      return false;
    }
  }, [isOwnMessage, safeMessage]);

  const canDelete = React.useMemo(() => {
    try {
      if (!safeCurrentUser || !safeMessage) return false;
      
      return isOwnMessage || 
             safeCurrentUser.roles?.includes(UserRole.MODERATOR) || 
             safeCurrentUser.roles?.includes(UserRole.ADMIN);
    } catch (err) {
      console.error('Error computing canDelete:', err);
      return false;
    }
  }, [isOwnMessage, safeCurrentUser, safeMessage]);

  // Safe event handlers
  const handleAuthorClick = React.useCallback(() => {
    try {
      if (safeMessage) {
        openModal("user-profile", { userId: safeMessage.authorId });
      }
    } catch (error) {
      console.error('Error opening user profile:', error);
    }
  }, [openModal, safeMessage]);

  const handleReply = React.useCallback(() => {
    try {
      if (safeMessage) {
        openModal("reply-message", { messageId: safeMessage.id });
      }
    } catch (error) {
      console.error('Error opening reply modal:', error);
    }
  }, [openModal, safeMessage]);

  const handleReact = React.useCallback((emoji: string) => {
    try {
      console.log("React with:", emoji);
      // API call would go here
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, []);

  const handlePin = React.useCallback(() => {
    try {
      if (safeMessage && 'channelId' in safeMessage) {
        updateMessage(safeMessage.id, { isPinned: !safeMessage.isPinned });
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  }, [safeMessage, updateMessage]);

  const handleCopy = React.useCallback(() => {
    try {
      if (safeMessage && navigator.clipboard) {
        navigator.clipboard.writeText(safeMessage.content);
      }
    } catch (error) {
      console.error('Error copying message:', error);
    }
  }, [safeMessage]);

  const handleEdit = React.useCallback(() => {
    try {
      if (safeMessage) {
        openModal("edit-message", { messageId: safeMessage.id });
      }
    } catch (error) {
      console.error('Error opening edit modal:', error);
    }
  }, [openModal, safeMessage]);

  const handleDelete = React.useCallback(() => {
    try {
      if (safeMessage) {
        openModal("confirm-delete", {
          title: "Delete Message",
          description: "Are you sure you want to delete this message? This action cannot be undone.",
          onConfirm: () => {
            try {
              if ('channelId' in safeMessage) {
                removeMessage(safeMessage.id, safeMessage.channelId);
              } else {
                console.log("Delete DM:", safeMessage.id);
              }
            } catch (error) {
              console.error('Error deleting message:', error);
            }
          },
        });
      }
    } catch (error) {
      console.error('Error opening delete modal:', error);
    }
  }, [openModal, safeMessage, removeMessage]);

  const handleReport = React.useCallback(() => {
    try {
      if (safeMessage) {
        openModal("report-message", { messageId: safeMessage.id });
      }
    } catch (error) {
      console.error('Error opening report modal:', error);
    }
  }, [openModal, safeMessage]);

  const getMessageContent = React.useCallback(() => {
    try {
      if (!safeMessage) return 'Message unavailable';
      
      if (safeMessage.type === MessageType.DEFAULT) {
        return safeMessage.content || '';
      }
      
      // Handle system messages
      switch (safeMessage.type) {
        case MessageType.GUILD_MEMBER_JOIN:
          return `${safeMessage.author.displayName || safeMessage.author.username} joined the server.`;
        case MessageType.CHANNEL_PINNED_MESSAGE:
          return `${safeMessage.author.displayName || safeMessage.author.username} pinned a message.`;
        default:
          return safeMessage.content || '';
      }
    } catch (error) {
      console.error('Error getting message content:', error);
      return 'Error loading message content';
    }
  }, [safeMessage]);

  // Error state
  if (error || !safeMessage) {
    return (
      <div className="flex items-center gap-3 p-2 bg-red-900/20 border border-red-600 rounded text-red-200">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-sm">Failed to load message</span>
      </div>
    );
  }

  // Compact mode
  if (compact) {
    return (
      <MessageErrorBoundary>
        <div
          ref={messageRef}
          className={cn(
            "group flex items-start space-x-2 py-0.5 px-2 hover:bg-gray-600/30 rounded",
            isHovered && "bg-gray-600/30"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="w-12 text-xs text-gray-500 text-right flex-shrink-0 opacity-0 group-hover:opacity-100">
            <SafeTimestamp createdAt={safeMessage.createdAt} />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-gray-300">
              <span
                className="font-medium text-blue-400 hover:underline cursor-pointer mr-2"
                onClick={handleAuthorClick}
              >
                {safeMessage.author.displayName || safeMessage.author.username}
              </span>
              <SafeMessageContent message={safeMessage} getMessageContent={getMessageContent} />
            </span>
          </div>
        </div>
      </MessageErrorBoundary>
    );
  }

  // Full mode
  return (
    <MessageErrorBoundary>
      <div
        ref={messageRef}
        className={cn(
          "group flex space-x-3 py-2 px-4 hover:bg-gray-600/30 rounded-lg relative",
          !isGroupStart && "pt-1",
          isHovered && "bg-gray-600/30"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar */}
        <div className="w-10 flex-shrink-0">
          {showAvatar ? (
            <SafeAvatar author={safeMessage.author} onClick={handleAuthorClick} />
          ) : (
            <div className="h-10 flex items-center justify-center">
              {(showTimestamps || isHovered) && (
                <SafeTimestamp createdAt={safeMessage.createdAt} />
              )}
            </div>
          )}
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          {/* Author and timestamp */}
          {isGroupStart && (
            <div className="flex items-baseline space-x-2 mb-1">
              <span
                className="font-semibold text-gray-200 hover:underline cursor-pointer"
                onClick={handleAuthorClick}
              >
                {safeMessage.author.displayName || safeMessage.author.username}
              </span>
              
              <SafeTimestamp createdAt={safeMessage.createdAt} showTooltip />

              {'isEdited' in safeMessage && safeMessage.isEdited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}

              {'isPinned' in safeMessage && safeMessage.isPinned && (
                <Pin className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          )}

          {/* Message text */}
          <SafeMessageContent message={safeMessage} getMessageContent={getMessageContent} />

          {/* Future: Attachments, Embeds, Reactions */}
        </div>

        {/* Message actions */}
        {isHovered && (
          <SafeMessageActions
            message={safeMessage}
            isDirectMessage={isDirectMessage}
            isOwnMessage={isOwnMessage}
            canEdit={canEdit}
            canDelete={canDelete}
            onReply={handleReply}
            onReact={handleReact}
            onPin={handlePin}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReport={handleReport}
          />
        )}
      </div>
    </MessageErrorBoundary>
  );
};