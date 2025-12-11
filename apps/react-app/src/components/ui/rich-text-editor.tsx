/**
 * CRYB Design System - Rich Text Editor Component
 * Advanced rich text editor with formatting, mentions, and emoji support
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Smile,
  AtSign,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Type
} from 'lucide-react';
import { Button, IconButton } from './button';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import * as Separator from '@radix-ui/react-separator';
// ===== EDITOR VARIANTS =====
const editorVariants = cva([
  'bg-background border border-border rounded-lg overflow-hidden',
  'transition-all duration-200',
], {
  variants: {
    variant: {
      default: 'shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring',
      minimal: 'border-0 shadow-none',
      outlined: 'border-2',
    },
    size: {
      sm: 'min-h-[120px]',
      default: 'min-h-[200px]',
      lg: 'min-h-[300px]',
      xl: 'min-h-[400px]',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

// ===== EDITOR INTERFACES =====
export interface RichTextEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Editor variant */
  variant?: VariantProps<typeof editorVariants>['variant'];
  /** Editor size */
  size?: VariantProps<typeof editorVariants>['size'];
  /** Initial content */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Change handler */
  onChange?: (content: string, html: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether editor is disabled */
  disabled?: boolean;
  /** Whether editor is read-only */
  readOnly?: boolean;
  /** Show character count */
  showCharCount?: boolean;
  /** Maximum characters */
  maxLength?: number;
  /** Show word count */
  showWordCount?: boolean;
  /** Enable mentions */
  enableMentions?: boolean;
  /** Enable hashtags */
  enableHashtags?: boolean;
  /** Enable emoji picker */
  enableEmoji?: boolean;
  /** Enable media uploads */
  enableMedia?: boolean;
  /** Enable formatting toolbar */
  showToolbar?: boolean;
  /** Custom toolbar items */
  toolbarItems?: string[];
  /** Enable auto-save */
  autoSave?: boolean;
  /** Auto-save interval (ms) */
  autoSaveInterval?: number;
  /** Mention search handler */
  onMentionSearch?: (query: string) => Promise<MentionUser[]>;
  /** Media upload handler */
  onMediaUpload?: (file: File) => Promise<string>;
  /** Auto-save handler */
  onAutoSave?: (content: string) => void;
  /** Focus handler */
  onFocus?: () => void;
  /** Blur handler */
  onBlur?: () => void;
}

export interface MentionUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export interface EmojiItem {
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
}

// ===== FORMAT COMMANDS =====
const formatCommands = {
  bold: () => document.execCommand('bold'),
  italic: () => document.execCommand('italic'),
  underline: () => document.execCommand('underline'),
  strikethrough: () => document.execCommand('strikeThrough'),
  code: () => document.execCommand('formatBlock', false, 'pre'),
  h1: () => document.execCommand('formatBlock', false, 'h1'),
  h2: () => document.execCommand('formatBlock', false, 'h2'),
  h3: () => document.execCommand('formatBlock', false, 'h3'),
  paragraph: () => document.execCommand('formatBlock', false, 'p'),
  unorderedList: () => document.execCommand('insertUnorderedList'),
  orderedList: () => document.execCommand('insertOrderedList'),
  quote: () => document.execCommand('formatBlock', false, 'blockquote'),
  alignLeft: () => document.execCommand('justifyLeft'),
  alignCenter: () => document.execCommand('justifyCenter'),
  alignRight: () => document.execCommand('justifyRight'),
  alignJustify: () => document.execCommand('justifyFull'),
  undo: () => document.execCommand('undo'),
  redo: () => document.execCommand('redo'),
  createLink: (url: string) => document.execCommand('createLink', false, url),
  insertImage: (url: string) => document.execCommand('insertImage', false, url),
};

