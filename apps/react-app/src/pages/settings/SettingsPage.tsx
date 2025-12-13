/**
 * CRYB Settings Hub Page
 * Central hub for all settings with grouped navigation
 * Updated to use Design System v2.0 - Light Theme
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  CreditCard,
  Wallet,
  Bell,
  Lock,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  Mail,
  Bug,
  Info,
  FileText,
  Eye,
  AlertTriangle,
  Trash2,
  ChevronRight,
} from 'lucide-react';

// Mock user data - replace with actual user context/API
const MOCK_USER = {
  name: 'John Doe',
  username: '@johndoe',
  email: 'john@example.com',
  avatar: null,
  verified: true,
};

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  description,
  onClick,
  danger = false,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4)',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? 'var(--color-error-light)' : 'var(--bg-hover)';
        e.currentTarget.style.borderColor = danger ? 'var(--color-error)' : 'var(--border-default)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div
          style={{
            flexShrink: 0,
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: danger ? 'var(--color-error-light)' : 'var(--color-info-light)',
            color: danger ? 'var(--color-error)' : 'var(--brand-primary)',
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 'var(--font-medium)', color: danger ? 'var(--color-error)' : 'var(--text-primary)' }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              {description}
            </div>
          )}
        </div>
      </div>
      <ChevronRight size={20} style={{ color: danger ? 'var(--color-error)' : 'var(--text-tertiary)' }} />
    </button>
  );
};

interface SettingGroupProps {
  title: string;
  children: React.ReactNode;
}

const SettingGroup: React.FC<SettingGroupProps> = ({ title, children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <h2 style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '0 var(--space-2)',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>{children}</div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ maxWidth: '672px', margin: '0 auto', padding: 'var(--space-4)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
            Settings
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '672px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {/* User Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-inverse)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
            }}>
              {MOCK_USER.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h3 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                  {MOCK_USER.name}
                </h3>
                {MOCK_USER.verified && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--brand-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="12" height="12" fill="white" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{MOCK_USER.username}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{MOCK_USER.email}</div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <SettingGroup title="Account">
          <SettingItem
            icon={<User className="h-5 w-5" />}
            title="Profile"
            description="Edit your public profile information"
            onClick={() => navigate('/settings/profile')}
          />
          <SettingItem
            icon={<CreditCard className="h-5 w-5" />}
            title="Account Details"
            description="Manage your account information"
            onClick={() => navigate('/settings/account')}
          />
          <SettingItem
            icon={<Wallet className="h-5 w-5" />}
            title="Wallets"
            description="Manage your connected wallets"
            onClick={() => navigate('/settings/wallets')}
          />
        </SettingGroup>

        {/* Preferences */}
        <SettingGroup title="Preferences">
          <SettingItem
            icon={<Bell className="h-5 w-5" />}
            title="Notifications"
            description="Customize your notification preferences"
            onClick={() => navigate('/settings/notifications')}
          />
          <SettingItem
            icon={<Eye className="h-5 w-5" />}
            title="Privacy"
            description="Control your privacy and data"
            onClick={() => navigate('/settings/privacy')}
          />
          <SettingItem
            icon={<Shield className="h-5 w-5" />}
            title="Security"
            description="Manage security settings and sessions"
            onClick={() => navigate('/settings/security')}
          />
          <SettingItem
            icon={<Palette className="h-5 w-5" />}
            title="Appearance"
            description="Customize theme and display"
            onClick={() => navigate('/settings/appearance')}
          />
          <SettingItem
            icon={<Globe className="h-5 w-5" />}
            title="Language"
            description="Change language and region"
            onClick={() => navigate('/settings/language')}
          />
        </SettingGroup>

        {/* Support */}
        <SettingGroup title="Support">
          <SettingItem
            icon={<HelpCircle className="h-5 w-5" />}
            title="Help Center"
            description="Get help and support"
            onClick={() => navigate('/help')}
          />
          <SettingItem
            icon={<Mail className="h-5 w-5" />}
            title="Contact Us"
            description="Send us a message"
            onClick={() => navigate('/contact')}
          />
          <SettingItem
            icon={<Bug className="h-5 w-5" />}
            title="Report a Bug"
            description="Help us improve CRYB"
            onClick={() => navigate('/report-bug')}
          />
        </SettingGroup>

        {/* About */}
        <SettingGroup title="About">
          <SettingItem
            icon={<Info className="h-5 w-5" />}
            title="About CRYB"
            description="Version 1.0.0"
            onClick={() => navigate('/about')}
          />
          <SettingItem
            icon={<FileText className="h-5 w-5" />}
            title="Terms of Service"
            description="Read our terms"
            onClick={() => navigate('/terms')}
          />
          <SettingItem
            icon={<Lock className="h-5 w-5" />}
            title="Privacy Policy"
            description="Read our privacy policy"
            onClick={() => navigate('/privacy-policy')}
          />
          <SettingItem
            icon={<FileText className="h-5 w-5" />}
            title="Open Source Licenses"
            description="View third-party licenses"
            onClick={() => navigate('/licenses')}
          />
        </SettingGroup>

        {/* Danger Zone */}
        <SettingGroup title="Danger Zone">
          <SettingItem
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Deactivate Account"
            description="Temporarily disable your account"
            onClick={() => navigate('/settings/deactivate')}
            danger
          />
          <SettingItem
            icon={<Trash2 className="h-5 w-5" />}
            title="Delete Account"
            description="Permanently delete your account"
            onClick={() => navigate('/settings/delete-account')}
            danger
          />
        </SettingGroup>

        {/* Footer Info */}
        <div style={{
          textAlign: 'center',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          padding: 'var(--space-4) 0',
        }}>
          <p>CRYB Platform v1.0.0</p>
          <p style={{ marginTop: 'var(--space-1)' }}>Made with care for the crypto community</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
