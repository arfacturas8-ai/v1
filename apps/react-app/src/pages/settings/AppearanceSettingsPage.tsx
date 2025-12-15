/**
 * CRYB Appearance Settings Page
 * Theme, colors, and display customization
 * v.1 Light Theme Design System
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, Sun, Moon, Monitor } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
type FontSize = 'small' | 'medium' | 'large';

const AppearanceSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [themeMode, setThemeMode] = useState<ThemeMode>(
    theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'system'
  );
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    if (mode !== 'system') {
      setTheme(mode);
    } else {
      // Set based on system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
    }
    setHasChanges(true);
  };

  const handleAccentColorChange = (color: AccentColor) => {
    setAccentColor(color);
    setHasChanges(true);
    // Apply accent color to CSS variables
    document.documentElement.style.setProperty(
      '--accent-color',
      getAccentColorValue(color)
    );
  };

  const getAccentColorValue = (color: AccentColor): string => {
    const colors: Record<AccentColor, string> = {
      blue: '#3B82F6',
      purple: '#A855F7',
      green: '#10B981',
      orange: '#F97316',
      pink: '#EC4899',
      cyan: '#06B6D4',
    };
    return colors[color];
  };

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    setHasChanges(true);
    // Apply font size
    const sizes: Record<FontSize, string> = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    document.documentElement.style.setProperty('--base-font-size', sizes[size]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    console.log('Appearance settings saved');
  };

  const accentColors: Array<{ value: AccentColor; colorHex: string; name: string }> = [
    { value: 'blue', colorHex: '#3B82F6', name: 'Blue' },
    { value: 'purple', colorHex: '#A855F7', name: 'Purple' },
    { value: 'green', colorHex: '#10B981', name: 'Green' },
    { value: 'orange', colorHex: '#F97316', name: 'Orange' },
    { value: 'pink', colorHex: '#EC4899', name: 'Pink' },
    { value: 'cyan', colorHex: '#06B6D4', name: 'Cyan' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 'var(--space-20)' }}>
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
              <Palette size={20} style={{ color: 'var(--brand-primary)' }} />
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                Appearance
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '672px', margin: '0 auto', padding: 'var(--space-4) var(--space-4) var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Theme Mode */}
          <div className="card">
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)'
            }}>
              Theme
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Choose how CRYB looks to you
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-4)'
            }}>
              <button
                onClick={() => handleThemeChange('light')}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: themeMode === 'light' ? '2px solid var(--brand-primary)' : '2px solid var(--border-subtle)',
                  background: themeMode === 'light' ? 'rgba(88, 166, 255, 0.05)' : 'transparent',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (themeMode !== 'light') e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  if (themeMode !== 'light') e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Sun size={24} style={{ color: '#EAB308' }} />
                  </div>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>Light</div>
                </div>
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: themeMode === 'dark' ? '2px solid var(--brand-primary)' : '2px solid var(--border-subtle)',
                  background: themeMode === 'dark' ? 'rgba(88, 166, 255, 0.05)' : 'transparent',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (themeMode !== 'dark') e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  if (themeMode !== 'dark') e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid #374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Moon size={24} style={{ color: '#60A5FA' }} />
                  </div>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>Dark</div>
                </div>
              </button>

              <button
                onClick={() => handleThemeChange('system')}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: themeMode === 'system' ? '2px solid var(--brand-primary)' : '2px solid var(--border-subtle)',
                  background: themeMode === 'system' ? 'rgba(88, 166, 255, 0.05)' : 'transparent',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (themeMode !== 'system') e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  if (themeMode !== 'system') e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(to bottom right, #FFFFFF 0%, #111827 100%)',
                    border: '1px solid #9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Monitor size={24} style={{ color: '#6B7280' }} />
                  </div>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>System</div>
                </div>
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div className="card">
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)'
            }}>
              Accent Color
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Choose your preferred accent color
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-4)'
            }}>
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleAccentColorChange(color.value)}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: accentColor === color.value ? '2px solid var(--brand-primary)' : '2px solid var(--border-subtle)',
                    background: accentColor === color.value ? 'rgba(88, 166, 255, 0.05)' : 'transparent',
                    transition: 'all var(--transition-normal)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (accentColor !== color.value) e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    if (accentColor !== color.value) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-lg)',
                        background: color.colorHex,
                        boxShadow: accentColor === color.value ? '0 0 0 2px var(--bg-secondary), 0 0 0 4px var(--brand-primary)' : 'none'
                      }}
                    />
                    <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>{color.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="card">
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)'
            }}>
              Font Size
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
              Adjust the text size across the app
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-4)'
            }}>
              <button
                onClick={() => handleFontSizeChange('small')}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: fontSize === 'small' ? '2px solid var(--brand-primary)' : '2px solid var(--border-subtle)',
                  background: fontSize === 'small' ? 'rgba(88, 166, 255, 0.05)' : 'transparent',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (fontSize !== 'small') e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  if (fontSize !== 'small') e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>Aa</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Small</div>
                </div>
              </button>

              <button
                onClick={() => handleFontSizeChange('medium')}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: fontSize === 'medium' ? '2px solid var(--brand-primary)' : '2px solid var(--border-subtle)',
                  background: fontSize === 'medium' ? 'rgba(88, 166, 255, 0.05)' : 'transparent',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (fontSize !== 'medium') e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  if (fontSize !== 'medium') e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>Aa</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Medium</div>
                </div>
              </button>

              <button
                onClick={() => handleFontSizeChange('large')}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: fontSize === 'large' ? '2px solid var(--brand-primary)' : '2px solid var(--border-subtle)',
                  background: fontSize === 'large' ? 'rgba(88, 166, 255, 0.05)' : 'transparent',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (fontSize !== 'large') e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  if (fontSize !== 'large') e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>Aa</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Large</div>
                </div>
              </button>
            </div>
          </div>

          {/* Display Options */}
          <div className="card">
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)'
            }}>
              Display Options
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                    Reduce Motion
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Minimize animations and transitions
                  </div>
                </div>
                <Switch
                  checked={reduceMotion}
                  onCheckedChange={(checked) => {
                    setReduceMotion(checked);
                    setHasChanges(true);
                  }}
                />
              </div>

              <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                    Compact Mode
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Show more content with tighter spacing
                  </div>
                </div>
                <Switch
                  checked={compactMode}
                  onCheckedChange={(checked) => {
                    setCompactMode(checked);
                    setHasChanges(true);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)'
            }}>
              Preview
            </h2>
            <div style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              marginTop: 'var(--space-4)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--brand-gradient)'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>Sample User</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>@sampleuser</div>
                  </div>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  This is a preview of how your content will appear with your current settings.
                  The quick brown fox jumps over the lazy dog.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button size="sm" variant="primary">
                    Primary Button
                  </Button>
                  <Button size="sm" variant="secondary">
                    Secondary Button
                  </Button>
                </div>
              </div>
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
    </div>
  );
};

export default AppearanceSettingsPage;
