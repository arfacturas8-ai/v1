/**
 * CRYB Notification Settings Page
 * Comprehensive notification preferences with granular controls
 * v.1 Light Theme Design System
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Moon } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/InputV1';
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
          background: 'rgba(248, 249, 250, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ maxWidth: '672px', margin: '0 auto', padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              onClick={() => navigate('/settings')}
              style={{
                padding: 'var(--space-2)',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'background var(--transition-normal)',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowLeft size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Bell size={20} style={{ color: 'var(--brand-primary)' }} />
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                Notifications
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '672px', margin: '0 auto', padding: 'var(--space-4) var(--space-4) var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Master Toggles */}
          <div className="card">
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-4)'
            }}>
              Master Controls
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                    Push Notifications
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Enable push notifications on this device
                  </div>
                </div>
                <Switch
                  checked={settings.pushEnabled}
                  onCheckedChange={(checked) => updateSettings({ pushEnabled: checked })}
                />
              </div>

              <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                    Email Notifications
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
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
          <div className="card">
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-4)'
            }}>
              Notification Types
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {notificationTypes.map((type, index) => (
                <React.Fragment key={type.key}>
                  {index > 0 && <div style={{ height: '1px', background: 'var(--border-subtle)' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                        {type.title}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
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
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <Moon size={20} style={{ color: 'var(--brand-primary)' }} />
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                Quiet Mode
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                    Enable Quiet Mode
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
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
                  <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                      <label
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-medium)',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--space-2)',
                          display: 'block'
                        }}
                      >
                        Start Time
                      </label>
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
                        className="input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-medium)',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--space-2)',
                          display: 'block'
                        }}
                      >
                        End Time
                      </label>
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
                        className="input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Notifications will be paused from {settings.quietMode.startTime} to{' '}
                    {settings.quietMode.endTime}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                background: 'rgba(248, 249, 250, 0.95)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderTop: '1px solid var(--border-subtle)',
                padding: 'var(--space-4)',
                marginLeft: 'calc(-1 * var(--space-4))',
                marginRight: 'calc(-1 * var(--space-4))'
              }}
            >
              <div style={{ maxWidth: '672px', margin: '0 auto', display: 'flex', gap: 'var(--space-3)' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Reset to previous state
                    setHasChanges(false);
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  loading={isSaving}
                  style={{ flex: 1 }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
