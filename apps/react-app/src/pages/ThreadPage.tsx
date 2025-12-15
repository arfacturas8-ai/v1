import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatRelativeTime, formatNumber } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useResponsive } from '../hooks/useResponsive';

interface ThreadPost {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    verified?: boolean;
  };
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    alt?: string;
  }[];
  timestamp: Date;
  likes: number;
  comments: number;
  reposts: number;
  bookmarks: number;
  userLiked: boolean;
  userReposted: boolean;
  userBookmarked: boolean;
  isThreadStart?: boolean;
  isThreadEnd?: boolean;
  replyCount?: number;
  collapsed?: boolean;
}

export default function ThreadPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { isMobile } = useResponsive();

  // State
  const [thread, setThread] = useState<ThreadPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedPosts, setCollapsedPosts] = useState<Set<string>>(new Set());
  const [highlightedAuthor, setHighlightedAuthor] = useState<string | null>(null);

  // Load thread data
  useEffect(() => {
    loadThread();
  }, [threadId]);

  const loadThread = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock thread data
      const mockThread: ThreadPost[] = [
        {
          id: '1',
          author: {
            username: 'alice',
            displayName: 'Alice Johnson',
            verified: true
          },
          content: '🧵 THREAD: Let me explain why the latest Web3 developments are game-changing for creators and developers. This is going to be a long one, so buckle up! 1/',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          likes: 234,
          comments: 45,
          reposts: 89,
          bookmarks: 123,
          userLiked: false,
          userReposted: false,
          userBookmarked: false,
          isThreadStart: true,
          replyCount: 5
        },
        {
          id: '2',
          author: {
            username: 'alice',
            displayName: 'Alice Johnson',
            verified: true
          },
          content: 'First, let\'s talk about decentralized identity. Traditional platforms control your digital identity, but Web3 gives YOU control. You own your data, your content, and your reputation. 2/',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 60 * 1000),
          likes: 189,
          comments: 23,
          reposts: 56,
          bookmarks: 78,
          userLiked: false,
          userReposted: false,
          userBookmarked: false
        },
        {
          id: '3',
          author: {
            username: 'alice',
            displayName: 'Alice Johnson',
            verified: true
          },
          content: 'The creator economy is being revolutionized. No more platform fees eating 30-50% of your revenue. Smart contracts enable direct creator-to-fan relationships with programmable royalties. 3/',
          media: [
            {
              type: 'image',
              url: 'https://via.placeholder.com/600x400',
              alt: 'Creator Economy Infographic'
            }
          ],
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 120 * 1000),
          likes: 345,
          comments: 67,
          reposts: 123,
          bookmarks: 234,
          userLiked: false,
          userReposted: false,
          userBookmarked: false
        },
        {
          id: '4',
          author: {
            username: 'alice',
            displayName: 'Alice Johnson',
            verified: true
          },
          content: 'Interoperability is huge. Your NFTs, tokens, and reputation can move across platforms. Imagine your gaming achievements translating to social status, or your social following giving you access to exclusive DAOs. 4/',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 180 * 1000),
          likes: 267,
          comments: 45,
          reposts: 89,
          bookmarks: 156,
          userLiked: false,
          userReposted: false,
          userBookmarked: false
        },
        {
          id: '5',
          author: {
            username: 'alice',
            displayName: 'Alice Johnson',
            verified: true
          },
          content: 'The technical improvements are exciting too. Layer 2 solutions are making transactions faster and cheaper. We\'re talking sub-second confirmations and fees under a cent. The UX is finally catching up to Web2. 5/',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 240 * 1000),
          likes: 198,
          comments: 34,
          reposts: 67,
          bookmarks: 89,
          userLiked: false,
          userReposted: false,
          userBookmarked: false
        },
        {
          id: '6',
          author: {
            username: 'alice',
            displayName: 'Alice Johnson',
            verified: true
          },
          content: 'Of course, there are challenges. Scalability, user education, regulatory uncertainty. But the pace of innovation is incredible. What seemed impossible 2 years ago is now commonplace. 6/',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 300 * 1000),
          likes: 176,
          comments: 28,
          reposts: 45,
          bookmarks: 67,
          userLiked: false,
          userReposted: false,
          userBookmarked: false
        },
        {
          id: '7',
          author: {
            username: 'alice',
            displayName: 'Alice Johnson',
            verified: true
          },
          content: 'My prediction: Within 5 years, most creators and developers will be building on Web3 infrastructure, even if they don\'t realize it. The tech will fade into the background, but the benefits will be everywhere. 7/',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 360 * 1000),
          likes: 289,
          comments: 56,
          reposts: 112,
          bookmarks: 201,
          userLiked: false,
          userReposted: false,
          userBookmarked: false
        },
        {
          id: '8',
          author: {
            username: 'alice',
            displayName: 'Alice Johnson',
            verified: true
          },
          content: 'If you\'re building in this space, focus on user experience and real utility. The speculation will fade, but genuine value creation will win. We\'re still so early! 🚀\n\nThanks for reading! Questions? Drop them below! 8/8',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 420 * 1000),
          likes: 412,
          comments: 89,
          reposts: 178,
          bookmarks: 267,
          userLiked: false,
          userReposted: false,
          userBookmarked: false,
          isThreadEnd: true
        }
      ];

      setThread(mockThread);
      setHighlightedAuthor(mockThread[0].author.username);
    } catch (err) {
      setError('Failed to load thread');
      showError('Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  // Handle interactions
  const handleLike = (postId: string) => {
    setThread(prevThread =>
      prevThread.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            userLiked: !post.userLiked,
            likes: post.likes + (post.userLiked ? -1 : 1)
          };
        }
        return post;
      })
    );
  };

  const handleRepost = (postId: string) => {
    setThread(prevThread =>
      prevThread.map(post => {
        if (post.id === postId) {
          const newReposted = !post.userReposted;
          showSuccess(newReposted ? 'Reposted!' : 'Repost removed');
          return {
            ...post,
            userReposted: newReposted,
            reposts: post.reposts + (post.userReposted ? -1 : 1)
          };
        }
        return post;
      })
    );
  };

  const handleBookmark = (postId: string) => {
    setThread(prevThread =>
      prevThread.map(post => {
        if (post.id === postId) {
          const newBookmarked = !post.userBookmarked;
          showSuccess(newBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
          return {
            ...post,
            userBookmarked: newBookmarked
          };
        }
        return post;
      })
    );
  };

  const handleShare = async (postId: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    showSuccess('Link copied to clipboard');
  };

  const toggleCollapse = (postId: string) => {
    setCollapsedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Render thread line
  const renderThreadLine = (index: number, isCollapsed: boolean) => {
    if (index === thread.length - 1) return null;

    return (
      <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-[#58a6ff] to-[#a371f7]" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] pt-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#58a6ff] " />
      </div>
    );
  }

  if (error || thread.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] pt-16 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Thread not found</h2>
          <p className="text-[var(--text-secondary)] mb-6">The thread you're looking for doesn't exist</p>
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

  const threadAuthor = thread[0].author;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-16 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="sticky top-16 z-10 bg-white/80  border-b border-[var(--border-subtle)] px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">Thread</h1>
              <p className="text-sm text-[var(--text-secondary)]">by @{threadAuthor.username}</p>
            </div>
          </div>
        </div>

        {/* Thread info banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-4 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <div style={{color: "var(--text-primary)"}} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  font-semibold flex-shrink-0">
              {threadAuthor.username[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  to={`/u/${threadAuthor.username}`}
                  className="font-semibold text-[var(--text-primary)] hover:underline"
                >
                  {threadAuthor.displayName}
                </Link>
                {threadAuthor.verified && (
                  <CheckCircle className="w-4 h-4 text-[#58a6ff] fill-[#58a6ff]" />
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Thread with {thread.length} posts
              </p>
            </div>

            <button className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Follow
            </button>
          </div>
        </motion.div>

        {/* Thread posts */}
        <div className="p-4 space-y-0">
          {thread.map((post, index) => {
            const isCollapsed = collapsedPosts.has(post.id);
            const isAuthorHighlighted = highlightedAuthor === post.author.username;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {/* Thread line */}
                {!isCollapsed && renderThreadLine(index, isCollapsed)}

                {/* Post card */}
                <div
                  className={cn(
                    "bg-white  border rounded-2xl shadow-sm overflow-hidden mb-2 transition-all",
                    isAuthorHighlighted
                      ? "border-[#58a6ff]/50"
                      : "border-[var(--border-subtle)]",
                    post.isThreadStart && "ring-2 ring-[#58a6ff]/30",
                    isCollapsed && "opacity-60"
                  )}
                >
                  {/* Thread position indicator */}
                  {post.isThreadStart && (
                    <div className="px-4 py-2 bg-[#58a6ff]/20 border-b border-[#58a6ff]/30">
                      <div className="flex items-center gap-2 text-sm text-[#58a6ff]">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Thread Start</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Post header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Link to={`/u/${post.author.username}`}>
                          <div style={{color: "var(--text-primary)"}} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  font-semibold flex-shrink-0">
                            {post.author.username[0].toUpperCase()}
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/u/${post.author.username}`}
                              className="font-semibold text-[var(--text-primary)] hover:underline"
                            >
                              {post.author.displayName}
                            </Link>
                            {post.author.verified && (
                              <CheckCircle className="w-4 h-4 text-[#58a6ff] fill-[#58a6ff]" />
                            )}
                            <span className="text-sm text-[var(--text-secondary)]">
                              @{post.author.username}
                            </span>
                            <span className="text-[var(--text-secondary)]">•</span>
                            <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(post.timestamp)}
                            </span>
                          </div>

                          {isAuthorHighlighted && (
                            <span className="inline-block px-2 py-0.5 bg-[#58a6ff]/20 text-[#58a6ff] text-xs rounded-full mt-1">
                              Thread Author
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Collapse button for long threads */}
                        {thread.length > 5 && index > 0 && index < thread.length - 1 && (
                          <button
                            onClick={() => toggleCollapse(post.id)}
                            className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
                            aria-label={isCollapsed ? "Expand" : "Collapse"}
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
                            )}
                          </button>
                        )}

                        <button className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-[var(--text-secondary)]" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {/* Post content */}
                          <div className="mb-4">
                            <p className="text-[var(--text-primary)] whitespace-pre-wrap break-words leading-relaxed">
                              {post.content}
                            </p>
                          </div>

                          {/* Media */}
                          {post.media && post.media.length > 0 && (
                            <div className="mb-4 rounded-xl overflow-hidden">
                              {post.media[0].type === 'image' && (
                                <img
                                  src={post.media[0].url}
                                  alt={post.media[0].alt}
                                  className="w-full h-auto max-h-[400px] object-cover"
                                />
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleLike(post.id)}
                                className={cn(
                                  "flex items-center gap-1.5 transition-colors",
                                  post.userLiked
                                    ? "text-red-500"
                                    : "text-[var(--text-secondary)] hover:text-red-500"
                                )}
                              >
                                <Heart className={cn("w-5 h-5", post.userLiked && "fill-current")} />
                                <span className="text-sm">{formatNumber(post.likes)}</span>
                              </button>

                              <Link
                                to={`/post/${post.id}`}
                                className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[#58a6ff] transition-colors"
                              >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm">{formatNumber(post.comments)}</span>
                              </Link>

                              <button
                                onClick={() => handleRepost(post.id)}
                                className={cn(
                                  "flex items-center gap-1.5 transition-colors",
                                  post.userReposted
                                    ? "text-green-500"
                                    : "text-[var(--text-secondary)] hover:text-green-500"
                                )}
                              >
                                <Repeat2 className="w-5 h-5" />
                                <span className="text-sm">{formatNumber(post.reposts)}</span>
                              </button>

                              <button
                                onClick={() => handleShare(post.id)}
                                className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[#58a6ff] transition-colors"
                              >
                                <Share2 className="w-5 h-5" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleBookmark(post.id)}
                              className={cn(
                                "p-2 rounded-xl transition-colors",
                                post.userBookmarked
                                  ? "text-[#58a6ff]"
                                  : "text-[var(--text-secondary)] hover:text-[#58a6ff]"
                              )}
                            >
                              <Bookmark className={cn("w-5 h-5", post.userBookmarked && "fill-current")} />
                            </button>
                          </div>

                          {/* Reply indicator */}
                          {post.replyCount && post.replyCount > 0 && (
                            <Link
                              to={`/post/${post.id}`}
                              className="block mt-3 pt-3 border-t border-[var(--border-subtle)] text-sm text-[#58a6ff] hover:underline"
                            >
                              View {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
                            </Link>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Collapsed state */}
                    {isCollapsed && (
                      <div className="text-center">
                        <button
                          onClick={() => toggleCollapse(post.id)}
                          className="text-sm text-[#58a6ff] hover:underline"
                        >
                          Show post
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thread end indicator */}
                  {post.isThreadEnd && (
                    <div className="px-4 py-2 bg-[#58a6ff]/20 border-t border-[#58a6ff]/30">
                      <div className="flex items-center gap-2 text-sm text-[#58a6ff]">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">End of Thread</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Thread summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: thread.length * 0.05 }}
          className="mx-4 mb-4 p-6 bg-white  border border-[var(--border-subtle)] rounded-2xl shadow-sm"
        >
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Thread Summary</h3>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#58a6ff] mb-1">
                {thread.length}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Posts</div>
            </div>

            <div>
              <div className="text-2xl font-bold text-[#58a6ff] mb-1">
                {formatNumber(thread.reduce((sum, post) => sum + post.likes, 0))}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Total Likes</div>
            </div>

            <div>
              <div className="text-2xl font-bold text-[#58a6ff] mb-1">
                {formatNumber(thread.reduce((sum, post) => sum + post.comments, 0))}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Total Comments</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{color: "var(--text-primary)"}} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  font-semibold">
                {threadAuthor.username[0].toUpperCase()}
              </div>

              <div>
                <Link
                  to={`/u/${threadAuthor.username}`}
                  className="font-semibold text-[var(--text-primary)] hover:underline block"
                >
                  {threadAuthor.displayName}
                </Link>
                <span className="text-sm text-[var(--text-secondary)]">@{threadAuthor.username}</span>
              </div>
            </div>

            <button className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Follow
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
