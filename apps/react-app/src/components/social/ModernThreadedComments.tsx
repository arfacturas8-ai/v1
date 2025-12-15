/**
 * CRYB Design System - Modern Threaded Comments Component
 * Real-time nested comment system with animations
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Reply,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Flag,
  Edit,
  Trash,
  Check,
  X,
  Clock,
  Award,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button, IconButton } from '../ui/button';
import { Card } from '../ui/card';
import { VoteButtons } from './VoteButtons';
import { RichTextEditor } from './RichTextEditor';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  verified?: boolean;
  badges?: string[];
}

export interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  score: number;
  userVote?: 'up' | 'down' | null;
  createdAt: Date;
  edited?: Date;
  replies?: Comment[];
  depth?: number;
  isOP?: boolean;
  isMod?: boolean;
  awards?: number;
}

export interface ModernThreadedCommentsProps {
  comments: Comment[];
  currentUserId?: string;
  maxDepth?: number;
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onVote?: (commentId: string, voteType: 'up' | 'down' | null) => void;
  onReport?: (commentId: string) => void;
  sortBy?: 'best' | 'new' | 'top' | 'controversial';
  onSortChange?: (sortBy: string) => void;
}

interface CommentItemProps {
  comment: Comment;
  depth: number;
  maxDepth: number;
  currentUserId?: string;
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onVote?: (commentId: string, voteType: 'up' | 'down' | null) => void;
  onReport?: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth,
  maxDepth,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onVote,
  onReport,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [isHovered, setIsHovered] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const isAuthor = currentUserId === comment.author.id;
  const showReplyButton = depth < maxDepth;

  const handleReply = () => {
    if (!replyContent.trim()) return;
    onReply?.(comment.id, replyContent.trim());
    setReplyContent('');
    setIsReplying(false);
  };

  const handleEdit = () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }
    onEdit?.(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  // Depth color coding
  const depthColors = [
    'border-l-blue-500/30',
    'border-l-green-500/30',
    'border-l-yellow-500/30',
    'border-l-purple-500/30',
    'border-l-pink-500/30',
  ];

  const borderColor = depth > 0 ? depthColors[depth % depthColors.length] : '';

  return (
    <div
      className={cn('relative', depth > 0 && 'ml-6 pl-4 border-l-2', borderColor)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        variant={isHovered ? 'outline' : 'default'}
        className={cn(
          'mb-3 transition-all duration-200',
          isCollapsed && 'opacity-60',
          depth === 0 && 'shadow-sm'
        )}
      >
        <div style={{
  padding: '12px'
}}>
          {/* Header */}
          <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
            {/* Avatar */}
            <button
              style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  overflow: 'hidden'
}}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {comment.author.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt={comment.author.displayName}
                  style={{
  width: '100%',
  height: '100%'
}}
                />
              ) : (
                <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold'
}}>
                  {comment.author.displayName[0].toUpperCase()}
                </div>
              )}
            </button>

            {/* Author Info */}
            <div style={{
  flex: '1'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
}}>
                <button
                  style={{
  fontWeight: '600'
}}
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {comment.author.displayName}
                </button>

                {comment.author.verified && (
                  <span className="text-primary text-xs" title="Verified">
                    ✓
                  </span>
                )}

                {comment.isOP && (
                  <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%',
  fontWeight: '500'
}}>
                    OP
                  </span>
                )}

                {comment.isMod && (
                  <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%',
  fontWeight: '500'
}}>
                    MOD
                  </span>
                )}

                {comment.author.badges?.map((badge, i) => (
                  <span
                    key={i}
                    style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%',
  fontWeight: '500'
}}
                  >
                    {badge}
                  </span>
                ))}

                <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  <Clock style={{
  width: '12px',
  height: '12px'
}} />
                  {formatTimeAgo(comment.createdAt)}
                </span>

                {comment.edited && (
                  <span className="text-xs text-muted-foreground italic" title={`Edited ${formatTimeAgo(comment.edited)}`}>
                    (edited)
                  </span>
                )}

                {hasReplies && (
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}
                  >
                    {isCollapsed ? (
                      <ChevronRight style={{
  width: '12px',
  height: '12px'
}} />
                    ) : (
                      <ChevronDown style={{
  width: '12px',
  height: '12px'
}} />
                    )}
                    {comment.replies?.length} {comment.replies?.length === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <IconButton
                  icon={<MoreVertical style={{
  width: '16px',
  height: '16px'
}} />}
                  variant="ghost"
                  size="icon-sm"
                  aria-label="More options"
                  className={cn(
                    'transition-opacity',
                    !isHovered && !isEditing && !isReplying && 'opacity-0'
                  )}
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  style={{
  width: '192px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '4px'
}}
                  align="end"
                >
                  {isAuthor && (
                    <>
                      <DropdownMenu.Item
                        style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit style={{
  width: '16px',
  height: '16px'
}} />
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
                        onClick={() => onDelete?.(comment.id)}
                      >
                        <Trash style={{
  width: '16px',
  height: '16px'
}} />
                        Delete
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator style={{
  marginTop: '4px',
  marginBottom: '4px',
  border: '1px solid var(--border-subtle)'
}} />
                    </>
                  )}
                  <DropdownMenu.Item
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
                    onClick={() => onReport?.(comment.id)}
                  >
                    <Flag style={{
  width: '16px',
  height: '16px'
}} />
                    Report
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Content */}

            {!isCollapsed && (
              <div>
                {isEditing ? (
                  <div className="mb-3 space-y-2">
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="Edit your comment..."
                      minHeight={100}
                      maxHeight={300}
                      showPreview={false}
                      showToolbar
                      autoFocus
                    />
                    <div style={{
  display: 'flex',
  gap: '8px'
}}>
                      <Button size="sm" onClick={handleEdit}>
                        <Check style={{
  width: '16px',
  height: '16px'
}} />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditContent(comment.content);
                          setIsEditing(false);
                        }}
                      >
                        <X style={{
  width: '16px',
  height: '16px'
}} />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm mb-3 whitespace-pre-wrap break-words">
                    {comment.content}
                  </div>
                )}

                {/* Footer Actions */}
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <VoteButtons
                    score={comment.score}
                    userVote={comment.userVote}
                    onVote={(voteType) => onVote?.(comment.id, voteType)}
                    orientation="horizontal"
                    size="sm"
                    compact={false}
                  />

                  {showReplyButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{
  gap: '4px'
}}
                      onClick={() => setIsReplying(!isReplying)}
                    >
                      <Reply style={{
  width: '16px',
  height: '16px'
}} />
                      Reply
                    </Button>
                  )}

                  {comment.awards && comment.awards > 0 && (
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <Award style={{
  width: '16px',
  height: '16px'
}} />
                      {comment.awards}
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                
                  {isReplying && (
                    <div
                      className="mt-3 space-y-2"
                    >
                      <RichTextEditor
                        value={replyContent}
                        onChange={setReplyContent}
                        placeholder={`Reply to ${comment.author.displayName}...`}
                        minHeight={100}
                        maxHeight={300}
                        showPreview={false}
                        showToolbar
                        autoFocus
                      />
                      <div style={{
  display: 'flex',
  gap: '8px'
}}>
                        <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                          <Reply style={{
  width: '16px',
  height: '16px'
}} />
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReplyContent('');
                            setIsReplying(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                
              </div>
            )}
          
        </div>
      </Card>

      {/* Nested Replies */}
      
        {!isCollapsed && hasReplies && depth < maxDepth && (
          <div
          >
            {comment.replies?.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                maxDepth={maxDepth}
                currentUserId={currentUserId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onVote={onVote}
                onReport={onReport}
              />
            ))}
          </div>
        )}
      

      {/* Continue Thread Link */}
      {!isCollapsed && hasReplies && depth >= maxDepth && (
        <div className="ml-6 mb-3">
          <Button variant="ghost" size="sm" className="text-primary">
            <MessageSquare style={{
  width: '16px',
  height: '16px'
}} />
            Continue this thread →
          </Button>
        </div>
      )}
    </div>
  );
};