// ===== TOOLBAR ITEMS =====
const toolbarItems = [
  { id: 'bold', icon: Bold, label: 'Bold', shortcut: 'Ctrl+B' },
  { id: 'italic', icon: Italic, label: 'Italic', shortcut: 'Ctrl+I' },
  { id: 'underline', icon: Underline, label: 'Underline', shortcut: 'Ctrl+U' },
  { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough' },
  { id: 'separator1', type: 'separator' },
  { id: 'h1', icon: Heading1, label: 'Heading 1' },
  { id: 'h2', icon: Heading2, label: 'Heading 2' },
  { id: 'h3', icon: Heading3, label: 'Heading 3' },
  { id: 'paragraph', icon: Type, label: 'Paragraph' },
  { id: 'separator2', type: 'separator' },
  { id: 'unorderedList', icon: List, label: 'Bullet List' },
  { id: 'orderedList', icon: ListOrdered, label: 'Numbered List' },
  { id: 'quote', icon: Quote, label: 'Quote' },
  { id: 'code', icon: Code, label: 'Code Block' },
  { id: 'separator3', type: 'separator' },
  { id: 'alignLeft', icon: AlignLeft, label: 'Align Left' },
  { id: 'alignCenter', icon: AlignCenter, label: 'Align Center' },
  { id: 'alignRight', icon: AlignRight, label: 'Align Right' },
  { id: 'alignJustify', icon: AlignJustify, label: 'Justify' },
  { id: 'separator4', type: 'separator' },
  { id: 'link', icon: Link, label: 'Insert Link', shortcut: 'Ctrl+K' },
  { id: 'image', icon: Image, label: 'Insert Image' },
  { id: 'emoji', icon: Smile, label: 'Insert Emoji' },
  { id: 'separator5', type: 'separator' },
  { id: 'undo', icon: Undo, label: 'Undo', shortcut: 'Ctrl+Z' },
  { id: 'redo', icon: Redo, label: 'Redo', shortcut: 'Ctrl+Y' },
];

// ===== EMOJI DATA =====
const emojiCategories = {
  'smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'],
  'people': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌', '🤞', '🤟'],
  'animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨'],
  'food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝', '🍅', '🥥'],
  'travel': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐'],
  'objects': ['⌚', '📱', '📲', '💻', '⌨', '🖥', '🖨', '🖱', '🖲', '🕹'],
};

// ===== EDITOR TOOLBAR COMPONENT =====
const EditorToolbar: React.FC<{
  onCommand: (command: string, value?: string) => void;
  enableMentions?: boolean;
  enableEmoji?: boolean;
  enableMedia?: boolean;
  onMentionClick?: () => void;
  onEmojiClick?: () => void;
  onMediaClick?: () => void;
}> = ({ 
  onCommand, 
  enableMentions, 
  enableEmoji, 
  enableMedia,
  onMentionClick,
  onEmojiClick,
  onMediaClick
}) => {
  const [showLinkDialog, setShowLinkDialog] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');

  const handleCommand = (command: string) => {
    if (command === 'link') {
      setShowLinkDialog(true);
    } else if (command === 'emoji') {
      onEmojiClick?.();
    } else if (command === 'image') {
      onMediaClick?.();
    } else {
      onCommand(command);
    }
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      onCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '8px'
}}>
      {toolbarItems.map((item) => {
        if (item.type === 'separator') {
          return (
            <Separator.Root
              key={item.id}
              orientation="vertical"
              style={{
  height: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginLeft: '4px',
  marginRight: '4px'
}}
            />
          );
        }

        const IconComponent = item.icon!;
        
        return (
          <IconButton
            key={item.id}
            icon={<IconComponent />}
            variant="ghost"
            size="icon-sm"
            onClick={() => handleCommand(item.id)}
            aria-label={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}`}
            title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}`}
          />
        );
      })}

      {/* Additional Features */}
      {enableMentions && (
        <IconButton
          icon={<AtSign />}
          variant="ghost"
          size="icon-sm"
          onClick={onMentionClick}
          aria-label="Insert Mention"
          title="Insert Mention (@)"
        />
      )}

      {/* Link Dialog */}
      <Popover.Root open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <Popover.Content style={{
  width: '320px',
  padding: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
          <div className="space-y-3">
            <h4 style={{
  fontWeight: '500'
}}>Insert Link</h4>
            <input
              type="url"
              placeholder="Enter URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLinkSubmit();
                }
                if (e.key === 'Escape') {
                  setShowLinkDialog(false);
                }
              }}
              autoFocus
            />
            <div style={{
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px'
}}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkDialog(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleLinkSubmit}
                disabled={!linkUrl.trim()}
              >
                Insert
              </Button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};

// ===== EMOJI PICKER COMPONENT =====
const EmojiPicker: React.FC<{
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}> = ({ onEmojiSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = React.useState('smileys');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredEmojis = React.useMemo(() => {
    if (!searchQuery) {
      return emojiCategories[selectedCategory as keyof typeof emojiCategories] || [];
    }
    
    return Object.values(emojiCategories)
      .flat()
      .filter(emoji => 
        emoji.includes(searchQuery.toLowerCase()) ||
        // This would be better with proper emoji metadata
        emoji.normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchQuery)
      );
  }, [selectedCategory, searchQuery]);

  return (
    <div
      style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px',
  width: '320px'
}}
    >
      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
        />
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div style={{
  display: 'flex',
  gap: '4px'
}}>
          {Object.keys(emojiCategories).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors',
                selectedCategory === category
                  ? 'bg-cryb-primary text-cryb-primary-foreground'
                  : 'bg-muted hover:bg-accent'
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div style={{
  display: 'grid',
  gap: '4px'
}}>
        {filteredEmojis.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            style={{
  width: '32px',
  height: '32px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
          >
            {emoji}
          </button>
        ))}
      </div>

      {filteredEmojis.length === 0 && (
        <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
          No emojis found
        </div>
      )}
    </div>
  );
};

