"use client";

import * as React from "react";
import { Send, Paperclip, Smile, AlertTriangle, Wifi, WifiOff, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SafeFileUpload } from "@/components/ui/safe-file-upload";
import { useCrashSafeSocket } from "@/lib/crash-safe-socket";
import { sanitizeMessageContent } from "@/lib/utils/input-sanitizer";

interface CrashSafeMessageInputProps {
  channelId?: string;
  dmUserId?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  onMessageSent?: (content: string, attachments?: string[]) => void;
}

interface QueuedMessage {
  id: string;
  content: string;
  attachments: string[];
  timestamp: Date;
  retries: number;
  channelId?: string;
  dmUserId?: string;
}

interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_RETRY_ATTEMPTS = 3;

export const CrashSafeMessageInput: React.FC<CrashSafeMessageInputProps> = ({
  channelId,
  dmUserId,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = MAX_MESSAGE_LENGTH,
  onMessageSent,
}) => {
  // State
  const [content, setContent] = React.useState("");
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [showFileUpload, setShowFileUpload] = React.useState(false);
  const [validation, setValidation] = React.useState<ValidationState>({
    isValid: true,
    errors: [],
    warnings: [],
  });
  const [queuedMessages, setQueuedMessages] = React.useState<QueuedMessage[]>([]);
  const [lastActivity, setLastActivity] = React.useState<Date>(new Date());

  // Refs
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const compositionRef = React.useRef(false);

  // Socket connection
  const { socket, connectionState, isConnected } = useCrashSafeSocket();

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      try {
        textarea.style.height = 'auto';
        const scrollHeight = Math.min(textarea.scrollHeight, 200); // Max height of ~8 lines
        textarea.style.height = `${scrollHeight}px`;
      } catch (error) {
        console.error('Error adjusting textarea height:', error);
      }
    };

    adjustHeight();
  }, [content]);

  // Validate message content
  React.useEffect(() => {
    try {
      if (!content.trim()) {
        setValidation({
          isValid: true,
          errors: [],
          warnings: [],
        });
        return;
      }

      const result = sanitizeMessageContent(content);
      setValidation({
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
      });
    } catch (error) {
      console.error('Error validating message content:', error);
      setValidation({
        isValid: false,
        errors: ['Failed to validate message content'],
        warnings: [],
      });
    }
  }, [content]);

  // Handle typing indicators
  React.useEffect(() => {
    try {
      if (!isConnected || (!channelId && !dmUserId)) return;

      if (content.trim() && !isTyping && !compositionRef.current) {
        setIsTyping(true);
        if (channelId) {
          socket.emit('typing_start', channelId);
        }
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          if (channelId) {
            socket.emit('typing_stop', channelId);
          }
        }
      }, 3000);

      setLastActivity(new Date());
    } catch (error) {
      console.error('Error handling typing indicators:', error);
    }
  }, [content, isConnected, channelId, dmUserId, isTyping, socket]);

  // Process queued messages when connection is restored
  React.useEffect(() => {
    if (isConnected && queuedMessages.length > 0) {
      processQueuedMessages();
    }
  }, [isConnected, queuedMessages.length]);

  // Cleanup typing timeout
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const processQueuedMessages = React.useCallback(async () => {
    if (!isConnected || queuedMessages.length === 0) return;

    try {
      const messagesToProcess = [...queuedMessages];
      setQueuedMessages([]);

      for (const queuedMessage of messagesToProcess) {
        try {
          if (queuedMessage.channelId) {
            const success = await socket.sendMessage(
              queuedMessage.channelId, 
              queuedMessage.content, 
              queuedMessage.attachments
            );
            
            if (!success && queuedMessage.retries < MAX_RETRY_ATTEMPTS) {
              // Re-queue with increased retry count
              setQueuedMessages(prev => [...prev, {
                ...queuedMessage,
                retries: queuedMessage.retries + 1,
              }]);
            }
          } else if (queuedMessage.dmUserId) {
            const success = await socket.sendDirectMessage(
              queuedMessage.dmUserId, 
              queuedMessage.content, 
              queuedMessage.attachments
            );
            
            if (!success && queuedMessage.retries < MAX_RETRY_ATTEMPTS) {
              setQueuedMessages(prev => [...prev, {
                ...queuedMessage,
                retries: queuedMessage.retries + 1,
              }]);
            }
          }
        } catch (error) {
          console.error('Error processing queued message:', error);
          
          if (queuedMessage.retries < MAX_RETRY_ATTEMPTS) {
            setQueuedMessages(prev => [...prev, {
              ...queuedMessage,
              retries: queuedMessage.retries + 1,
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Error processing queued messages:', error);
    }
  }, [isConnected, queuedMessages, socket]);

  const handleContentChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newContent = e.target.value;
      
      // Prevent exceeding max length
      if (newContent.length <= maxLength) {
        setContent(newContent);
      }
    } catch (error) {
      console.error('Error handling content change:', error);
    }
  }, [maxLength]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    try {
      // Handle Enter key (send message)
      if (e.key === 'Enter' && !e.shiftKey && !compositionRef.current) {
        e.preventDefault();
        handleSendMessage();
        return;
      }

      // Handle Escape key (clear content)
      if (e.key === 'Escape') {
        e.preventDefault();
        setContent('');
        textareaRef.current?.blur();
        return;
      }
    } catch (error) {
      console.error('Error handling key down:', error);
    }
  }, []);

  const handleCompositionStart = React.useCallback(() => {
    compositionRef.current = true;
  }, []);

  const handleCompositionEnd = React.useCallback(() => {
    compositionRef.current = false;
  }, []);

  const handleSendMessage = React.useCallback(async () => {
    try {
      if (isSending || disabled) return;

      const trimmedContent = content.trim();
      if (!trimmedContent && attachments.length === 0) return;

      if (!validation.isValid) {
        console.warn('Cannot send invalid message:', validation.errors);
        return;
      }

      setIsSending(true);

      // Stop typing indicator
      if (isTyping && channelId) {
        socket.emit('typing_stop', channelId);
        setIsTyping(false);
      }

      // Create message object
      const messageData = {
        content: trimmedContent,
        attachments: [...attachments],
      };

      let success = false;

      if (isConnected) {
        // Try to send immediately
        try {
          if (channelId) {
            success = await socket.sendMessage(channelId, messageData.content, messageData.attachments);
          } else if (dmUserId) {
            success = await socket.sendDirectMessage(dmUserId, messageData.content, messageData.attachments);
          }
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }

      if (!success) {
        // Queue message for later if sending failed or offline
        const queuedMessage: QueuedMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: messageData.content,
          attachments: messageData.attachments,
          timestamp: new Date(),
          retries: 0,
          channelId,
          dmUserId,
        };

        setQueuedMessages(prev => [...prev, queuedMessage]);
        console.log('Message queued for later delivery');
      }

      // Clear input
      setContent('');
      setAttachments([]);
      setShowFileUpload(false);

      // Call callback
      onMessageSent?.(messageData.content, messageData.attachments);

      // Focus textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    } finally {
      setIsSending(false);
    }
  }, [
    isSending,
    disabled,
    content,
    attachments,
    validation.isValid,
    validation.errors,
    isTyping,
    channelId,
    dmUserId,
    isConnected,
    socket,
    onMessageSent,
  ]);

  const handleFileUpload = React.useCallback((files: { id: string; url: string; name: string }[]) => {
    try {
      const newAttachments = files.map(f => f.url);
      setAttachments(prev => [...prev, ...newAttachments]);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error handling file upload:', error);
    }
  }, []);

  const removeAttachment = React.useCallback((index: number) => {
    try {
      setAttachments(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing attachment:', error);
    }
  }, []);

  const clearQueuedMessages = React.useCallback(() => {
    setQueuedMessages([]);
  }, []);

  const canSend = content.trim() || attachments.length > 0;
  const isInputDisabled = disabled || isSending;

  return (
    <div className="space-y-2">
      {/* Connection status and queued messages */}
      {(!isConnected || queuedMessages.length > 0) && (
        <div className="flex items-center gap-2 p-2 bg-yellow-900/20 border border-yellow-600 rounded text-yellow-200 text-sm">
          {!isConnected ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Offline - messages will be sent when reconnected</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              <span>{queuedMessages.length} message(s) pending</span>
            </>
          )}
          {queuedMessages.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearQueuedMessages}
              className="ml-auto h-auto p-1"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* Validation errors */}
      {validation.errors.length > 0 && (
        <div className="p-2 bg-red-900/20 border border-red-600 rounded text-red-200 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Message validation failed:</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation warnings */}
      {validation.warnings.length > 0 && (
        <div className="p-2 bg-yellow-900/20 border border-yellow-600 rounded text-yellow-200 text-sm">
          {validation.warnings.map((warning, index) => (
            <div key={index}>{warning}</div>
          ))}
        </div>
      )}

      {/* File upload */}
      {showFileUpload && (
        <div className="p-4 bg-gray-600/20 border border-gray-600 rounded-lg">
          <SafeFileUpload
            onUploadComplete={handleFileUpload}
            multiple={true}
            dragAndDrop={true}
            showPreview={true}
            config={{
              maxFiles: 5,
              maxFileSize: 10 * 1024 * 1024, // 10MB
            }}
          />
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-600/20 rounded">
          {attachments.map((attachment, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm"
            >
              <span className="truncate max-w-32">
                {attachment.split('/').pop() || 'Attachment'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(index)}
                className="h-auto p-0.5 hover:bg-gray-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        <div className="flex items-end gap-2 p-3 bg-gray-700 rounded-lg border border-gray-600 focus-within:border-blue-500">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={placeholder}
            disabled={isInputDisabled}
            rows={1}
            className={cn(
              "flex-1 bg-transparent text-gray-100 placeholder-gray-400 resize-none",
              "border-none outline-none min-h-[24px] max-h-[200px]",
              "scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent",
              isInputDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ 
              fontSize: '14px', 
              lineHeight: '1.5',
              overflow: content.split('
').length > 8 ? 'auto' : 'hidden',
            }}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              {/* File upload button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    disabled={isInputDisabled}
                    className="w-8 h-8 text-gray-400 hover:text-white"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach files</p>
                </TooltipContent>
              </Tooltip>

              {/* Emoji button (placeholder) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isInputDisabled}
                    className="w-8 h-8 text-gray-400 hover:text-white"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add emoji</p>
                </TooltipContent>
              </Tooltip>

              {/* Send button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!canSend || !validation.isValid || isInputDisabled}
                    size="icon"
                    className={cn(
                      "w-8 h-8 ml-1",
                      canSend && validation.isValid && !isInputDisabled
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-600 text-gray-400"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isConnected ? 'Send message' : 'Queue message'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Character count */}
        <div className="absolute bottom-1 right-12 text-xs text-gray-500">
          {content.length}/{maxLength}
        </div>
      </div>
    </div>
  );
};