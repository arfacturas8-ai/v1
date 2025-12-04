/**
 * CRYB Language Settings Page
 * Language and region preferences
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LanguageSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  ];

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    setHasChanges(code !== 'en');
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    console.log('Language settings saved:', selectedLanguage);
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
              <Globe className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Language</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-500">
              <div className="font-medium mb-1">Language Preferences</div>
              <div className="opacity-90">
                Choose your preferred language for the CRYB interface. This will change the
                language of menus, buttons, and system messages.
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <Input
            type="search"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Globe className="h-4 w-4" />}
          />
        </div>

        {/* Language List */}
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {filteredLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={cn(
                'w-full flex items-center justify-between p-4 transition-colors',
                'hover:bg-accent/50 active:bg-accent/70',
                selectedLanguage === language.code && 'bg-primary/5'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{language.flag}</span>
                <div className="text-left">
                  <div className="font-medium">{language.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {language.nativeName}
                  </div>
                </div>
              </div>
              {selectedLanguage === language.code && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}

          {filteredLanguages.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No languages found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Additional Settings */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Regional Settings</h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Format</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Time Format</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="12">12-hour (AM/PM)</option>
                <option value="24">24-hour</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Number Format</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="en-US">1,234.56 (US)</option>
                <option value="de-DE">1.234,56 (EU)</option>
                <option value="fr-FR">1 234,56 (FR)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Currency</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CNY">CNY (¥)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Translation Note */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h3 className="font-semibold">Help Us Translate</h3>
          <p className="text-sm text-muted-foreground">
            Want to help make CRYB available in your language? Join our translation community
            and contribute to making the platform more accessible worldwide.
          </p>
          <Button variant="outline" size="sm">
            Become a Translator
          </Button>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 -mx-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedLanguage('en');
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

export default LanguageSettingsPage;
