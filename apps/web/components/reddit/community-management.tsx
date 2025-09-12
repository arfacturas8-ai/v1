'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Users,
  Crown,
  Shield,
  Eye,
  EyeOff,
  Settings,
  Edit,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Hash,
  Globe,
  Lock,
  Flag,
  Star,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Ban,
  MessageSquare,
  ExternalLink,
  Image,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Community } from './post-types';
import { RedditErrorBoundary, useRedditErrorReporting } from '../error-boundaries/reddit-error-boundary';

// Community management types
export interface CommunityStats {
  memberCount: number;
  activeUsers: number;
  postsToday: number;
  commentsToday: number;
  growth30Days: number;
  engagementRate: number;
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
  reportReason?: string;
  autoMod?: boolean;
  priority: number;
  enabled: boolean;
}

export interface CommunityModerator {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  permissions: ModeratorPermission[];
  addedAt: string;
  addedBy: {
    id: string;
    username: string;
  };
}

export type ModeratorPermission = 
  | 'manage_posts' 
  | 'manage_comments' 
  | 'manage_users' 
  | 'manage_settings' 
  | 'manage_rules' 
  | 'manage_flair' 
  | 'manage_wiki' 
  | 'full_control';

export interface CommunitySettings {
  isPublic: boolean;
  allowImagePosts: boolean;
  allowLinkPosts: boolean;
  allowTextPosts: boolean;
  allowPolls: boolean;
  requireApproval: boolean;
  allowCrossPosting: boolean;
  isNsfw: boolean;
  restrictPosting: boolean;
  minAccountAge: number; // days
  minKarma: number;
  welcomeMessage?: string;
  description: string;
  rules: CommunityRule[];
  flairs: CommunityFlair[];
}

export interface CommunityFlair {
  id: string;
  text: string;
  color?: string;
  backgroundColor?: string;
  userSelectable: boolean;
  modOnly: boolean;
}

export interface CommunityData extends Community {
  settings: CommunitySettings;
  stats: CommunityStats;
  moderators: CommunityModerator[];
  userRole?: 'member' | 'moderator' | 'admin' | null;
  userPermissions?: ModeratorPermission[];
}

interface CommunityManagementProps {
  communityId: string;
  initialData?: CommunityData;
  currentUserId?: string;
  className?: string;
}

interface CommunityManagementState {
  community: CommunityData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  activeTab: string;
  unsavedChanges: boolean;
}

