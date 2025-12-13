/**
 * CRYB Language Settings Page
 * Language and region preferences
 * v.1 Light Theme Design System
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input, Select } from '../../components/ui/InputV1';
import '../../styles/design-system.css';

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
              <Globe style={{ width: '20px', height: '20px', color: 'var(--brand-primary)' }} />
              <h1 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)'
              }}>Language</h1>
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
        {/* Info Card */}
        <div style={{
          background: 'var(--color-info-light)',
          border: '1px solid var(--brand-primary)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <Globe style={{ width: '20px', height: '20px', color: 'var(--brand-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-primary)' }}>
              <div style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>Language Preferences</div>
              <div style={{ opacity: 0.9 }}>
                Choose your preferred language for the CRYB interface. This will change the
                language of menus, buttons, and system messages.
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            type="search"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Globe style={{ width: '16px', height: '16px' }} />}
          />
        </div>

        {/* Language List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredLanguages.map((language, index) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                background: selectedLanguage === language.code ? 'var(--color-info-light)' : 'transparent',
                border: 'none',
                borderTop: index > 0 ? '1px solid var(--border-subtle)' : 'none',
                cursor: 'pointer',
                transition: 'background var(--transition-normal)'
              }}
              onMouseEnter={(e) => {
                if (selectedLanguage !== language.code) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLanguage !== language.code) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-2xl)' }}>{language.flag}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-primary)'
                  }}>{language.name}</div>
                  <div style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)'
                  }}>
                    {language.nativeName}
                  </div>
                </div>
              </div>
              {selectedLanguage === language.code && (
                <Check style={{ width: '20px', height: '20px', color: 'var(--brand-primary)' }} />
              )}
            </button>
          ))}

          {filteredLanguages.length === 0 && (
            <div style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              No languages found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Additional Settings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)'
          }}>Regional Settings</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <Select
                label="Date Format"
                options={[
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
                ]}
                defaultValue="MM/DD/YYYY"
              />
            </div>

            <div>
              <Select
                label="Time Format"
                options={[
                  { value: '12', label: '12-hour (AM/PM)' },
                  { value: '24', label: '24-hour' }
                ]}
                defaultValue="12"
              />
            </div>

            <div>
              <Select
                label="Number Format"
                options={[
                  { value: 'en-US', label: '1,234.56 (US)' },
                  { value: 'de-DE', label: '1.234,56 (EU)' },
                  { value: 'fr-FR', label: '1 234,56 (FR)' }
                ]}
                defaultValue="en-US"
              />
            </div>

            <div>
              <Select
                label="Currency"
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'JPY', label: 'JPY (¥)' },
                  { value: 'CNY', label: 'CNY (¥)' }
                ]}
                defaultValue="USD"
              />
            </div>
          </div>
        </div>

        {/* Translation Note */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 style={{
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)'
          }}>Help Us Translate</h3>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)'
          }}>
            Want to help make CRYB available in your language? Join our translation community
            and contribute to making the platform more accessible worldwide.
          </p>
          <Button variant="secondary" size="sm">
            Become a Translator
          </Button>
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
                onClick={() => {
                  setSelectedLanguage('en');
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
  );
};

export default LanguageSettingsPage;
