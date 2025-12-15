/**
 * CRYB Onboarding - Step 4: Follow Suggestions
 * Follow recommended users to build initial feed
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Avatar } from '../../components/ui/avatar';
import { cn } from '../../lib/utils';

// Mock user suggestions
const suggestedUsers = [
  {
    id: '1',
    username: 'cryptopunk',
    displayName: 'Crypto Punk',
    avatar: null,
    bio: 'NFT collector & blockchain enthusiast',
    followers: 12500,
    isVerified: true,
  },
  {
    id: '2',
    username: 'artgallery',
    displayName: 'Digital Art Gallery',
    avatar: null,
    bio: 'Curating the best digital art',
    followers: 8900,
    isVerified: true,
  },
  {
    id: '3',
    username: 'techexplorer',
    displayName: 'Tech Explorer',
    avatar: null,
    bio: 'Exploring the future of technology',
    followers: 15200,
    isVerified: false,
  },
  {
    id: '4',
    username: 'musicvibes',
    displayName: 'Music Vibes',
    avatar: null,
    bio: 'Sharing the best beats and tunes',
    followers: 7300,
    isVerified: true,
  },
  {
    id: '5',
    username: 'gamingpro',
    displayName: 'Gaming Pro',
    avatar: null,
    bio: 'Professional gamer and streamer',
    followers: 22000,
    isVerified: true,
  },
  {
    id: '6',
    username: 'foodie',
    displayName: 'The Foodie',
    avatar: null,
    bio: 'Food lover and recipe creator',
    followers: 9500,
    isVerified: false,
  },
];

export default function OnboardingFollowPage() {
  const navigate = useNavigate();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [processingFollow, setProcessingFollow] = useState<string | null>(null);

  const toggleFollow = async (userId: string) => {
    setProcessingFollow(userId);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));

      setFollowing((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });
    } catch (err) {
      console.error('Failed to follow user:', err);
    } finally {
      setProcessingFollow(null);
    }
  };

  const handleFollowAll = async () => {
    setLoading(true);

    try {
      // Mock API call to follow all
      await new Promise(resolve => setTimeout(resolve, 1000));

      const allUserIds = new Set(suggestedUsers.map(user => user.id));
      setFollowing(allUserIds);
    } catch (err) {
      console.error('Failed to follow all users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Proceed to final step
      navigate('/auth/onboarding-complete');
    } catch (err) {
      console.error('Failed to continue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/auth/onboarding-interests');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10" />
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10" />
      </div>

      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={cn(
                'h-1.5 rounded-full transition-all',
                step === 4 ? 'w-8 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]' : step < 4 ? 'w-1.5 bg-blue-500' : 'w-1.5 bg-gray-300'
              )}
            />
          ))}
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-3xl bg-white  border-[var(--border-subtle)]">
        <CardContent className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--text-primary)]">Follow creators</h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Discover and follow creators to personalize your feed
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-8 text-center">
            <span className="inline-block px-4 py-2 bg-[var(--bg-secondary)] rounded-full text-sm text-[var(--text-secondary)]">
              Step 4 of 5
            </span>
          </div>

          {/* Follow all button */}
          <div className="mb-6 flex justify-between items-center">
            <span className="text-sm text-[var(--text-secondary)]">
              {following.size} of {suggestedUsers.length} following
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFollowAll}
              disabled={loading || following.size === suggestedUsers.length}
              className="bg-transparent border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-gray-50"
            >
              Follow all
            </Button>
          </div>

          {/* User list */}
          <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {suggestedUsers.map((user) => {
              const isFollowing = following.has(user.id);
              const isProcessing = processingFollow === user.id;

              return (
                <div
                  key={user.id}
                  className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={user.avatar || undefined}
                      fallback={user.displayName.substring(0, 2)}
                      size="lg"
                      variant="gradient"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[var(--text-primary)] font-semibold truncate">{user.displayName}</h3>
                        {user.isVerified && (
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg style={{color: "var(--text-primary)"}} className="w-3 h-3 " fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">@{user.username}</p>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">{user.bio}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{formatNumber(user.followers)} followers</p>
                    </div>

                    <Button
                      variant={isFollowing ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => toggleFollow(user.id)}
                      disabled={isProcessing}
                      loading={isProcessing}
                      className={cn(
                        'flex-shrink-0',
                        isFollowing
                          ? 'bg-transparent border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-gray-50'
                          : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90'
                      )}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={loading}
              className="bg-transparent border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading}
              onClick={handleContinue}
              className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            You can always follow or unfollow users later
          </p>
        </CardContent>
      </Card>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