export function CommunityManagement({
  communityId,
  initialData,
  currentUserId,
  className,
}: CommunityManagementProps) {
  const { reportError } = useRedditErrorReporting('community-management');
  const [state, setState] = useState<CommunityManagementState>({
    community: initialData || null,
    loading: !initialData,
    saving: false,
    error: null,
    activeTab: 'overview',
    unsavedChanges: false,
  });

  // Load community data
  const loadCommunity = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.getCommunity(communityId);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          community: response.data,
          loading: false,
        }));
      } else {
        throw new Error(response.error || 'Failed to load community');
      }
    } catch (error) {
      console.error('Failed to load community:', error);
      reportError(error as Error, { communityId, action: 'load-community' });
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load community',
      }));
    }
  }, [communityId, reportError]);

  // Load data on mount
  useEffect(() => {
    if (!initialData) {
      loadCommunity();
    }
  }, [initialData, loadCommunity]);

  // Save settings
  const saveSettings = useCallback(async (settings: Partial<CommunitySettings>) => {
    if (!state.community) return;

    setState(prev => ({ ...prev, saving: true }));

    try {
      const response = await api.request(`/api/v1/communities/${communityId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          community: prev.community ? {
            ...prev.community,
            settings: { ...prev.community.settings, ...settings },
          } : null,
          saving: false,
          unsavedChanges: false,
        }));
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      reportError(error as Error, { communityId, settings, action: 'save-settings' });
      setState(prev => ({ ...prev, saving: false }));
    }
  }, [communityId, state.community, reportError]);

  // Check if user can manage community
  const canManage = useMemo(() => {
    if (!state.community || !currentUserId) return false;
    
    return state.community.userRole === 'admin' || 
           state.community.userRole === 'moderator';
  }, [state.community, currentUserId]);

  // Check specific permissions
  const hasPermission = useCallback((permission: ModeratorPermission) => {
    if (!state.community || !currentUserId) return false;
    
    if (state.community.userRole === 'admin') return true;
    
    return state.community.userPermissions?.includes(permission) || 
           state.community.userPermissions?.includes('full_control') || 
           false;
  }, [state.community, currentUserId]);

  if (state.loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading community...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.error || !state.community) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
              <p className="mb-4">{state.error || 'Community not found'}</p>
              <Button onClick={loadCommunity}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-600">
              <Shield className="h-8 w-8 mx-auto mb-4" />
              <p className="mb-4">You don't have permission to manage this community.</p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RedditErrorBoundary context="community-management">
      <div className={cn("max-w-6xl mx-auto space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {state.community.icon && (
              <Avatar className="h-12 w-12">
                <AvatarImage src={state.community.icon} />
                <AvatarFallback>
                  {state.community.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h1 className="text-2xl font-bold">r/{state.community.name}</h1>
              <p className="text-gray-600">{state.community.displayName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {state.unsavedChanges && (
              <Badge variant="secondary">Unsaved Changes</Badge>
            )}
            <Button
              disabled={state.saving || !state.unsavedChanges}
              onClick={() => saveSettings(state.community!.settings)}
              className="min-w-[100px]"
            >
              {state.saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

        {/* Management tabs */}
        <Tabs 
          value={state.activeTab} 
          onValueChange={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="moderators">Moderators</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="flair">Flair</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <CommunityOverview community={state.community} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <CommunitySettingsPanel
              community={state.community}
              hasPermission={hasPermission}
              onSettingsChange={(settings) => {
                setState(prev => ({
                  ...prev,
                  community: prev.community ? {
                    ...prev.community,
                    settings: { ...prev.community.settings, ...settings },
                  } : null,
                  unsavedChanges: true,
                }));
              }}
            />
          </TabsContent>

          {/* Moderators Tab */}
          <TabsContent value="moderators" className="space-y-6">
            <ModeratorsPanel
              community={state.community}
              hasPermission={hasPermission}
              currentUserId={currentUserId}
            />
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <RulesPanel
              community={state.community}
              hasPermission={hasPermission}
              onRulesChange={(rules) => {
                setState(prev => ({
                  ...prev,
                  community: prev.community ? {
                    ...prev.community,
                    settings: { ...prev.community.settings, rules },
                  } : null,
                  unsavedChanges: true,
                }));
              }}
            />
          </TabsContent>

          {/* Flair Tab */}
          <TabsContent value="flair" className="space-y-6">
            <FlairPanel
              community={state.community}
              hasPermission={hasPermission}
              onFlairChange={(flairs) => {
                setState(prev => ({
                  ...prev,
                  community: prev.community ? {
                    ...prev.community,
                    settings: { ...prev.community.settings, flairs },
                  } : null,
                  unsavedChanges: true,
                }));
              }}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsPanel community={state.community} />
          </TabsContent>
        </Tabs>
      </div>
    </RedditErrorBoundary>
  );
}

// Community overview component
function CommunityOverview({ community }: { community: CommunityData }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Stats cards */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">
                {community.stats.memberCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Eye className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">
                {community.stats.activeUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Online</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold">
                {community.stats.postsToday}
              </div>
              <div className="text-sm text-gray-600">Posts Today</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div>
              <div className="text-2xl font-bold">
                +{community.stats.growth30Days}%
              </div>
              <div className="text-sm text-gray-600">30d Growth</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community info */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Community Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-gray-700">{community.description || 'No description provided.'}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Settings</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {community.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  <span>{community.isPublic ? 'Public' : 'Private'} Community</span>
                </div>
                {community.isNsfw && (
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">NSFW Content</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Moderators</h4>
              <div className="space-y-1">
                {community.moderators.slice(0, 5).map(mod => (
                  <div key={mod.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={mod.user.avatar} />
                      <AvatarFallback>
                        {mod.user.username.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>u/{mod.user.username}</span>
                  </div>
                ))}
                {community.moderators.length > 5 && (
                  <div className="text-xs text-gray-500">
                    +{community.moderators.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings panel component
function CommunitySettingsPanel({
  community,
  hasPermission,
  onSettingsChange,
}: {
  community: CommunityData;
  hasPermission: (permission: ModeratorPermission) => boolean;
  onSettingsChange: (settings: Partial<CommunitySettings>) => void;
}) {
  const canManageSettings = hasPermission('manage_settings');

  if (!canManageSettings) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-600">
          <Shield className="h-8 w-8 mx-auto mb-4" />
          <p>You don't have permission to manage settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic settings */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={community.settings.description}
                onChange={(e) => onSettingsChange({ description: e.target.value })}
                placeholder="Describe your community..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublic">Public Community</Label>
                <Switch
                  id="isPublic"
                  checked={community.settings.isPublic}
                  onCheckedChange={(isPublic) => onSettingsChange({ isPublic })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isNsfw">NSFW Content</Label>
                <Switch
                  id="isNsfw"
                  checked={community.settings.isNsfw}
                  onCheckedChange={(isNsfw) => onSettingsChange({ isNsfw })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requireApproval">Require Post Approval</Label>
                <Switch
                  id="requireApproval"
                  checked={community.settings.requireApproval}
                  onCheckedChange={(requireApproval) => onSettingsChange({ requireApproval })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content settings */}
      <Card>
        <CardHeader>
          <CardTitle>Allowed Content Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="allowTextPosts">Text Posts</Label>
                <Switch
                  id="allowTextPosts"
                  checked={community.settings.allowTextPosts}
                  onCheckedChange={(allowTextPosts) => onSettingsChange({ allowTextPosts })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allowImagePosts">Image Posts</Label>
                <Switch
                  id="allowImagePosts"
                  checked={community.settings.allowImagePosts}
                  onCheckedChange={(allowImagePosts) => onSettingsChange({ allowImagePosts })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="allowLinkPosts">Link Posts</Label>
                <Switch
                  id="allowLinkPosts"
                  checked={community.settings.allowLinkPosts}
                  onCheckedChange={(allowLinkPosts) => onSettingsChange({ allowLinkPosts })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allowPolls">Polls</Label>
                <Switch
                  id="allowPolls"
                  checked={community.settings.allowPolls}
                  onCheckedChange={(allowPolls) => onSettingsChange({ allowPolls })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posting restrictions */}
      <Card>
        <CardHeader>
          <CardTitle>Posting Restrictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAccountAge">Minimum Account Age (days)</Label>
              <Input
                id="minAccountAge"
                type="number"
                min="0"
                value={community.settings.minAccountAge}
                onChange={(e) => onSettingsChange({ minAccountAge: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minKarma">Minimum Karma</Label>
              <Input
                id="minKarma"
                type="number"
                min="0"
                value={community.settings.minKarma}
                onChange={(e) => onSettingsChange({ minKarma: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome Message (optional)</Label>
            <Textarea
              id="welcomeMessage"
              value={community.settings.welcomeMessage || ''}
              onChange={(e) => onSettingsChange({ welcomeMessage: e.target.value })}
              placeholder="Welcome new members with a message..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder components for other panels
function ModeratorsPanel({ community, hasPermission, currentUserId }: { community: CommunityData; hasPermission: (p: ModeratorPermission) => boolean; currentUserId?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Moderators</CardTitle>
        <CardDescription>Manage moderators and their permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Moderator management panel coming soon...</p>
      </CardContent>
    </Card>
  );
}

function RulesPanel({ community, hasPermission, onRulesChange }: { community: CommunityData; hasPermission: (p: ModeratorPermission) => boolean; onRulesChange: (rules: CommunityRule[]) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Rules</CardTitle>
        <CardDescription>Manage rules and guidelines for your community</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Rules management panel coming soon...</p>
      </CardContent>
    </Card>
  );
}

function FlairPanel({ community, hasPermission, onFlairChange }: { community: CommunityData; hasPermission: (p: ModeratorPermission) => boolean; onFlairChange: (flairs: CommunityFlair[]) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Flair</CardTitle>
        <CardDescription>Manage post flair options for your community</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Flair management panel coming soon...</p>
      </CardContent>
    </Card>
  );
}

function AnalyticsPanel({ community }: { community: CommunityData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Analytics</CardTitle>
        <CardDescription>View detailed statistics about your community</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Analytics dashboard coming soon...</p>
      </CardContent>
    </Card>
  );
}