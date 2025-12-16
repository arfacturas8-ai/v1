import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Lock } from 'lucide-react'
import { Card, CardImage, CardHeader, CardTitle, CardDescription, CardFooter, CardBadge } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useResponsive } from '../../hooks/useResponsive';



export default function CommunityCard({ community, onJoin, onLeave, compact = false }) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(community.isJoined || false);

  const handleJoinToggle = async (e) => {
    e.stopPropagation();
    if (isJoining) return;

    setIsJoining(true);
    const wasJoined = isJoined;

    try {
      setIsJoined(!wasJoined);
      if (wasJoined) {
        await onLeave?.(community.name);
      } else {
        await onJoin?.(community.name);
      }
    } catch (error) {
      setIsJoined(wasJoined);
      console.error('Failed to update community membership:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getBadge = () => {
    if (community.type === 'private') return { text: 'Private', variant: 'warning' };
    if (community.type === 'restricted') return { text: 'Restricted', variant: 'info' };
    if (community.featured) return { text: 'Featured', variant: 'primary' };
    return null;
  };

  const badge = getBadge();

  return (
    <Card
      variant="interactive"
      padding={compact ? 'sm' : 'none'}
      onClick={() => navigate(`/community/${community.slug || community.name}`)}
      style={{
  overflow: 'hidden'
}}
    >
      {badge && <CardBadge variant={badge.variant}>{badge.text}</CardBadge>}

      {/* Cover Image */}
      <CardImage
        src={community.banner_image_url || community.image_url}
        alt={community.name}
        aspectRatio="21/9"
        fallback={
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <Users style={{
  height: '48px',
  width: '48px'
}} />
          </div>
        }
      />

      {/* Community Icon (overlaps cover) */}
      <div className={cn(
        "px-3 sm:px-4 relative"
      )}>
        <div className={cn(
          "rounded-xl overflow-hidden",
          isMobile ? "w-14 h-14" : "w-16 h-16"
        )}>
          {community.icon_url ? (
            <img
              src={community.icon_url}
              alt={community.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/10">
              <span className={cn(
                "text-white font-bold",
                isMobile ? "text-lg" : "text-xl"
              )}>
                {community.name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "p-3 sm:p-4"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile ? "text-base" : "text-lg"
          )}>
            <span className="truncate">{community.name}</span>
            {community.type === 'private' && <Lock style={{ width: "24px", height: "24px", flexShrink: 0 }} />}
            {community.verified && (
              <svg style={{ width: "24px", height: "24px", flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </CardTitle>
          {community.description && (
            <CardDescription className={cn(
              "line-clamp-2",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {community.description}
            </CardDescription>
          )}
        </CardHeader>

        {/* Stats */}
        <div className={cn(
          "flex items-center flex-wrap gap-3 md:gap-4 mt-2"
        )}>
          <div className="flex items-center gap-1">
            <Users style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <span className={cn(
              "font-medium",
              isMobile ? "text-xs" : "text-sm"
            )}>{formatNumber(community.member_count || 0)}</span>
          </div>
          {community.post_count !== undefined && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-muted",
                isMobile ? "text-xs" : "text-sm"
              )}>{formatNumber(community.post_count)} posts</span>
            </div>
          )}
          {community.online_count !== undefined && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className={cn(
                "text-muted",
                isMobile ? "text-xs" : "text-sm"
              )}>{formatNumber(community.online_count)} online</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {community.tags.slice(0, isMobile ? 2 : 3).map((tag, i) => (
              <span
                key={i}
                className={cn(
                  "px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20",
                  isMobile ? "text-xs" : "text-xs"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Join Button */}
        <Button
          variant={isJoined ? 'secondary' : 'primary'}
          size={isMobile ? "sm" : "md"}
          fullWidth
          loading={isJoining}
          onClick={handleJoinToggle}
          className="touch-target mt-3"
        >
          {isJoined ? 'Leave' : 'Join'}
        </Button>
      </div>
    </Card>
  );
}

