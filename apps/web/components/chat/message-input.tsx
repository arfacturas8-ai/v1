"use client";

import * as React from "react";
import { Send, Paperclip, Smile, Gift, Hash, AtSign, Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { useChatStore } from "@/lib/stores/use-chat-store";
import { useChatSocket } from "@/lib/hooks/use-chat-socket";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmojiPicker, emojiToText, useFrequentEmojis } from "./emoji-picker";
import { SendMessageForm } from "@/lib/types";

interface MessageInputProps {
  channelId?: string;
  dmUserId?: string;
  placeholder?: string;
  disabled?: boolean;
  replyingTo?: string; // Message ID being replied to
  onSend?: (data: SendMessageForm) => void;
}

export function MessageInput({
  channelId,
  dmUserId,
  placeholder = "Type a message...",
  disabled = false,
  replyingTo,
  onSend,
}: MessageInputProps) {
  const { user } = useAuthStore();
  const { addMessage, addDirectMessage, channels, users } = useChatStore();
  const { socket, connected } = useChatSocket();

  const [content, setContent] = React.useState("");
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [queuedMessages, setQueuedMessages] = React.useState<Array<{
    id: string;
    content: string;
    attachments: File[];
    channelId?: string;
    dmUserId?: string;
    timestamp: Date;
  }>>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<{[key: string]: number}>({});

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout>();
  const { frequentEmojis, addFrequentEmoji } = useFrequentEmojis();

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [content]);

  // Handle typing indicator
  React.useEffect(() => {
    if (!connected || (!channelId && !dmUserId)) return;

    if (content.length > 0 && !isTyping) {
      setIsTyping(true);
      if (channelId) {
        socket.startTyping(channelId);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        if (channelId) {
          socket.stopTyping(channelId);
        }
      }
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, isTyping, connected, channelId, dmUserId, socket]);

  // Process queued messages when connection is restored
  React.useEffect(() => {
    if (connected && queuedMessages.length > 0) {
      const processQueue = async () => {
        for (const queuedMessage of queuedMessages) {
          try {
            if (queuedMessage.channelId) {
              socket.sendMessage(
                queuedMessage.channelId,
                queuedMessage.content,
                queuedMessage.attachments?.map(file => file.name) || []
              );
            } else if (queuedMessage.dmUserId) {
              socket.sendDirectMessage(
                queuedMessage.dmUserId,
                queuedMessage.content,
                queuedMessage.attachments?.map(file => file.name) || []
              );
            }
          } catch (error) {
            console.error("Failed to send queued message:", error);
          }
        }
        setQueuedMessages([]);
      };

      // Small delay to ensure connection is stable
      setTimeout(processQueue, 1000);
    }
  }, [connected, queuedMessages, socket]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!content.trim() && attachments.length === 0) return;
    if (isSending || disabled || !user) return;
    
    setIsSending(true);

    try {
      const messageData: SendMessageForm = {
        content: content.trim(),
        attachments,
        replyTo: replyingTo,
      };

      if (onSend) {
        await onSend(messageData);
      } else if (connected) {
        // Send message via Socket.io
        if (channelId) {
          socket.sendMessage(
            channelId,
            messageData.content,
            messageData.attachments?.map(file => file.name) || [],
            messageData.replyTo
          );
        } else if (dmUserId) {
          socket.sendDirectMessage(
            dmUserId,
            messageData.content,
            messageData.attachments?.map(file => file.name) || []
          );
        }
        
        // Stop typing indicator after sending
        if (isTyping) {
          setIsTyping(false);
          if (channelId) {
            socket.stopTyping(channelId);
          }
        }
      } else {
        // Queue message for later sending when connection is restored
        const queuedMessage = {
          id: crypto.randomUUID(),
          content: messageData.content,
          attachments: messageData.attachments || [],
          channelId,
          dmUserId,
          timestamp: new Date(),
        };
        
        setQueuedMessages(prev => [...prev, queuedMessage]);

        // Also add to local store for immediate display with pending status
        const newMessage = {
          id: queuedMessage.id,
          content: messageData.content,
          authorId: user.id,
          author: user,
          type: 'default' as const,
          isEdited: false,
          isPinned: false,
          createdAt: new Date(),
          attachments: [],
          embeds: [],
          reactions: [],
          mentions: [],
          isPending: true, // Mark as pending
        };

        if (channelId) {
          addMessage({
            ...newMessage,
            channelId,
            serverId: channels[channelId]?.serverId,
          });
        } else if (dmUserId) {
          const recipient = users[dmUserId];
          if (recipient) {
            addDirectMessage({
              ...newMessage,
              recipientId: dmUserId,
              recipient,
              isRead: false,
            });
          }
        }
      }

      // Clear input
      setContent("");
      setAttachments([]);
      
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line
        return;
      } else {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    
    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          console.warn(`File ${file.name} is too large (max 10MB)`);
          return false;
        }
        return true;
      });
      
      setAttachments(prev => [...prev, ...validFiles]);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    const emojiText = emojiToText(emoji);
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emojiText + content.slice(end);
      setContent(newContent);
      
      // Set cursor position after emoji
      setTimeout(() => {
        const newPosition = start + emojiText.length;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      }, 0);
    } else {
      setContent(prev => prev + emojiText);
    }
    
    // Track frequent emoji usage
    addFrequentEmoji(emoji);
  };

  const handleGiftClick = () => {
    // This would open gift/premium features
    console.log("Open gift options");
  };

  const canSend = (content.trim().length > 0 || attachments.length > 0) && !isSending && !disabled;
  const willQueue = canSend && !connected;

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "bg-gray-800 rounded-lg border border-gray-700 relative transition-all duration-200",
          isDragOver && "border-blue-500 bg-blue-900/20"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-600/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Paperclip className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-300 font-medium">Drop files to attach</p>
              <p className="text-blue-400 text-sm">Max 10MB per file</p>
            </div>
          </div>
        )}
        {/* Reply indicator */}
        {replyingTo && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-700 border-b border-gray-600 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                Replying to message
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600 transition-colors rounded"
              onClick={() => {/* Clear reply */}}
            >
              ×
            </Button>
          </div>
        )}

        {/* Queued messages indicator */}
        {queuedMessages.length > 0 && (
          <div className="px-4 py-2 bg-yellow-900/20 border-b border-yellow-500/30">
            <div className="flex items-center space-x-2 text-yellow-400 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span>
                {queuedMessages.length} message{queuedMessages.length !== 1 ? 's' : ''} queued (will send when connected)
              </span>
            </div>
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-600">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => {
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                const isImage = file.type.startsWith('image/');
                const progress = uploadProgress[file.name] || 0;
                
                return (
                  <div
                    key={index}
                    className="relative flex items-center space-x-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 min-w-0"
                  >
                    {/* File icon */}
                    {isImage ? (
                      <div className="w-8 h-8 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        />
                      </div>
                    ) : (
                      <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    
                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-300 truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {fileSize} MB
                      </div>
                    </div>
                    
                    {/* Upload progress */}
                    {progress > 0 && progress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600 rounded-b-lg overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0 text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors rounded flex-shrink-0"
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex items-end space-x-2 p-3 sm:p-4">
          {/* File upload */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="touch-target text-gray-400 hover:text-white hover:bg-gray-600 transition-colors flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                aria-label="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Attach file</p>
            </TooltipContent>
          </Tooltip>

          {/* Message input */}
          <div className="flex-1 relative min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 pr-20 sm:pr-24",
                "border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                "min-h-[44px] sm:min-h-[48px] max-h-[120px] sm:max-h-[200px] overflow-y-auto hide-scrollbar",
                "text-base sm:text-sm leading-relaxed",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />

            {/* Quick actions */}
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    disabled={disabled}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add emoji</p>
                </TooltipContent>
              </Tooltip>

              <div className="hidden sm:block">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
                      onClick={handleGiftClick}
                      disabled={disabled}
                      aria-label="Send gift"
                    >
                      <Gift className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send gift</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Send button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                variant={canSend ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "touch-target flex-shrink-0 transition-colors",
                  canSend && connected
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : canSend && !connected
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-600"
                )}
                disabled={!canSend}
                aria-label={willQueue ? "Queue message" : "Send message"}
              >
                <Send className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!canSend 
                  ? "Type a message first" 
                  : willQueue 
                  ? "Queue message (will send when connected)" 
                  : "Send message"
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </form>
      </div>
    </TooltipProvider>
  );
}