// ===== MENTION PICKER COMPONENT =====
const MentionPicker: React.FC<{
  users: MentionUser[];
  onUserSelect: (user: MentionUser) => void;
  onClose: () => void;
  loading?: boolean;
}> = ({ users, onUserSelect, onClose, loading }) => {
  return (
    <div
      style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
    >
      {loading ? (
        <div style={{
  padding: '16px',
  textAlign: 'center'
}}>
        </div>
      ) : users.length > 0 ? (
        <div className="max-h-48 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onUserSelect(user);
                onClose();
              }}
              style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  textAlign: 'left'
}}
            >
              <div style={{
  height: '32px',
  width: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '500'
}}>
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.displayName}
                    style={{
  height: '32px',
  width: '32px',
  borderRadius: '50%'
}} 
                  />
                ) : (
                  user.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{
  fontWeight: '500'
}}>{user.displayName}</div>
                <div className="text-xs text-muted-foreground">@{user.username}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{
  padding: '16px',
  textAlign: 'center'
}}>
          No users found
        </div>
      )}
    </div>
  );
};

// ===== EDITOR FOOTER COMPONENT =====
const EditorFooter: React.FC<{
  characterCount?: number;
  wordCount?: number;
  maxLength?: number;
  showCharCount?: boolean;
  showWordCount?: boolean;
  autoSave?: boolean;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}> = ({ 
  characterCount = 0, 
  wordCount = 0, 
  maxLength, 
  showCharCount, 
  showWordCount,
  autoSave,
  autoSaveStatus = 'idle'
}) => {
  if (!showCharCount && !showWordCount && !autoSave) {
    return null;
  }

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
        {showCharCount && (
          <span className={cn(
            maxLength && characterCount > maxLength && 'text-destructive'
          )}>
            {characterCount}{maxLength ? ` / ${maxLength}` : ''} characters
          </span>
        )}
        {showWordCount && (
          <span>{wordCount} words</span>
        )}
      </div>

      {autoSave && (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
          {autoSaveStatus === 'saving' && (
            <>
              <div style={{
  height: '8px',
  width: '8px',
  borderRadius: '50%'
}} />
              <span>Saving...</span>
            </>
          )}
          {autoSaveStatus === 'saved' && (
            <>
              <div style={{
  height: '8px',
  width: '8px',
  borderRadius: '50%'
}} />
              <span>Saved</span>
            </>
          )}
          {autoSaveStatus === 'error' && (
            <>
              <div style={{
  height: '8px',
  width: '8px',
  borderRadius: '50%'
}} />
              <span>Save failed</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ===== MAIN RICH TEXT EDITOR COMPONENT =====
const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      className,
      variant,
      size,
      defaultValue = '',
      value,
      onChange,
      placeholder = 'Start writing...',
      disabled = false,
      readOnly = false,
      showCharCount = false,
      maxLength,
      showWordCount = false,
      enableMentions = false,
      enableHashtags = false,
      enableEmoji = false,
      enableMedia = false,
      showToolbar = true,
      toolbarItems: customToolbarItems,
      autoSave = false,
      autoSaveInterval = 5000,
      onMentionSearch,
      onMediaUpload,
      onAutoSave,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const [content, setContent] = React.useState(defaultValue);
    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
    const [showMentionPicker, setShowMentionPicker] = React.useState(false);
    const [mentionUsers, setMentionUsers] = React.useState<MentionUser[]>([]);
    const [mentionLoading, setMentionLoading] = React.useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Character and word counting
    const characterCount = content.replace(/<[^>]*>/g, '').length;
    const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;

    // Auto-save functionality
    React.useEffect(() => {
      if (!autoSave || !onAutoSave) return;

      const timer = setTimeout(() => {
        if (content && autoSaveStatus === 'idle') {
          setAutoSaveStatus('saving');
          try {
            onAutoSave(content);
            setAutoSaveStatus('saved');
            setTimeout(() => setAutoSaveStatus('idle'), 2000);
          } catch (error) {
            setAutoSaveStatus('error');
            setTimeout(() => setAutoSaveStatus('idle'), 3000);
          }
        }
      }, autoSaveInterval);

      return () => clearTimeout(timer);
    }, [content, autoSave, autoSaveInterval, onAutoSave, autoSaveStatus]);

    // Controlled value support
    React.useEffect(() => {
      if (value !== undefined && value !== content) {
        setContent(value);
        if (editorRef.current) {
          editorRef.current.innerHTML = value;
        }
      }
    }, [value, content]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const newContent = e.currentTarget.innerHTML;
      setContent(newContent);
      onChange?.(e.currentTarget.textContent || '', newContent);
      setAutoSaveStatus('idle');
    };

    const handleCommand = (command: string, commandValue?: string) => {
      editorRef.current?.focus();
      
      if (command in formatCommands) {
        (formatCommands as any)[command](commandValue);
      }
    };

    const handleEmojiSelect = (emoji: string) => {
      document.execCommand('insertText', false, emoji);
      editorRef.current?.focus();
    };

    const handleMentionSelect = (user: MentionUser) => {
      document.execCommand('insertText', false, `@${user.username} `);
      editorRef.current?.focus();
    };

    const handleMentionSearch = async (query: string) => {
      if (!onMentionSearch) return;
      
      setMentionLoading(true);
      try {
        const users = await onMentionSearch(query);
        setMentionUsers(users);
      } catch (error) {
        setMentionUsers([]);
      } finally {
        setMentionLoading(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Handle keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            handleCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            handleCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            handleCommand('underline');
            break;
          case 'k':
            e.preventDefault();
            handleCommand('link');
            break;
          case 'z':
            e.preventDefault();
            handleCommand(e.shiftKey ? 'redo' : 'undo');
            break;
        }
      }

      // Handle mention trigger
      if (enableMentions && e.key === '@') {
        setShowMentionPicker(true);
        handleMentionSearch('');
      }

      // Close pickers on escape
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setShowMentionPicker(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(editorVariants({ variant, size }), className)}
        {...props}
      >
        {/* Toolbar */}
        {showToolbar && !readOnly && (
          <EditorToolbar
            onCommand={handleCommand}
            enableMentions={enableMentions}
            enableEmoji={enableEmoji}
            enableMedia={enableMedia}
            onMentionClick={() => {
              setShowMentionPicker(true);
              handleMentionSearch('');
            }}
            onEmojiClick={() => setShowEmojiPicker(true)}
            onMediaClick={() => {
              // Handle media upload
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,video/*';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file && onMediaUpload) {
                  try {
                    const url = await onMediaUpload(file);
                    handleCommand('insertImage', url);
                  } catch (error) {
                    console.error('Media upload failed:', error);
                  }
                }
              };
              input.click();
            }}
          />
        )}

        {/* Editor */}
        <div style={{
  position: 'relative'
}}>
          <div
            ref={editorRef}
            contentEditable={!disabled && !readOnly}
            className={cn(
              'p-4 min-h-[inherit] outline-none prose prose-sm max-w-none',
              'focus:ring-0 focus:outline-none',
              '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4',
              '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3',
              '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2',
              '[&_p]:my-2 [&_p]:leading-relaxed',
              '[&_ul]:my-2 [&_ol]:my-2',
              '[&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-4 [&_blockquote]:italic',
              '[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-sm',
              '[&_a]:text-cryb-primary [&_a]:underline',
              '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded',
              disabled && 'opacity-50 cursor-not-allowed',
              readOnly && 'cursor-default'
            )}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            data-placeholder={placeholder}
            style={{
              minHeight: 'inherit',
            }}
            suppressContentEditableWarning
          />

          {/* Placeholder */}
          {!content && (
            <div style={{
  position: 'absolute'
}}>
              {placeholder}
            </div>
          )}

          {/* Emoji Picker */}
          
            {showEmojiPicker && (
              <div style={{
  position: 'absolute'
}}>
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          

          {/* Mention Picker */}
          
            {showMentionPicker && (
              <div style={{
  position: 'absolute'
}}>
                <MentionPicker
                  users={mentionUsers}
                  onUserSelect={handleMentionSelect}
                  onClose={() => setShowMentionPicker(false)}
                  loading={mentionLoading}
                />
              </div>
            )}
          
        </div>

        {/* Footer */}
        <EditorFooter
          characterCount={characterCount}
          wordCount={wordCount}
          maxLength={maxLength}
          showCharCount={showCharCount}
          showWordCount={showWordCount}
          autoSave={autoSave}
          autoSaveStatus={autoSaveStatus}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

// ===== EXPORTS =====
export { 
  RichTextEditor, 
  EditorToolbar, 
  EmojiPicker, 
  MentionPicker,
  EditorFooter
};

export type { 
  RichTextEditorProps, 
  MentionUser, 
  EmojiItem 
};