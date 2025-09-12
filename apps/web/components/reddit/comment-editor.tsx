'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, X, AlertTriangle, Bold, Italic, Link, List, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRedditErrorReporting } from '../error-boundaries/reddit-error-boundary';

interface CommentEditorProps {
  initialContent?: string;
  onSubmit: (content: string) => Promise<any>;
  onCancel: () => void;
  placeholder?: string;
  disabled?: boolean;
  isEditing?: boolean;
  maxLength?: number;
  className?: string;
}

interface EditorState {
  content: string;
  isSubmitting: boolean;
  error: string | null;
  showPreview: boolean;
  cursorPosition: number;
}

const DEFAULT_MAX_LENGTH = 10000;
const MIN_CONTENT_LENGTH = 1;

export function CommentEditor({
  initialContent = '',
  onSubmit,
  onCancel,
  placeholder = 'What are your thoughts?',
  disabled = false,
  isEditing = false,
  maxLength = DEFAULT_MAX_LENGTH,
  className
}: CommentEditorProps) {
  const { reportError } = useRedditErrorReporting('comment-editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<EditorState>({
    content: initialContent,
    isSubmitting: false,
    error: null,
    showPreview: false,
    cursorPosition: 0,
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [state.content]);

  // Handle content change with validation
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;

    if (newContent.length <= maxLength) {
      setState(prev => ({
        ...prev,
        content: newContent,
        cursorPosition: cursorPos,
        error: null,
      }));
    }
  }, [maxLength]);

  // Handle submission with validation and error handling
  const handleSubmit = useCallback(async () => {
    const content = state.content.trim();

    // Validate content
    if (content.length < MIN_CONTENT_LENGTH) {
      setState(prev => ({
        ...prev,
        error: 'Comment cannot be empty'
      }));
      return;
    }

    if (content.length > maxLength) {
      setState(prev => ({
        ...prev,
        error: `Comment is too long. Maximum ${maxLength} characters allowed.`
      }));
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await onSubmit(content);
      setState(prev => ({
        ...prev,
        content: '',
        isSubmitting: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit comment';
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
      }));
      
      reportError(error as Error, { 
        action: isEditing ? 'edit' : 'create',
        contentLength: content.length 
      });
    }
  }, [state.content, maxLength, onSubmit, isEditing, reportError]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }

    // Handle tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newContent = state.content.substring(0, start) + '    ' + state.content.substring(end);
      setState(prev => ({ ...prev, content: newContent }));
      
      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  }, [state.content, handleSubmit, onCancel]);

  // Markdown formatting helpers
  const insertMarkdown = useCallback((prefix: string, suffix: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = state.content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = prefix + textToInsert + suffix;
    
    const newContent = 
      state.content.substring(0, start) + 
      newText + 
      state.content.substring(end);

    setState(prev => ({ ...prev, content: newContent }));

    // Set cursor position
    setTimeout(() => {
      if (textarea) {
        const newPos = selectedText ? start + newText.length : start + prefix.length + textToInsert.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
      }
    }, 0);
  }, [state.content]);

  // Character count styling
  const getCharCountColor = () => {
    const ratio = state.content.length / maxLength;
    if (ratio > 0.9) return 'text-red-500';
    if (ratio > 0.8) return 'text-yellow-600';
    return 'text-gray-500';
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Error display */}
      {state.error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {state.error}
          </div>
        </div>
      )}

      {/* Editor tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setState(prev => ({ ...prev, showPreview: false }))}
          className={cn(
            "px-3 py-2 text-sm border-b-2 transition-colors",
            !state.showPreview 
              ? "border-blue-500 text-blue-600 bg-blue-50" 
              : "border-transparent text-gray-600 hover:text-gray-800"
          )}
        >
          Write
        </button>
        <button
          onClick={() => setState(prev => ({ ...prev, showPreview: true }))}
          className={cn(
            "px-3 py-2 text-sm border-b-2 transition-colors",
            state.showPreview 
              ? "border-blue-500 text-blue-600 bg-blue-50" 
              : "border-transparent text-gray-600 hover:text-gray-800"
          )}
          disabled={!state.content.trim()}
        >
          Preview
        </button>
      </div>

      {/* Content area */}
      <div className="border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {!state.showPreview ? (
          <>
            {/* Formatting toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7"
                onClick={() => insertMarkdown('**', '**', 'bold text')}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-3 w-3" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7"
                onClick={() => insertMarkdown('*', '*', 'italic text')}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-3 w-3" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7"
                onClick={() => insertMarkdown('[', '](url)', 'link text')}
                title="Link"
              >
                <Link className="h-3 w-3" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7"
                onClick={() => insertMarkdown('- ', '', 'list item')}
                title="Bullet List"
              >
                <List className="h-3 w-3" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7"
                onClick={() => insertMarkdown('> ', '', 'quoted text')}
                title="Quote"
              >
                <Quote className="h-3 w-3" />
              </Button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={state.content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || state.isSubmitting}
              className="w-full min-h-[100px] p-3 border-0 rounded-b-lg resize-none focus:outline-none"
              style={{ minHeight: '100px', maxHeight: '400px' }}
            />
          </>
        ) : (
          /* Preview area */
          <div className="p-3 min-h-[100px] bg-gray-50 rounded-lg">
            {state.content.trim() ? (
              <div className="prose prose-sm max-w-none">
                <CommentPreview content={state.content} />
              </div>
            ) : (
              <div className="text-gray-500 italic">Nothing to preview</div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <span className={getCharCountColor()}>
            {state.content.length}/{maxLength}
          </span>
          {isEditing && (
            <span className="ml-2">• Press Ctrl+Enter to save</span>
          )}
          {!isEditing && (
            <span className="ml-2">• Press Ctrl+Enter to post</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={state.isSubmitting}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              disabled || 
              state.isSubmitting || 
              state.content.trim().length < MIN_CONTENT_LENGTH ||
              state.content.length > maxLength
            }
            className="min-w-[80px]"
          >
            {state.isSubmitting ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                {isEditing ? 'Save' : 'Post'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Simple markdown preview component
function CommentPreview({ content }: { content: string }) {
  // Basic markdown rendering (in production, use a proper markdown parser)
  const renderContent = useCallback((text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br>');
  }, []);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: renderContent(content),
      }}
    />
  );
}