/**
 * CRYB Privacy Settings Page
 * Comprehensive privacy controls and data management
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  messagePermissions: 'everyone' | 'followers' | 'none';
  activityStatus: boolean;
  walletHoldings: boolean;
  taggedInPosts: 'everyone' | 'followers' | 'none';
  showInSearch: boolean;
  dataSharing: boolean;
}

const PrivacySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    messagePermissions: 'followers',
    activityStatus: true,
    walletHoldings: true,
    taggedInPosts: 'everyone',
    showInSearch: true,
    dataSharing: false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateSettings = (updates: Partial<PrivacySettings>) => {
    setSettings({ ...settings, ...updates });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    console.log('Privacy settings saved:', settings);
  };

  interface RadioOption {
    value: string;
    label: string;
    description: string;
  }

  const RadioGroup: React.FC<{
    value: string;
    options: RadioOption[];
    onChange: (value: string) => void;
  }> = ({ value, options, onChange }) => {
    return (
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'w-full p-4 rounded-lg border transition-all text-left',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent/30'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  value === option.value
                    ? 'border-primary'
                    : 'border-muted-foreground'
                )}
              >
                {value === option.value && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Privacy</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Visibility */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Profile Visibility</h2>
          <p className="text-sm text-muted-foreground">
            Control who can see your profile and posts
          </p>
          <RadioGroup
            value={settings.profileVisibility}
            options={[
              {
                value: 'public',
                label: 'Public',
                description: 'Anyone can view your profile and posts',
              },
              {
                value: 'followers',
                label: 'Followers Only',
                description: 'Only your followers can view your content',
              },
              {
                value: 'private',
                label: 'Private',
                description: 'Only approved followers can view your content',
              },
            ]}
            onChange={(value) =>
              updateSettings({
                profileVisibility: value as PrivacySettings['profileVisibility'],
              })
            }
          />
        </div>

        {/* Message Permissions */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Message Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Control who can send you direct messages
          </p>
          <RadioGroup
            value={settings.messagePermissions}
            options={[
              {
                value: 'everyone',
                label: 'Everyone',
                description: 'Anyone can send you messages',
              },
              {
                value: 'followers',
                label: 'Followers Only',
                description: 'Only people you follow can message you',
              },
              {
                value: 'none',
                label: 'No One',
                description: 'Disable direct messages completely',
              },
            ]}
            onChange={(value) =>
              updateSettings({
                messagePermissions: value as PrivacySettings['messagePermissions'],
              })
            }
          />
        </div>

        {/* Activity & Presence */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Activity & Presence</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Activity Status</div>
                <div className="text-sm text-muted-foreground">
                  Let others see when you're online
                </div>
              </div>
              <Switch
                checked={settings.activityStatus}
                onCheckedChange={(checked) =>
                  updateSettings({ activityStatus: checked })
                }
              />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show in Search Results</div>
                <div className="text-sm text-muted-foreground">
                  Allow your profile to appear in search
                </div>
              </div>
              <Switch
                checked={settings.showInSearch}
                onCheckedChange={(checked) =>
                  updateSettings({ showInSearch: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Wallet Privacy */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Wallet Privacy</h2>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Show Wallet Holdings</div>
              <div className="text-sm text-muted-foreground">
                Display your NFT collection and wallet balances
              </div>
            </div>
            <Switch
              checked={settings.walletHoldings}
              onCheckedChange={(checked) =>
                updateSettings({ walletHoldings: checked })
              }
            />
          </div>
        </div>

        {/* Tagging */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Tagging</h2>
          <p className="text-sm text-muted-foreground">
            Control who can tag you in posts
          </p>
          <RadioGroup
            value={settings.taggedInPosts}
            options={[
              {
                value: 'everyone',
                label: 'Everyone',
                description: 'Anyone can tag you in their posts',
              },
              {
                value: 'followers',
                label: 'Followers Only',
                description: 'Only people you follow can tag you',
              },
              {
                value: 'none',
                label: 'No One',
                description: 'Disable tagging completely',
              },
            ]}
            onChange={(value) =>
              updateSettings({
                taggedInPosts: value as PrivacySettings['taggedInPosts'],
              })
            }
          />
        </div>

        {/* Data & Analytics */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Data & Analytics</h2>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Share Analytics Data</div>
              <div className="text-sm text-muted-foreground">
                Help improve CRYB by sharing anonymous usage data
              </div>
            </div>
            <Switch
              checked={settings.dataSharing}
              onCheckedChange={(checked) =>
                updateSettings({ dataSharing: checked })
              }
            />
          </div>
        </div>

        {/* Block & Mute Management */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold text-lg mb-3">Blocked & Muted</h2>

          <button
            onClick={() => navigate('/settings/blocked-accounts')}
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
          >
            <div className="text-left">
              <div className="font-medium">Blocked Accounts</div>
              <div className="text-sm text-muted-foreground">
                Manage blocked users
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/settings/muted-accounts')}
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
          >
            <div className="text-left">
              <div className="font-medium">Muted Accounts</div>
              <div className="text-sm text-muted-foreground">
                Manage muted users
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/settings/hidden-words')}
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
          >
            <div className="text-left">
              <div className="font-medium">Hidden Words</div>
              <div className="text-sm text-muted-foreground">
                Filter content with specific words
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 -mx-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={() => setHasChanges(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={isSaving}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettingsPage;
