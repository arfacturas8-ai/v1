/**
 * CRYB Privacy Settings Page
 * Comprehensive privacy controls and data management
 * v.1 Light Theme Design System
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import '../../styles/design-system.css';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              width: '100%',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${value === option.value ? 'var(--brand-primary)' : 'var(--border-default)'}`,
              background: value === option.value ? 'var(--color-info-light)' : 'var(--bg-secondary)',
              transition: 'all var(--transition-normal)',
              textAlign: 'left',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (value !== option.value) {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.background = 'var(--bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (value !== option.value) {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${value === option.value ? 'var(--brand-primary)' : 'var(--text-tertiary)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {value === option.value && (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--brand-primary)'
                  }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                  {option.label}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 'var(--space-20)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        background: 'var(--bg-primary)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background var(--transition-normal)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowLeft style={{ width: '20px', height: '20px' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Eye style={{ width: '20px', height: '20px', color: 'var(--brand-primary)' }} />
              <h1 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)'
              }}>Privacy</h1>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '672px',
        margin: '0 auto',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)'
      }}>
        {/* Profile Visibility */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)'
          }}>Profile Visibility</h2>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)'
          }}>
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
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)'
          }}>Message Permissions</h2>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)'
          }}>
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
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)'
          }}>Activity & Presence</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-primary)'
                }}>Show Activity Status</div>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)'
                }}>
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

            <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-primary)'
                }}>Show in Search Results</div>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)'
                }}>
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
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)'
          }}>Wallet Privacy</h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-primary)'
              }}>Show Wallet Holdings</div>
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)'
              }}>
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
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)'
          }}>Tagging</h2>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)'
          }}>
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
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)'
          }}>Data & Analytics</h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-primary)'
              }}>Share Analytics Data</div>
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)'
              }}>
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
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)'
          }}>Blocked & Muted</h2>

          <button
            onClick={() => navigate('/settings/blocked-accounts')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-primary)'
              }}>Blocked Accounts</div>
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)'
              }}>
                Manage blocked users
              </div>
            </div>
            <ChevronRight style={{ width: '20px', height: '20px', color: 'var(--text-tertiary)' }} />
          </button>

          <button
            onClick={() => navigate('/settings/muted-accounts')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-primary)'
              }}>Muted Accounts</div>
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)'
              }}>
                Manage muted users
              </div>
            </div>
            <ChevronRight style={{ width: '20px', height: '20px', color: 'var(--text-tertiary)' }} />
          </button>

          <button
            onClick={() => navigate('/settings/hidden-words')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-primary)'
              }}>Hidden Words</div>
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)'
              }}>
                Filter content with specific words
              </div>
            </div>
            <ChevronRight style={{ width: '20px', height: '20px', color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div style={{
            position: 'sticky',
            bottom: 0,
            background: 'var(--bg-primary)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid var(--border-subtle)',
            padding: 'var(--space-4)',
            marginLeft: 'calc(-1 * var(--space-4))',
            marginRight: 'calc(-1 * var(--space-4))'
          }}>
            <div style={{
              maxWidth: '672px',
              margin: '0 auto',
              display: 'flex',
              gap: 'var(--space-3)'
            }}>
              <Button
                variant="secondary"
                onClick={() => setHasChanges(false)}
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
  );
};

export default PrivacySettingsPage;
