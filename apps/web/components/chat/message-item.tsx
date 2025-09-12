"use client";

import * as React from "react";
import { MoreHorizontal, Reply, Heart, Pin, Copy, Trash2, Edit, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { useUIStore } from "@/lib/stores/use-ui-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedDiv, Pressable, HoverScale } from "@/components/ui/motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message, DirectMessage, UserRole, MessageType } from "@/lib/types";
import { MessageReactions } from "./message-reactions";
import { MessageAttachments } from "./message-attachments";
import { MessageEmbeds } from "./message-embeds";

interface MessageItemProps {
  message: Message | DirectMessage;
  isDirectMessage: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  compact: boolean;
}

export function MessageItem({
  message,
  isDirectMessage,
  isGroupStart,
  isGroupEnd,
  showAvatar,
  showTimestamp,
  compact,
}: MessageItemProps) {
  const { user: currentUser } = useAuthStore();
  const { openModal, showTimestamps } = useUIStore();
  const { updateMessage, removeMessage } = useChatStore();

  const [isHovered, setIsHovered] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const isOwnMessage = message.authorId === currentUser?.id;
  const canEdit = isOwnMessage && message.type === MessageType.DEFAULT;
  const canDelete = isOwnMessage || currentUser?.roles.includes(UserRole.MODERATOR) || currentUser?.roles.includes(UserRole.ADMIN);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDate = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReply = () => {
    openModal("reply-message", { messageId: message.id });
  };

  const handleReact = (emoji: string) => {
    // This would typically call an API to add/remove reaction
    console.log("React with:", emoji);
  };

  const handlePin = () => {
    if ('channelId' in message) {
      updateMessage(message.id, { isPinned: !message.isPinned });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleEdit = () => {
    openModal("edit-message", { messageId: message.id });
  };

  const handleDelete = () => {
    openModal("confirm-delete", {
      title: "Delete Message",
      description: "Are you sure you want to delete this message? This action cannot be undone.",
      onConfirm: () => {
        if ('channelId' in message) {
          removeMessage(message.id, message.channelId);
        } else {
          // Handle DM deletion differently
          console.log("Delete DM:", message.id);
        }
      },
    });
  };

  const handleReport = () => {
    openModal("report-message", { messageId: message.id });
  };

  const handleAuthorClick = () => {
    openModal("user-profile", { userId: message.authorId });
  };

  const getMessageContent = () => {
    if (message.type === MessageType.DEFAULT) {
      return message.content;
    }
    
    // Handle system messages
    switch (message.type) {
      case MessageType.GUILD_MEMBER_JOIN:
        return `${message.author.displayName || message.author.username} joined the server.`;
      case MessageType.CHANNEL_PINNED_MESSAGE:
        return `${message.author.displayName || message.author.username} pinned a message.`;
      default:
        return message.content;
    }
  };

  if (compact) {
    return (
      <AnimatedDiv
        variant="slideIn"
        className={cn(
          "group flex items-start space-x-2 py-0.5 px-2 rounded-md transition-all duration-200",
          "hover:bg-card/50 dark:hover:bg-gray-800/30",
          isHovered && "bg-card/50 dark:bg-gray-800/30"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Timestamp */}
        <motion.div 
          className="w-12 text-xs text-muted-foreground text-right flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {formatTime(message.createdAt)}
        </motion.div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          <span className="text-foreground">
            <Pressable
              className="font-medium text-brand-primary hover:text-brand-primary-light cursor-pointer mr-2 inline-block"
              onClick={handleAuthorClick}
            >
              {message.author.displayName || message.author.username}
            </Pressable>
            <span className="text-foreground/90">{getMessageContent()}</span>
          </span>
        </div>

        {/* Message actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="flex items-center space-x-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={handleReply}
                    >
                      <Reply className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reply</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Message
                  </DropdownMenuItem>
                  {!isDirectMessage && (
                    <DropdownMenuItem onClick={handlePin}>
                      <Pin className="w-4 h-4 mr-2" />
                      {message.isPinned ? "Unpin Message" : "Pin Message"}
                    </DropdownMenuItem>
                  )}
                  {canEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Message
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDelete} className="text-error">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Message
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isOwnMessage && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleReport} className="text-warning">
                        <Flag className="w-4 h-4 mr-2" />
                        Report Message
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatedDiv>
    );
  }

  return (
    <AnimatedDiv
      variant="slideIn"
      className={cn(
        "group flex space-x-3 py-2 px-4 rounded-lg relative transition-all duration-200",
        "hover:bg-card/50 dark:hover:bg-gray-800/30",
        !isGroupStart && "pt-1",
        isHovered && "bg-card/50 dark:bg-gray-800/30",
        message.isPinned && "border-l-4 border-brand-primary bg-brand-primary/5"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="w-10 flex-shrink-0">
        {showAvatar ? (
          <HoverScale>
            <Avatar
              className="cursor-pointer ring-2 ring-transparent hover:ring-brand-primary/20 transition-all"
              onClick={handleAuthorClick}
            >
              <AvatarImage src={message.author.avatar} alt={message.author.username} />
              <AvatarFallback className="bg-gradient-to-br from-brand-primary to-innovation-cyan text-white font-semibold">
                {message.author.displayName?.[0] || message.author.username[0]}
              </AvatarFallback>
            </Avatar>
          </HoverScale>
        ) : (
          <div className="h-10 flex items-center justify-center">
            <AnimatePresence>
              {(showTimestamps || isHovered) && (
                <motion.span 
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {formatTime(message.createdAt)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Author and timestamp */}
        {isGroupStart && (
          <motion.div 
            className="flex items-baseline space-x-2 mb-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Pressable
              className="font-semibold text-foreground hover:text-brand-primary cursor-pointer"
              onClick={handleAuthorClick}
            >
              {message.author.displayName || message.author.username}
            </Pressable>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-help">
                    {formatTime(message.createdAt)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatFullDate(message.createdAt)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <AnimatePresence>
              {message.isEdited && (
                <motion.span 
                  className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  edited
                </motion.span>
              )}

              {(message as any).isPending && (
                <motion.span 
                  className="text-xs text-yellow-400 bg-yellow-900/20 px-1.5 py-0.5 rounded-full flex items-center space-x-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span>pending</span>
                </motion.span>
              )}

              {message.isPinned && (
                <motion.div
                  initial={{ opacity: 0, rotate: -10 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 10 }}
                >
                  <Pin className="w-4 h-4 text-warning" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Message text */}
        <motion.div 
          className="text-foreground/90 leading-relaxed whitespace-pre-wrap break-words"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {getMessageContent()}
        </motion.div>

        {/* Attachments */}
        <AnimatePresence>
          {message.attachments && message.attachments.length > 0 && (
            <motion.div 
              className="mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <MessageAttachments attachments={message.attachments} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Embeds */}
        <AnimatePresence>
          {message.embeds && message.embeds.length > 0 && (
            <motion.div 
              className="mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <MessageEmbeds embeds={message.embeds} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reactions */}
        <AnimatePresence>
          {message.reactions && message.reactions.length > 0 && (
            <motion.div 
              className="mt-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: 0.5 }}
            >
              <MessageReactions 
                reactions={message.reactions}
                messageId={message.id}
                channelId={'channelId' in message ? message.channelId : undefined}
                onReact={handleReact}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            className="absolute -top-3 right-4 flex items-center space-x-1 bg-card border border-border rounded-lg p-1 shadow-lg backdrop-blur-sm"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-error hover:bg-error/10"
                    onClick={() => handleReact("❤️")}
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
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={handleReply}
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
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Message
                  </DropdownMenuItem>
                  {!isDirectMessage && (
                    <DropdownMenuItem onClick={handlePin}>
                      <Pin className="w-4 h-4 mr-2" />
                      {message.isPinned ? "Unpin Message" : "Pin Message"}
                    </DropdownMenuItem>
                  )}
                  {canEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Message
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDelete} className="text-error">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Message
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isOwnMessage && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleReport} className="text-warning">
                        <Flag className="w-4 h-4 mr-2" />
                        Report Message
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedDiv>
  );
}