/**
 * CRYB Notification Settings Page
 * Comprehensive notification preferences with granular controls
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Moon } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  notifications: {
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    followers: boolean;
    messages: boolean;
    sales: boolean;
    offers: boolean;
    alerts: boolean;
    community: boolean;
    marketing: boolean;
  };
  quietMode: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

const NotificationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    notifications: {
      likes: true,
      comments: true,
      mentions: true,
      followers: true,
      messages: true,
      sales: true,
      offers: true,
      alerts: true,
      community: false,
      marketing: false,
    },
    quietMode: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateSettings = (
    updates: Partial<NotificationSettings> | ((prev: NotificationSettings) => NotificationSettings)
  ) => {
    setSettings(typeof updates === 'function' ? updates : { ...settings, ...updates });
    setHasChanges(true);
  };

  const updateNotification = (key: keyof NotificationSettings['notifications'], value: boolean) => {
    updateSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    // Show success toast (implement with toast system)
    console.log('Settings saved:', settings);
  };

  const notificationTypes = [
    {
      key: 'likes' as const,
      title: 'Likes',
      description: 'When someone likes your posts or content',
    },
    {
      key: 'comments' as const,
      title: 'Comments',
      description: 'When someone comments on your posts',
    },
    {
      key: 'mentions' as const,
      title: 'Mentions',
      description: 'When someone mentions you',
    },
    {
      key: 'followers' as const,
      title: 'New Followers',
      description: 'When someone follows you',
    },
    {
      key: 'messages' as const,
      title: 'Direct Messages',
      description: 'New messages and message requests',
    },
    {
      key: 'sales' as const,
      title: 'Sales',
      description: 'When your NFTs are sold',
    },
    {
      key: 'offers' as const,
      title: 'Offers',
      description: 'New offers on your NFTs',
    },
    {
      key: 'alerts' as const,
      title: 'Price Alerts',
      description: 'Price movement notifications',
    },
    {
      key: 'community' as const,
      title: 'Community Updates',
      description: 'Updates from communities you follow',
    },
    {
      key: 'marketing' as const,
      title: 'Marketing & Promotions',
      description: 'Product updates and promotional content',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
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
              <Bell className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Master Toggles */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-4">Master Controls</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Enable push notifications on this device
                </div>
              </div>
              <Switch
                checked={settings.pushEnabled}
                onCheckedChange={(checked) => updateSettings({ pushEnabled: checked })}
              />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive notifications via email
                </div>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => updateSettings({ emailEnabled: checked })}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-4">Notification Types</h2>

          <div className="space-y-4">
            {notificationTypes.map((type, index) => (
              <React.Fragment key={type.key}>
                {index > 0 && <div className="h-px bg-border" />}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{type.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications[type.key]}
                    onCheckedChange={(checked) => updateNotification(type.key, checked)}
                    disabled={!settings.pushEnabled && !settings.emailEnabled}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Quiet Mode */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Quiet Mode</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Enable Quiet Mode</div>
                <div className="text-sm text-muted-foreground">
                  Pause notifications during specified hours
                </div>
              </div>
              <Switch
                checked={settings.quietMode.enabled}
                onCheckedChange={(checked) =>
                  updateSettings({
                    ...settings,
                    quietMode: { ...settings.quietMode, enabled: checked },
                  })
                }
              />
            </div>

            {settings.quietMode.enabled && (
              <>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Time</label>
                    <input
                      type="time"
                      value={settings.quietMode.startTime}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          quietMode: {
                            ...settings.quietMode,
                            startTime: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Time</label>
                    <input
                      type="time"
                      value={settings.quietMode.endTime}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          quietMode: {
                            ...settings.quietMode,
                            endTime: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Notifications will be paused from {settings.quietMode.startTime} to{' '}
                  {settings.quietMode.endTime}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 -mx-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset to previous state
                  setHasChanges(false);
                }}
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

export default NotificationSettingsPage;
