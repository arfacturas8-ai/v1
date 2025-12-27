import React from 'react';
import { colors, radii, spacing, shadows } from '../tokens';
import { Avatar, Button, IconButton, Text } from '../atoms';

interface ComposerProps {
  currentUser?: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  placeholder?: string;
  maxLength?: number;
  onPost: (content: string) => void | Promise<void>;
  onCancel?: () => void;
  initialValue?: string;
  autoFocus?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Composer: React.FC<ComposerProps> = ({
  currentUser,
  placeholder = "What's happening?",
  maxLength = 500,
  onPost,
  onCancel,
  initialValue = '',
  autoFocus = false,
  className = '',
  style,
}) => {
  const [content, setContent] = React.useState(initialValue);
  const [isPosting, setIsPosting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handlePost = async () => {
    if (content.trim().length === 0 || content.length > maxLength) return;

    setIsPosting(true);
    try {
      await onPost(content);
      setContent('');
    } catch (error) {
      console.error('Failed to post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > maxLength;
  const canPost = content.trim().length > 0 && !isOverLimit && !isPosting;

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#FAFAFA',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #E5E5E5',
    ...style,
  };

  const contentAreaStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  };

  const textareaWrapperStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '80px',
    maxHeight: '300px',
    padding: '0',
    fontSize: '15px',
    lineHeight: '1.5',
    color: '#000000',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0',
    outline: 'none',
    resize: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: currentUser ? '52px' : '0', // Align with textarea (avatar width + gap)
    paddingTop: '12px',
    borderTop: '1px solid #E5E5E5',
  };

  const toolbarLeftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const toolbarRightStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const charCountStyle: React.CSSProperties = {
    fontSize: '13px',
    color: isOverLimit ? '#EF4444' : '#999999',
    fontWeight: isOverLimit ? '600' : '400',
  };

  return (
    <div className={className} style={containerStyle}>
      {/* Content area */}
      <div style={contentAreaStyle}>
        {currentUser && (
          <Avatar
            src={currentUser.avatar}
            username={currentUser.username}
            size="md"
          />
        )}

        <div style={textareaWrapperStyle}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={textareaStyle}
            maxLength={maxLength + 50} // Allow typing a bit over to show error
          />
        </div>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={toolbarLeftStyle}>
          <IconButton
            icon={<span>🖼️</span>}
            variant="ghost"
            size="sm"
            title="Add media"
            onClick={() => {
              // TODO: Media upload
            }}
          />
          <IconButton
            icon={<span>📊</span>}
            variant="ghost"
            size="sm"
            title="Create poll"
            onClick={() => {
              // TODO: Poll creation
            }}
          />
          <IconButton
            icon={<span>😊</span>}
            variant="ghost"
            size="sm"
            title="Add emoji"
            onClick={() => {
              // TODO: Emoji picker
            }}
          />
        </div>

        <div style={toolbarRightStyle}>
          <Text style={charCountStyle}>
            {charCount}/{maxLength}
          </Text>

          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isPosting}
            >
              Cancel
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handlePost}
            disabled={!canPost}
            loading={isPosting}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Composer;
