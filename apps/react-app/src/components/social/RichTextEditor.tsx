/**
 * CRYB Design System - Rich Text Editor Component
 * Modern editor with markdown support, code blocks, and media embeds
 */

import React, { useState, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Code,
  Image as ImageIcon,
  Quote,
  Heading2,
  Eye,
  EyeOff,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button, IconButton, ButtonGroup } from '../ui/button';
import { Card } from '../ui/card';

export interface RichTextEditorProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Show preview toggle */
  showPreview?: boolean;
  /** Show formatting toolbar */
  showToolbar?: boolean;
  /** Allow media uploads */
  allowMedia?: boolean;
  /** Media upload handler */
  onMediaUpload?: (file: File) => Promise<string>;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: string;
  /** Character limit */
  maxLength?: number;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write something...',
  minHeight = 200,
  maxHeight = 600,
  showPreview = true,
  showToolbar = true,
  allowMedia = true,
  onMediaUpload,
  disabled = false,
  error,
  maxLength,
  autoFocus = false,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Insert text at cursor position
  const insertText = useCallback(
    (before: string, after: string = '', placeholder: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const replacement = before + (selectedText || placeholder) + after;

      const newValue = value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);

      // Reset cursor position
      setTimeout(() => {
        const newCursorPos = start + before.length + (selectedText || placeholder).length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    },
    [value, onChange]
  );

  // Toolbar actions
  const toolbarActions = [
    {
      icon: <Bold style={{
  width: '16px',
  height: '16px'
}} />,
      label: 'Bold',
      action: () => insertText('**', '**', 'bold text'),
      shortcut: 'Ctrl+B',
    },
    {
      icon: <Italic style={{
  width: '16px',
  height: '16px'
}} />,
      label: 'Italic',
      action: () => insertText('*', '*', 'italic text'),
      shortcut: 'Ctrl+I',
    },
    {
      icon: <Heading2 style={{
  width: '16px',
  height: '16px'
}} />,
      label: 'Heading',
      action: () => insertText('## ', '', 'Heading'),
    },
    {
      icon: <LinkIcon style={{
  width: '16px',
  height: '16px'
}} />,
      label: 'Link',
      action: () => insertText('[', '](url)', 'link text'),
    },
    {
      icon: <Quote style={{
  width: '16px',
  height: '16px'
}} />,
      label: 'Quote',
      action: () => insertText('> ', '', 'quoted text'),
    },
    {
      icon: <Code style={{
  width: '16px',
  height: '16px'
}} />,
      label: 'Code',
      action: () => insertText('`', '`', 'code'),
    },
    {
      icon: <List style={{
  width: '16px',
  height: '16px'
}} />,
      label: 'Bullet List',
      action: () => insertText('- ', '', 'list item'),
    },
    {
      icon: <ListOrdered style={{
  width: '16px',
  height: '16px'
}} />,
      label: 'Numbered List',
      action: () => insertText('1. ', '', 'list item'),
    },
  ];

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertText('**', '**', 'bold text');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertText('*', '*', 'italic text');
      } else if (e.key === 'k') {
        e.preventDefault();
        insertText('[', '](url)', 'link text');
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!onMediaUpload) return;

    try {
      const url = await onMediaUpload(file);
      insertText(`![${file.name}](${url})`);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    imageFiles.forEach((file) => handleFileUpload(file));
  };

  // Simple markdown preview renderer
  const renderPreview = (text: string): string => {
    let html = text;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2 mt-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3 mt-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-4">$1</h1>');

    // Bold and Italic
    html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full h-auto my-4" />');

    // Code blocks
    html = html.replace(/```([^`]+)```/g, '<pre class="bg-muted rounded-lg p-4 my-4 overflow-x-auto"><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm">$1</code>');

    // Quotes
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-2">$1</blockquote>');

    // Lists
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-6 list-disc">$1</li>');

    // Line breaks
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  const characterCount = value.length;
  const isOverLimit = maxLength ? characterCount > maxLength : false;

  return (
    <div
      className={cn(
        'relative',
        isFullscreen && 'fixed inset-0 z-50 bg-background p-6'
      )}
    >
      <Card
        variant="outline"
        className={cn(
          'overflow-hidden',
          error && 'border-destructive',
          isDragging && 'border-primary border-2'
        )}
      >
        {/* Toolbar */}
        {showToolbar && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
            <ButtonGroup size="sm" variant="ghost" attached>
              {toolbarActions.map((action, index) => (
                <IconButton
                  key={index}
                  icon={action.icon}
                  onClick={action.action}
                  disabled={disabled}
                  aria-label={action.label}
                  title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
                  size="icon-sm"
                />
              ))}
            </ButtonGroup>

            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
              {allowMedia && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{
  display: 'none'
}}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <IconButton
                    icon={<ImageIcon style={{
  width: '16px',
  height: '16px'
}} />}
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    aria-label="Upload image"
                    title="Upload image"
                  />
                </>
              )}

              {showPreview && (
                <IconButton
                  icon={isPreview ? <EyeOff style={{
  width: '16px',
  height: '16px'
}} /> : <Eye style={{
  width: '16px',
  height: '16px'
}} />}
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsPreview(!isPreview)}
                  disabled={disabled}
                  aria-label={isPreview ? 'Hide preview' : 'Show preview'}
                  title={isPreview ? 'Hide preview' : 'Show preview'}
                />
              )}

              <IconButton
                icon={
                  isFullscreen ? (
                    <Minimize2 style={{
  width: '16px',
  height: '16px'
}} />
                  ) : (
                    <Maximize2 style={{
  width: '16px',
  height: '16px'
}} />
                  )
                }
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                disabled={disabled}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              />
            </div>
          </div>
        )}

        {/* Editor / Preview */}
        <div
          style={{
  position: 'relative'
}}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isPreview ? (
            <div
              style={{
  padding: '16px',
  minHeight,
  maxHeight
}}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderPreview(value)) }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              autoFocus={autoFocus}
              className={cn(
                'w-full px-4 py-3 bg-transparent resize-none',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none',
                'font-mono text-sm leading-relaxed'
              )}
              style={{ minHeight, maxHeight }}
            />
          )}

          {/* Drag overlay */}
          
            {isDragging && (
              <div
                style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
              >
                <div style={{
  textAlign: 'center'
}}>
                  <ImageIcon style={{
  width: '48px',
  height: '48px'
}} />
                  <p style={{
  fontWeight: '500'
}}>Drop images here</p>
                </div>
              </div>
            )}
          
        </div>

        {/* Footer */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
          <div className="text-muted-foreground">
            {isPreview ? (
              <span>Preview mode</span>
            ) : (
              <span>Markdown supported</span>
            )}
          </div>

          {maxLength && (
            <div
              className={cn(
                'font-medium',
                isOverLimit ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {characterCount} / {maxLength}
            </div>
          )}
        </div>
      </Card>

      {error && (
        <p
          className="text-sm text-destructive mt-2"
        >
          {typeof error === 'string' ? error : 'An error occurred'}
        </p>
      )}
    </div>
  );
};

RichTextEditor.displayName = 'RichTextEditor';
