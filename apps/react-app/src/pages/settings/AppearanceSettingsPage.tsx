/**
 * CRYB Appearance Settings Page
 * Theme, colors, and display customization
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

  const accentColors: Array<{ value: AccentColor; color: string; name: string }> = [
    { value: 'blue', color: 'bg-blue-500', name: 'Blue' },
    { value: 'purple', color: 'bg-purple-500', name: 'Purple' },
    { value: 'green', color: 'bg-green-500', name: 'Green' },
    { value: 'orange', color: 'bg-orange-500', name: 'Orange' },
    { value: 'pink', color: 'bg-pink-500', name: 'Pink' },
    { value: 'cyan', color: 'bg-cyan-500', name: 'Cyan' },
  ];

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
              <Palette className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Appearance</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Theme Mode */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Theme</h2>
          <p className="text-sm text-muted-foreground">
            Choose how CRYB looks to you
          </p>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleThemeChange('light')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                themeMode === 'light'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <Sun className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="font-medium">Light</div>
              </div>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                themeMode === 'dark'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center">
                  <Moon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="font-medium">Dark</div>
              </div>
            </button>

            <button
              onClick={() => handleThemeChange('system')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                themeMode === 'system'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white to-gray-900 border border-gray-400 flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-gray-600" />
                </div>
                <div className="font-medium">System</div>
              </div>
            </button>
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Accent Color</h2>
          <p className="text-sm text-muted-foreground">
            Choose your preferred accent color
          </p>

          <div className="grid grid-cols-3 gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentColorChange(color.value)}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all',
                  accentColor === color.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg',
                      color.color,
                      accentColor === color.value && 'ring-2 ring-offset-2 ring-primary'
                    )}
                  />
                  <div className="font-medium">{color.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Font Size</h2>
          <p className="text-sm text-muted-foreground">
            Adjust the text size across the app
          </p>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleFontSizeChange('small')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                fontSize === 'small'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="text-sm font-medium">Aa</div>
                <div className="text-xs">Small</div>
              </div>
            </button>

            <button
              onClick={() => handleFontSizeChange('medium')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                fontSize === 'medium'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="text-base font-medium">Aa</div>
                <div className="text-xs">Medium</div>
              </div>
            </button>

            <button
              onClick={() => handleFontSizeChange('large')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                fontSize === 'large'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="text-lg font-medium">Aa</div>
                <div className="text-xs">Large</div>
              </div>
            </button>
          </div>
        </div>

        {/* Display Options */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Display Options</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Reduce Motion</div>
                <div className="text-sm text-muted-foreground">
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

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Compact Mode</div>
                <div className="text-sm text-muted-foreground">
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
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Preview</h2>
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
              <div className="flex-1">
                <div className="font-medium">Sample User</div>
                <div className="text-sm text-muted-foreground">@sampleuser</div>
              </div>
            </div>
            <p className="text-sm">
              This is a preview of how your content will appear with your current settings.
              The quick brown fox jumps over the lazy dog.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="primary">
                Primary Button
              </Button>
              <Button size="sm" variant="outline">
                Secondary Button
              </Button>
            </div>
          </div>
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

export default AppearanceSettingsPage;
