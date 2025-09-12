'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Edit3,
  Trash2,
  Flag,
  MoreHorizontal,
  Clock,
  Pin,
  Reply,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { VotingSystem } from './voting-system';
import { CommentEditor } from './comment-editor';
import { Comment, CommentThreadProps, VoteValue, CommentState } from './comment-types';

const MAX_DISPLAY_DEPTH = 8;

export function CommentThread({
  comment,
  depth,
  maxDepth,
  isLast = false,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onReport,
}: CommentThreadProps) {
  const [state, setState] = useState<CommentState>({
    loading: false,
    error: null,
    optimisticVote: comment.userVote,
    optimisticScore: comment.score,
    retryCount: 0,
    isEditing: false,
    isReplying: false,
    collapsed: comment.isCollapsed || false,
    repliesLoaded: !!comment.replies,
    repliesLoading: false,
    repliesError: null,
  });

  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);

  // Handle vote with optimistic updates
  const handleVote = useCallback(async (voteValue: VoteValue) => {
    const currentVote = state.optimisticVote;
    const finalVote = currentVote === voteValue ? null : voteValue;

    // Optimistic update
    setState(prev => ({
      ...prev,
      optimisticVote: finalVote,
      optimisticScore: prev.optimisticScore + (finalVote || 0) - (currentVote || 0),
    }));

    try {
      if (onVote) {
        await onVote(comment.id, finalVote || 0);
      }
    } catch (error) {
      // Rollback on error
      setState(prev => ({
        ...prev,
        optimisticVote: currentVote,
        optimisticScore: prev.optimisticScore - (finalVote || 0) + (currentVote || 0),
        error: { 
          code: 'VOTE_ERROR', 
          message: 'Failed to vote', 
          recoverable: true, 
          timestamp: new Date().toISOString() 
        },
      }));
    }
  }, [comment.id, state.optimisticVote, onVote]);

  // Handle reply
  const handleReply = useCallback(async (content: string) => {
    if (!onReply) return;

    setState(prev => ({ ...prev, isReplying: false }));

    try {
      const newComment = await onReply(comment.id, content);
      setReplies(prev => [newComment, ...prev]);
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  }, [comment.id, onReply]);

  // Handle edit
  const handleEdit = useCallback(async (content: string) => {
    if (!onEdit) return;

    setState(prev => ({ ...prev, isEditing: false }));

    try {
      await onEdit(comment.id, content);
      // Update comment content locally
      comment.content = content;
      comment.editedAt = new Date().toISOString();
    } catch (error) {
      console.error('Failed to edit:', error);
    }
  }, [comment.id, onEdit]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this comment?')) return;

    try {
      await onDelete(comment.id);
      // Mark as deleted locally
      comment.content = '[deleted]';
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }, [comment.id, onDelete]);

  // Toggle collapse
  const toggleCollapse = useCallback(() => {
    setState(prev => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  // Format time display
  const formatTimeAgo = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }, []);

  // Calculate indentation
  const indentLevel = Math.min(depth, MAX_DISPLAY_DEPTH);
  const shouldContinueThread = depth >= MAX_DISPLAY_DEPTH;

  return (
    <div className={cn(
      "relative",
      indentLevel > 0 && "ml-4 pl-3 border-l border-gray-200",
      shouldContinueThread && "bg-gray-50"
    )}>
      {/* Comment Content */}
      <div className="flex items-start gap-2 py-2">
        {/* Collapse button for threads */}
        {replies.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={toggleCollapse}
          >
            {state.collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}

        {/* Voting */}
        <div className="flex-shrink-0">
          <VotingSystem
            itemId={comment.id}
            itemType="comment"
            score={state.optimisticScore}
            userVote={state.optimisticVote}
            onVoteSuccess={() => {}} // Already handled in handleVote
            size="sm"
          />
        </div>

        {/* Comment body */}
        <div className="flex-1 min-w-0">
          {/* Comment header */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={comment.user.avatar} />
              <AvatarFallback>
                {comment.user.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-gray-900">
              u/{comment.user.username}
            </span>
            <span>•</span>
            <span>{formatTimeAgo(comment.createdAt)}</span>
            {comment.editedAt && (
              <>
                <span>•</span>
                <span className="italic">edited</span>
              </>
            )}
          </div>

          {/* Comment content */}
          {state.isEditing ? (
            <CommentEditor
              initialContent={comment.content}
              onSubmit={handleEdit}
              onCancel={() => setState(prev => ({ ...prev, isEditing: false }))}
              placeholder="Edit your comment..."
              submitText="Save"
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
                {comment.content}
              </p>
            </div>
          )}

          {/* Comment actions */}
          {!state.collapsed && (
            <div className="flex items-center gap-2 mt-2 text-xs">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-gray-500 hover:text-gray-900"
                onClick={() => setState(prev => ({ ...prev, isReplying: !prev.isReplying }))}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-gray-500 hover:text-gray-900"
                onClick={() => setState(prev => ({ ...prev, isEditing: true }))}
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-gray-500 hover:text-red-600"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-gray-500 hover:text-gray-900"
                onClick={() => onReport?.(comment.id, 'spam')}
              >
                <Flag className="h-3 w-3 mr-1" />
                Report
              </Button>
            </div>
          )}

          {/* Reply form */}
          {state.isReplying && (
            <div className="mt-3">
              <CommentEditor
                onSubmit={handleReply}
                onCancel={() => setState(prev => ({ ...prev, isReplying: false }))}
                placeholder="Write a reply..."
                submitText="Reply"
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {!state.collapsed && replies.length > 0 && (
        <div className="mt-1">
          {replies.map((reply, index) => (
            <CommentThread
              key={reply.id}
              comment={{
                ...reply,
                depth: (reply.depth || 0) + 1,
              }}
              depth={depth + 1}
              maxDepth={maxDepth}
              isLast={index === replies.length - 1}
              onVote={onVote}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
            />
          ))}
        </div>
      )}

      {/* Continue thread link for deep nesting */}
      {shouldContinueThread && replies.length > 0 && !state.collapsed && (
        <div className="mt-2 pl-4">
          <Button
            variant="link"
            size="sm"
            className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
          >
            Continue this thread →
          </Button>
        </div>
      )}
    </div>
  );
}