export const ModernThreadedComments: React.FC<ModernThreadedCommentsProps> = ({
  comments,
  currentUserId,
  maxDepth = 8,
  onReply,
  onEdit,
  onDelete,
  onVote,
  onReport,
  sortBy = 'best',
  onSortChange,
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onReply?.('root', newComment.trim());
    setNewComment('');
  };

  const sortOptions = [
    { value: 'best', label: 'Best' },
    { value: 'top', label: 'Top' },
    { value: 'new', label: 'New' },
    { value: 'controversial', label: 'Controversial' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
        <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          <MessageSquare style={{
  width: '20px',
  height: '20px'
}} />
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h3>

        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)'
}}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* New Comment Form */}
      <Card variant="outline">
        <div style={{
  padding: '16px'
}}>
          <RichTextEditor
            value={newComment}
            onChange={setNewComment}
            placeholder="What are your thoughts?"
            minHeight={120}
            maxHeight={400}
            showPreview
            showToolbar
          />
          <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
            <Button onClick={handleSubmit} disabled={!newComment.trim()}>
              <MessageSquare style={{
  width: '16px',
  height: '16px'
}} />
              Comment
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-2">
        {comments.length === 0 ? (
          <Card variant="outline" style={{
  padding: '32px',
  textAlign: 'center'
}}>
            <MessageSquare style={{
  width: '48px',
  height: '48px'
}} />
            <p className="text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          </Card>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                maxDepth={maxDepth}
                currentUserId={currentUserId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onVote={onVote}
                onReport={onReport}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

ModernThreadedComments.displayName = 'ModernThreadedComments';
