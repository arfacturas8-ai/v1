/**
 * CRYB Settings Hub Page
 * Central hub for all settings with grouped navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
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
      className={cn(
        'w-full flex items-center justify-between p-4 rounded-lg transition-colors',
        'hover:bg-accent/50 active:bg-accent/70',
        'border border-transparent hover:border-border',
        danger && 'hover:bg-destructive/10 hover:border-destructive/20'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            danger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          )}
        >
          {icon}
        </div>
        <div className="text-left">
          <div className={cn('font-medium', danger && 'text-destructive')}>
            {title}
          </div>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
      <ChevronRight className={cn('h-5 w-5', danger ? 'text-destructive' : 'text-muted-foreground')} />
    </button>
  );
};

interface SettingGroupProps {
  title: string;
  children: React.ReactNode;
}

const SettingGroup: React.FC<SettingGroupProps> = ({ title, children }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2">
        {title}
      </h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* User Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
              {MOCK_USER.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{MOCK_USER.name}</h3>
                {MOCK_USER.verified && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{MOCK_USER.username}</div>
              <div className="text-sm text-muted-foreground">{MOCK_USER.email}</div>
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
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>CRYB Platform v1.0.0</p>
          <p className="mt-1">Made with care for the crypto community</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
