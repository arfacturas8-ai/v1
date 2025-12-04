import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Image as ImageIcon,
  Video,
  Smile,
  Hash,
  AtSign,
  MapPin,
  Globe,
  Users,
  Lock,
  Calendar,
  Save,
  Eye,
  Upload,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Loader2,
  Gift,
  BarChart3,
  Link as LinkIcon,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useResponsive } from '../hooks/useResponsive';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'gif';
  status: 'uploading' | 'uploaded' | 'error';
  progress: number;
}

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  options: PollOption[];
  duration: number; // in hours
  multipleChoice: boolean;
}

type Audience = 'public' | 'followers' | 'community';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { isMobile } = useResponsive();

  // Content state
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [nftAttachment, setNftAttachment] = useState<any>(null);
  const [location, setLocation] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  // UI state
  const [audience, setAudience] = useState<Audience>('public');
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const CHARACTER_LIMIT = 500;
  const MAX_MEDIA = 4;
  const MAX_POLL_OPTIONS = 4;

  // Mock data for autocomplete
  const mockUsers = ['alice', 'bob', 'charlie', 'david'];
  const mockHashtags = ['technology', 'crypto', 'web3', 'gaming', 'news'];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Handle text input with mention/hashtag detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setContent(value);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const beforeCursor = value.slice(0, cursorPos);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentions(true);
      setShowHashtags(false);
    }
    // Check for # hashtags
    else {
      const hashMatch = beforeCursor.match(/#(\w*)$/);
      if (hashMatch) {
        setHashtagQuery(hashMatch[1]);
        setShowHashtags(true);
        setShowMentions(false);
      } else {
        setShowMentions(false);
        setShowHashtags(false);
      }
    }
  };

  // Handle mention selection
  const handleMentionSelect = (username: string) => {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    const newContent = beforeCursor.slice(0, lastAtIndex) + `@${username} ` + afterCursor;
    setContent(newContent);
    setShowMentions(false);

    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = lastAtIndex + username.length + 2;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle hashtag selection
  const handleHashtagSelect = (hashtag: string) => {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const lastHashIndex = beforeCursor.lastIndexOf('#');

    const newContent = beforeCursor.slice(0, lastHashIndex) + `#${hashtag} ` + afterCursor;
    setContent(newContent);
    setShowHashtags(false);

    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = lastHashIndex + hashtag.length + 2;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle media upload
  const handleMediaUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files || media.length >= MAX_MEDIA) return;

    const newFiles = Array.from(files).slice(0, MAX_MEDIA - media.length);

    for (const file of newFiles) {
      const id = Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);

      const mediaFile: MediaFile = {
        id,
        file,
        preview,
        type,
        status: 'uploading',
        progress: 0
      };

      setMedia(prev => [...prev, mediaFile]);

      // Simulate upload
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setMedia(prev => prev.map(m =>
          m.id === id ? { ...m, progress: i } : m
        ));
      }

      setMedia(prev => prev.map(m =>
        m.id === id ? { ...m, status: 'uploaded' } : m
      ));
    }
  };

  // Remove media
  const handleRemoveMedia = (id: string) => {
    setMedia(prev => {
      const file = prev.find(m => m.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter(m => m.id !== id);
    });
  };

  // Poll management
  const handleCreatePoll = () => {
    setPoll({
      options: [
        { id: '1', text: '' },
        { id: '2', text: '' }
      ],
      duration: 24,
      multipleChoice: false
    });
  };

  const handleAddPollOption = () => {
    if (!poll || poll.options.length >= MAX_POLL_OPTIONS) return;

    setPoll({
      ...poll,
      options: [
        ...poll.options,
        { id: Math.random().toString(36).substr(2, 9), text: '' }
      ]
    });
  };

  const handleUpdatePollOption = (id: string, text: string) => {
    if (!poll) return;

    setPoll({
      ...poll,
      options: poll.options.map(opt =>
        opt.id === id ? { ...opt, text } : opt
      )
    });
  };

  const handleRemovePollOption = (id: string) => {
    if (!poll || poll.options.length <= 2) return;

    setPoll({
      ...poll,
      options: poll.options.filter(opt => opt.id !== id)
    });
  };

  // Validation
  const canPost = () => {
    if (!content.trim() && media.length === 0 && !poll) return false;
    if (content.length > CHARACTER_LIMIT) return false;
    if (media.some(m => m.status === 'uploading')) return false;
    if (poll && poll.options.some(opt => !opt.text.trim())) return false;
    return true;
  };

  // Handle post submission
  const handlePost = async () => {
    if (!canPost()) return;

    setIsPosting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      showSuccess('Post created successfully!');
      navigate('/home');
    } catch (error) {
      showError('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Save as draft
  const handleSaveDraft = () => {
    localStorage.setItem('draft-post', JSON.stringify({
      content,
      audience,
      location,
      timestamp: Date.now()
    }));
    showSuccess('Draft saved');
  };

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem('draft-post');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
          setContent(parsed.content || '');
          setAudience(parsed.audience || 'public');
          setLocation(parsed.location || '');
        } else {
          localStorage.removeItem('draft-post');
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  const audienceIcons = {
    public: Globe,
    followers: Users,
    community: Lock
  };

  const audienceLabels = {
    public: 'Public',
    followers: 'Followers',
    community: 'Community'
  };

  const AudienceIcon = audienceIcons[audience];
  const charCount = content.length;
  const charPercentage = (charCount / CHARACTER_LIMIT) * 100;

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-16 pb-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[#141414]/60 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#A0A0A0]" />
            </button>
            <h1 className="text-xl font-bold text-white">Create Post</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              className="p-2 rounded-xl hover:bg-[#141414]/60 transition-colors"
              aria-label="Save draft"
            >
              <Save className="w-5 h-5 text-[#A0A0A0]" />
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showPreview ? "bg-[#58a6ff]/20 text-[#58a6ff]" : "hover:bg-[#141414]/60 text-[#A0A0A0]"
              )}
              aria-label="Toggle preview"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main composer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6"
        >
          {/* User info */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{user?.username || 'User'}</span>

                {/* Audience selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowAudienceMenu(!showAudienceMenu)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0D0D0D] border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <AudienceIcon className="w-3 h-3 text-[#58a6ff]" />
                    <span className="text-xs text-[#A0A0A0]">{audienceLabels[audience]}</span>
                    <ChevronDown className="w-3 h-3 text-[#A0A0A0]" />
                  </button>

                  <AnimatePresence>
                    {showAudienceMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 left-0 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 min-w-[150px]"
                      >
                        {(Object.keys(audienceIcons) as Audience[]).map((key) => {
                          const Icon = audienceIcons[key];
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                setAudience(key);
                                setShowAudienceMenu(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 hover:bg-[#141414] transition-colors",
                                audience === key && "bg-[#58a6ff]/20 text-[#58a6ff]"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-sm">{audienceLabels[key]}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Text input */}
          <div className="relative mb-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="What's happening?"
              className="w-full bg-transparent text-white placeholder:text-[#666666] resize-none outline-none text-lg min-h-[120px] max-h-[400px]"
              style={{ scrollbarWidth: 'thin' }}
              aria-label="Post content"
            />

            {/* Mention autocomplete */}
            <AnimatePresence>
              {showMentions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full mb-2 left-0 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 w-64"
                >
                  {mockUsers
                    .filter(user => user.toLowerCase().includes(mentionQuery.toLowerCase()))
                    .map(user => (
                      <button
                        key={user}
                        onClick={() => handleMentionSelect(user)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#141414] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold text-sm">
                          {user[0].toUpperCase()}
                        </div>
                        <span className="text-white">@{user}</span>
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hashtag autocomplete */}
            <AnimatePresence>
              {showHashtags && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full mb-2 left-0 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 w-64"
                >
                  {mockHashtags
                    .filter(tag => tag.toLowerCase().includes(hashtagQuery.toLowerCase()))
                    .map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleHashtagSelect(tag)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#141414] transition-colors text-left"
                      >
                        <Hash className="w-4 h-4 text-[#58a6ff]" />
                        <span className="text-white">#{tag}</span>
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Media preview */}
          <AnimatePresence>
            {media.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "grid gap-2 mb-4",
                  media.length === 1 && "grid-cols-1",
                  media.length === 2 && "grid-cols-2",
                  media.length >= 3 && "grid-cols-2"
                )}
              >
                {media.map((file) => (
                  <div key={file.id} className="relative rounded-xl overflow-hidden bg-[#0D0D0D] aspect-video">
                    {file.type === 'video' ? (
                      <video src={file.preview} className="w-full h-full object-cover" />
                    ) : (
                      <img src={file.preview} alt="Upload" className="w-full h-full object-cover" />
                    )}

                    {file.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                          <span className="text-white text-sm">{file.progress}%</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleRemoveMedia(file.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
                      aria-label="Remove media"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Poll */}
          <AnimatePresence>
            {poll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-[#0D0D0D] border border-white/10 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#58a6ff]" />
                    <span className="text-sm font-medium text-white">Poll</span>
                  </div>
                  <button
                    onClick={() => setPoll(null)}
                    className="p-1 rounded-lg hover:bg-[#141414]/60 transition-colors"
                    aria-label="Remove poll"
                  >
                    <X className="w-4 h-4 text-[#A0A0A0]" />
                  </button>
                </div>

                <div className="space-y-2 mb-3">
                  {poll.options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleUpdatePollOption(option.id, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-3 py-2 bg-[#141414] border border-white/10 rounded-lg text-white placeholder:text-[#666666] outline-none focus:border-[#58a6ff]/50"
                      />
                      {poll.options.length > 2 && (
                        <button
                          onClick={() => handleRemovePollOption(option.id)}
                          className="p-2 rounded-lg hover:bg-[#141414]/60 transition-colors"
                          aria-label="Remove option"
                        >
                          <X className="w-4 h-4 text-[#A0A0A0]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {poll.options.length < MAX_POLL_OPTIONS && (
                  <button
                    onClick={handleAddPollOption}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#141414] border border-dashed border-white/10 rounded-lg hover:border-white/20 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-[#58a6ff]" />
                    <span className="text-sm text-[#58a6ff]">Add option</span>
                  </button>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                  <select
                    value={poll.duration}
                    onChange={(e) => setPoll({ ...poll, duration: Number(e.target.value) })}
                    className="px-3 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-sm text-white outline-none"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>1 day</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                  </select>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={poll.multipleChoice}
                      onChange={(e) => setPoll({ ...poll, multipleChoice: e.target.checked })}
                      className="rounded border-white/10"
                    />
                    <span className="text-sm text-[#A0A0A0]">Multiple choice</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location */}
          <AnimatePresence>
            {showLocationInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#58a6ff]" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location"
                    className="flex-1 px-3 py-2 bg-[#0D0D0D] border border-white/10 rounded-lg text-white placeholder:text-[#666666] outline-none focus:border-[#58a6ff]/50"
                  />
                  <button
                    onClick={() => {
                      setShowLocationInput(false);
                      setLocation('');
                    }}
                    className="p-2 rounded-lg hover:bg-[#141414]/60 transition-colors"
                  >
                    <X className="w-4 h-4 text-[#A0A0A0]" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-1">
              {/* Image upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={media.length >= MAX_MEDIA}
                className="p-2 rounded-xl hover:bg-[#58a6ff]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add image"
              >
                <ImageIcon className="w-5 h-5 text-[#58a6ff]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleMediaUpload(e.target.files, 'image')}
              />

              {/* Video upload */}
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={media.length >= MAX_MEDIA}
                className="p-2 rounded-xl hover:bg-[#58a6ff]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add video"
              >
                <Video className="w-5 h-5 text-[#58a6ff]" />
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleMediaUpload(e.target.files, 'video')}
              />

              {/* Poll */}
              <button
                onClick={handleCreatePoll}
                disabled={!!poll || media.length > 0}
                className="p-2 rounded-xl hover:bg-[#58a6ff]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Create poll"
              >
                <BarChart3 className="w-5 h-5 text-[#58a6ff]" />
              </button>

              {/* NFT */}
              <button
                className="p-2 rounded-xl hover:bg-[#58a6ff]/20 transition-colors"
                aria-label="Attach NFT"
              >
                <Gift className="w-5 h-5 text-[#58a6ff]" />
              </button>

              {/* Location */}
              <button
                onClick={() => setShowLocationInput(!showLocationInput)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  showLocationInput ? "bg-[#58a6ff]/20 text-[#58a6ff]" : "hover:bg-[#58a6ff]/20 text-[#58a6ff]"
                )}
                aria-label="Add location"
              >
                <MapPin className="w-5 h-5" />
              </button>

              {/* Schedule */}
              <button
                onClick={() => setShowScheduler(!showScheduler)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  showScheduler ? "bg-[#58a6ff]/20 text-[#58a6ff]" : "hover:bg-[#58a6ff]/20 text-[#58a6ff]"
                )}
                aria-label="Schedule post"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Character counter */}
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#2D2D2D"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke={charCount > CHARACTER_LIMIT ? '#EF4444' : '#58a6ff'}
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - charPercentage / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                {charCount > CHARACTER_LIMIT - 50 && (
                  <span className={cn(
                    "text-sm font-medium",
                    charCount > CHARACTER_LIMIT ? "text-red-500" : "text-[#A0A0A0]"
                  )}>
                    {CHARACTER_LIMIT - charCount}
                  </span>
                )}
              </div>

              {/* Post button */}
              <button
                onClick={handlePost}
                disabled={!canPost() || isPosting}
                className={cn(
                  "px-6 py-2 rounded-xl font-medium transition-all",
                  "bg-gradient-to-r from-[#58a6ff] to-[#a371f7]",
                  "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2"
                )}
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>Post</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Validation errors */}
        {charCount > CHARACTER_LIMIT && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-500">
              Post is {charCount - CHARACTER_LIMIT} characters too long
            </span>
          </motion.div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-xl">
          <h3 className="text-sm font-medium text-[#58a6ff] mb-2">Pro Tips</h3>
          <ul className="text-sm text-[#A0A0A0] space-y-1">
            <li>• Use @ to mention users and # to add hashtags</li>
            <li>• You can add up to {MAX_MEDIA} media files per post</li>
            <li>• Press Cmd/Ctrl + Enter to post quickly</li>
            <li>• Your draft is automatically saved</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
