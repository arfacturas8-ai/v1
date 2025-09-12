"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { useChatSocket } from "@/lib/hooks/use-chat-socket";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmojiPicker } from "./emoji-picker";
import { Reaction } from "@/lib/types";

interface MessageReactionsProps {
  reactions: Reaction[];
  messageId: string;
  channelId?: string;
  onReact?: (emoji: string) => void;
}

export function MessageReactions({ reactions, messageId, channelId, onReact }: MessageReactionsProps) {
  const { user: currentUser } = useAuthStore();
  const { socket, connected } = useChatSocket();
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  if (!reactions || reactions.length === 0) {
    return null;
  }

  const handleEmojiSelect = (emoji: any) => {
    const emojiText = emoji.native || emoji.shortcodes || `:${emoji.id}:`;
    handleReactionToggle(emojiText);
    setShowEmojiPicker(false);
  };

  const handleReactionToggle = (emoji: string) => {
    if (connected && channelId) {
      // Send reaction toggle via Socket.io
      socket.emit('message:reaction', {
        messageId,
        channelId,
        emoji,
        action: 'toggle' // Server will determine add/remove based on current state
      });
    }
    
    // Call parent handler if provided
    onReact?.(emoji);
  };

  const handleReactionClick = (reaction: Reaction) => {
    handleReactionToggle(reaction.emoji);
  };

  const getUserReactedEmojis = () => {
    if (!currentUser) return new Set();
    
    return new Set(
      reactions
        .filter(reaction => reaction.users.some(user => user.id === currentUser.id))
        .map(reaction => reaction.emoji)
    );
  };

  const userReactedEmojis = getUserReactedEmojis();

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1">
        <AnimatePresence>
          {reactions.map((reaction) => {
            const hasUserReacted = userReactedEmojis.has(reaction.emoji);
            const userNames = reaction.users.map(user => user.displayName || user.username);
            const tooltipText = userNames.length <= 3 
              ? userNames.join(", ")
              : `${userNames.slice(0, 3).join(", ")} and ${userNames.length - 3} more`;

            return (
              <motion.div
                key={reaction.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 px-2 py-1 rounded-full border bg-gray-800 hover:bg-gray-700 transition-all duration-200",
                        hasUserReacted 
                          ? "border-blue-500 bg-blue-900/30 hover:bg-blue-800/50 scale-105" 
                          : "border-gray-600 hover:border-gray-500"
                      )}
                      onClick={() => handleReactionClick(reaction)}
                    >
                      <span className="text-sm mr-1">{reaction.emoji}</span>
                      <span className={cn(
                        "text-xs font-medium",
                        hasUserReacted ? "text-blue-300" : "text-gray-300"
                      )}>
                        {reaction.count}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltipText}</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add reaction button with emoji picker */}
        <Tooltip>
          <TooltipTrigger asChild>
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              disabled={!connected}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full border border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-gray-500 transition-all duration-200"
                disabled={!connected}
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </Button>
            </EmojiPicker>
          </TooltipTrigger>
          <TooltipContent>
            <p>{connected ? "Add reaction" : "Connect to add reactions"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}