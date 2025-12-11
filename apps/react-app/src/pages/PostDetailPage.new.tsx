import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flag,
  UserX,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Clock,
  Eye,
  TrendingUp,
  ChevronDown,
  Send,
  Image as ImageIcon,
  Smile,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatRelativeTime, formatNumber } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useResponsive } from '../hooks/useResponsive';

interface Comment {
  id: string;
  author: {
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  content: string;
  timestamp: Date;
  likes: number;
  replies: Comment[];
  userLiked: boolean;
}

type SortOption = 'top' | 'newest';

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { isMobile } = useResponsive();

  // Post state
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction state
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reposted, setReposted] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('top');
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // UI state
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Refs
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Load post data
  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      setPost({
        id: postId,
        author: {
          username: 'alice',
          displayName: 'Alice Johnson',
          avatar: null,
          verified: true,
          bio: 'Tech enthusiast & crypto trader'
        },
        content: 'Just discovered an amazing new DeFi protocol that could revolutionize yield farming. The APY is incredible and the team seems solid. DYOR but this looks promising! 🚀\n\n#DeFi #Web3 #Crypto',
        media: [
          {
            type: 'image',
            url: 'https://via.placeholder.com/800x600',
            alt: 'DeFi Dashboard'
          }
        ],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes: 1234,
        comments: 89,
        reposts: 234,
        bookmarks: 456,
        views: 12400,
        userLiked: false,
        userReposted: false,
        userBookmarked: false
      });

      // Mock comments
      setComments([
        {
          id: '1',
          author: { username: 'bob', verified: false },
          content: 'This looks really interesting! Can you share more details about the protocol?',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          likes: 45,
          replies: [
            {
              id: '1-1',
              author: { username: 'alice', verified: true },
              content: 'Sure! I\'ll write a detailed thread about it tomorrow. Stay tuned!',
              timestamp: new Date(Date.now() - 50 * 60 * 1000),
              likes: 23,
              replies: [],
              userLiked: false
            }
          ],
          userLiked: false
        },
        {
          id: '2',
          author: { username: 'charlie', verified: false },
          content: 'Be careful with new protocols. Make sure to do thorough research before investing!',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          likes: 67,
          replies: [],
          userLiked: false
        }
      ]);

      setLiked(false);
      setBookmarked(false);
      setReposted(false);
    } catch (err) {
      setError('Failed to load post');
      showError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  // Handle interactions
  const handleLike = async () => {
    setLiked(!liked);
    setPost({ ...post, likes: post.likes + (liked ? -1 : 1) });
  };

  const handleRepost = async () => {
    setReposted(!reposted);
    setPost({ ...post, reposts: post.reposts + (reposted ? -1 : 1) });
    showSuccess(reposted ? 'Repost removed' : 'Reposted!');
  };

  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    showSuccess(bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const handleShare = async (method: 'copy' | 'twitter' | 'download') => {
    if (method === 'copy') {
      await navigator.clipboard.writeText(window.location.href);
      showSuccess('Link copied to clipboard');
    }
    setShowShareMenu(false);
  };

  // Comment handling
  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newComment: Comment = {
        id: Math.random().toString(36).substr(2, 9),
        author: {
          username: user?.username || 'user',
          verified: false
        },
        content: commentText,
        timestamp: new Date(),
        likes: 0,
        replies: [],
        userLiked: false
      };

      if (replyingTo) {
        // Add as reply
        setComments(prevComments => {
          const addReply = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === replyingTo) {
                return {
                  ...comment,
                  replies: [...comment.replies, newComment]
                };
              }
              if (comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: addReply(comment.replies)
                };
              }
              return comment;
            });
          };
          return addReply(prevComments);
        });
      } else {
        // Add as top-level comment
        setComments(prev => [newComment, ...prev]);
        setPost({ ...post, comments: post.comments + 1 });
      }

      setCommentText('');
      setReplyingTo(null);
      showSuccess('Comment posted!');
    } catch (err) {
      showError('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentLike = (commentId: string) => {
    const updateLikes = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            userLiked: !comment.userLiked,
            likes: comment.likes + (comment.userLiked ? -1 : 1)
          };
        }
        if (comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateLikes(comment.replies)
          };
        }
        return comment;
      });
    };

    setComments(updateLikes(comments));
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo(commentId);
    setCommentText(`@${username} `);
    commentInputRef.current?.focus();
  };

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'top') {
      return b.likes - a.likes;
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  // Render comment
  const renderComment = (comment: Comment, depth: number = 0) => {
    const isExpanded = expandedComments.has(comment.id);
    const hasReplies = comment.replies.length > 0;

    return (
      <div key={comment.id} className={cn(depth > 0 && "ml-12 mt-3")}>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {comment.author.username[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white">{comment.author.username}</span>
              {comment.author.verified && (
                <CheckCircle className="w-4 h-4 text-[#58a6ff] fill-[#58a6ff]" />
              )}
              <span className="text-xs text-[#666666]">
                {formatRelativeTime(comment.timestamp)}
              </span>
            </div>

            <p className="text-[#A0A0A0] text-sm mb-2 whitespace-pre-wrap break-words">
              {comment.content}
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handleCommentLike(comment.id)}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  comment.userLiked ? "text-red-500" : "text-[#666666] hover:text-red-500"
                )}
              >
                <Heart className={cn("w-4 h-4", comment.userLiked && "fill-current")} />
                {comment.likes > 0 && <span>{formatNumber(comment.likes)}</span>}
              </button>

              <button
                onClick={() => handleReply(comment.id, comment.author.username)}
                className="text-xs text-[#666666] hover:text-[#58a6ff] transition-colors"
              >
                Reply
              </button>

              {hasReplies && (
                <button
                  onClick={() => toggleCommentExpansion(comment.id)}
                  className="text-xs text-[#58a6ff] hover:text-[#a371f7] transition-colors flex items-center gap-1"
                >
                  <ChevronDown className={cn(
                    "w-3 h-3 transition-transform",
                    isExpanded && "rotate-180"
                  )} />
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>

            {/* Nested replies */}
            <AnimatePresence>
              {hasReplies && isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  {comment.replies.map(reply => renderComment(reply, depth + 1))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {depth === 0 && <div className="mt-4 border-b border-white/10" />}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] pt-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#58a6ff] " />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] pt-16 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Post not found</h2>
          <p className="text-[#666666] mb-6">The post you're looking for doesn't exist</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-16 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-16 z-10 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[#141414]/60 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">Post</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              {/* Post header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Link to={`/u/${post.author.username}`}>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold">
                        {post.author.username[0].toUpperCase()}
                      </div>
                    </Link>

                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/u/${post.author.username}`}
                          className="font-bold text-white hover:underline"
                        >
                          {post.author.displayName}
                        </Link>
                        {post.author.verified && (
                          <CheckCircle className="w-5 h-5 text-[#58a6ff] fill-[#58a6ff]" />
                        )}
                      </div>
                      <Link
                        to={`/u/${post.author.username}`}
                        className="text-sm text-[#666666] hover:underline"
                      >
                        @{post.author.username}
                      </Link>
                    </div>
                  </div>

                  {/* More menu */}
                  <div className="relative" ref={shareMenuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-2 rounded-xl hover:bg-[#141414]/60 transition-colors"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="w-5 h-5 text-[#666666]" />
                    </button>

                    <AnimatePresence>
                      {showMoreMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                        >
                          <button
                            onClick={() => {
                              setShowReportModal(true);
                              setShowMoreMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141414] transition-colors text-left"
                          >
                            <Flag className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-white">Report post</span>
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141414] transition-colors text-left"
                          >
                            <UserX className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-white">Block @{post.author.username}</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Post content */}
                <div className="mb-4">
                  <p className="text-lg text-white whitespace-pre-wrap break-words leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Post timestamp */}
                <div className="flex items-center gap-2 text-sm text-[#666666]">
                  <Clock className="w-4 h-4" />
                  <time dateTime={post.timestamp.toISOString()}>
                    {post.timestamp.toLocaleString('en-US', {
                      hour: 'numeric',
                      minute: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </time>
                </div>
              </div>

              {/* Media */}
              {post.media && post.media.length > 0 && (
                <div className="border-b border-white/10">
                  {post.media[0].type === 'image' && (
                    <img
                      src={post.media[0].url}
                      alt={post.media[0].alt}
                      className="w-full h-auto max-h-[600px] object-contain bg-[#0D0D0D]"
                    />
                  )}
                </div>
              )}

              {/* Engagement stats */}
              <div className="px-6 py-3 border-b border-white/10">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-[#666666]" />
                    <span className="font-semibold text-white">{formatNumber(post.views)}</span>
                    <span className="text-[#666666]">views</span>
                  </div>
                  <button className="flex items-center gap-2 text-sm hover:underline">
                    <span className="font-semibold text-white">{formatNumber(post.likes)}</span>
                    <span className="text-[#666666]">likes</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm hover:underline">
                    <span className="font-semibold text-white">{formatNumber(post.reposts)}</span>
                    <span className="text-[#666666]">reposts</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm hover:underline">
                    <span className="font-semibold text-white">{formatNumber(post.bookmarks)}</span>
                    <span className="text-[#666666]">bookmarks</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-3 border-b border-white/10">
                <div className="flex items-center justify-around">
                  <button
                    onClick={handleLike}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors",
                      liked
                        ? "text-red-500 hover:bg-red-500/10"
                        : "text-[#666666] hover:bg-[#141414]/60 hover:text-red-500"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                  </button>

                  <button
                    onClick={() => commentInputRef.current?.focus()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#666666] hover:bg-[#141414]/60 hover:text-[#58a6ff] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleRepost}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors",
                      reposted
                        ? "text-green-500 hover:bg-green-500/10"
                        : "text-[#666666] hover:bg-[#141414]/60 hover:text-green-500"
                    )}
                  >
                    <Repeat2 className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#666666] hover:bg-[#141414]/60 hover:text-[#58a6ff] transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                      {showShareMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute bottom-full mb-2 right-0 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                        >
                          <button
                            onClick={() => handleShare('copy')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141414] transition-colors text-left"
                          >
                            <span className="text-sm text-white">Copy link</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={handleBookmark}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors",
                      bookmarked
                        ? "text-[#58a6ff] hover:bg-[#58a6ff]/10"
                        : "text-[#666666] hover:bg-[#141414]/60 hover:text-[#58a6ff]"
                    )}
                  >
                    <Bookmark className={cn("w-5 h-5", bookmarked && "fill-current")} />
                  </button>
                </div>
              </div>

              {/* Comment input */}
              {user && (
                <div className="p-6">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>

                    <div className="flex-1">
                      {replyingTo && (
                        <div className="mb-2 flex items-center gap-2 text-sm text-[#666666]">
                          <span>Replying to @{post.author.username}</span>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setCommentText('');
                            }}
                            className="text-[#58a6ff] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <textarea
                        ref={commentInputRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] resize-none outline-none focus:border-[#58a6ff]/50 min-h-[80px]"
                      />

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-xl hover:bg-[#141414]/60 transition-colors">
                            <ImageIcon className="w-5 h-5 text-[#666666]" />
                          </button>
                          <button className="p-2 rounded-xl hover:bg-[#141414]/60 transition-colors">
                            <Smile className="w-5 h-5 text-[#666666]" />
                          </button>
                        </div>

                        <button
                          onClick={handleSubmitComment}
                          disabled={!commentText.trim() || submittingComment}
                          className="px-6 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
                        >
                          {submittingComment ? (
                            <>
                              <Loader2 className="w-4 h-4 " />
                              <span>Posting...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Comment</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Comments section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">
                    Comments ({formatNumber(post.comments)})
                  </h2>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSortBy('top')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        sortBy === 'top'
                          ? "bg-[#58a6ff]/20 text-[#58a6ff]"
                          : "text-[#666666] hover:bg-[#141414]/60"
                      )}
                    >
                      Top
                    </button>
                    <button
                      onClick={() => setSortBy('newest')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        sortBy === 'newest'
                          ? "bg-[#58a6ff]/20 text-[#58a6ff]"
                          : "text-[#666666] hover:bg-[#141414]/60"
                      )}
                    >
                      Newest
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {sortedComments.length > 0 ? (
                  <div className="space-y-6">
                    {sortedComments.map(comment => renderComment(comment))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-[#666666] mx-auto mb-4" />
                    <p className="text-[#666666]">No comments yet</p>
                    <p className="text-sm text-[#666666] mt-2">Be the first to comment!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Author card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6"
            >
              <h3 className="text-sm font-semibold text-white mb-4">About the author</h3>

              <Link to={`/u/${post.author.username}`} className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold">
                  {post.author.username[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{post.author.displayName}</span>
                    {post.author.verified && (
                      <CheckCircle className="w-4 h-4 text-[#58a6ff] fill-[#58a6ff]" />
                    )}
                  </div>
                  <span className="text-sm text-[#666666]">@{post.author.username}</span>
                </div>
              </Link>

              <p className="text-sm text-[#A0A0A0] mb-4">{post.author.bio}</p>

              <button className="w-full px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl font-medium hover:opacity-90 transition-opacity">
                Follow
              </button>
            </motion.div>

            {/* Related posts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Related posts</h3>

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Link
                    key={i}
                    to="#"
                    className="block p-3 rounded-xl hover:bg-[#141414]/60 transition-colors"
                  >
                    <p className="text-sm text-white mb-2 line-clamp-2">
                      Another interesting post about similar topics...
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[#666666]">
                      <span>2.3K likes</span>
                      <span>456 comments</span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* More from author */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6"
            >
              <h3 className="text-sm font-semibold text-white mb-4">
                More from @{post.author.username}
              </h3>

              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Link
                    key={i}
                    to="#"
                    className="block p-3 rounded-xl hover:bg-[#141414]/60 transition-colors"
                  >
                    <p className="text-sm text-white line-clamp-3">
                      Check out this other post by the same author...
                    </p>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
