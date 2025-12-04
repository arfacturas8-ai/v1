/**
 * CRYB Security Settings Page
 * Security settings, sessions, and two-factor authentication
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Key, Smartphone, Monitor, AlertCircle, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../components/ui/modal';
import { cn, formatRelativeTime } from '../../lib/utils';

interface Session {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location: string;
  ip: string;
  lastActive: Date;
  current: boolean;
}

interface ConnectedApp {
  id: string;
  name: string;
  icon?: string;
  permissions: string[];
  connectedAt: Date;
  lastUsed: Date;
}

const SecuritySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [appToRevoke, setAppToRevoke] = useState<ConnectedApp | null>(null);

  // Mock data
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Chrome on MacBook Pro',
      deviceType: 'desktop',
      location: 'San Francisco, CA',
      ip: '192.168.1.1',
      lastActive: new Date(Date.now() - 1000 * 60 * 5),
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone 14',
      deviceType: 'mobile',
      location: 'San Francisco, CA',
      ip: '192.168.1.100',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
      current: false,
    },
    {
      id: '3',
      device: 'Firefox on Windows 11',
      deviceType: 'desktop',
      location: 'Los Angeles, CA',
      ip: '10.0.0.1',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24),
      current: false,
    },
  ]);

  const [connectedApps] = useState<ConnectedApp[]>([
    {
      id: '1',
      name: 'OpenSea',
      permissions: ['Read wallet balance', 'View NFTs'],
      connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: '2',
      name: 'Uniswap',
      permissions: ['Read wallet balance', 'Sign transactions'],
      connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
  ]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getDeviceIcon = (type: Session['deviceType']) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'desktop':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // API call to change password
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setShowChangePassword(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleRevokeSession = async (sessionId: string) => {
    // API call to revoke session
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSessionToRevoke(null);
  };

  const handleRevokeApp = async (appId: string) => {
    // API call to revoke app access
    await new Promise((resolve) => setTimeout(resolve, 500));
    setAppToRevoke(null);
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
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Security</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Password */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Password</h2>
          <Button
            variant="outline"
            onClick={() => setShowChangePassword(true)}
            leftIcon={<Key className="h-4 w-4" />}
          >
            Change Password
          </Button>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-lg">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
            {twoFactorEnabled && (
              <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-medium">
                Enabled
              </div>
            )}
          </div>
          <Button
            variant={twoFactorEnabled ? 'outline' : 'primary'}
            onClick={() => setShow2FASetup(true)}
            leftIcon={<Shield className="h-4 w-4" />}
          >
            {twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
          </Button>
        </div>

        {/* Active Sessions */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Active Sessions</h2>
          <p className="text-sm text-muted-foreground">
            Manage and monitor devices that have access to your account
          </p>

          <div className="space-y-3">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className={cn(
                  'p-4 rounded-lg border',
                  session.current
                    ? 'bg-primary/5 border-primary/20'
                    : 'border-border hover:border-border/60'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 text-muted-foreground">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{session.device}</div>
                        {session.current && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {session.location} · {session.ip}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last active {formatRelativeTime(session.lastActive)}
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSessionToRevoke(session)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login History */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Login History</h2>
          <Button
            variant="outline"
            onClick={() => navigate('/settings/security/login-history')}
          >
            View Login History
          </Button>
        </div>

        {/* Connected Apps */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Connected Apps</h2>
          <p className="text-sm text-muted-foreground">
            Apps and services that have access to your CRYB account
          </p>

          <div className="space-y-3">
            {connectedApps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-lg border border-border hover:border-border/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {app.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{app.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {app.permissions.join(', ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last used {formatRelativeTime(app.lastUsed)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAppToRevoke(app)}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}

            {connectedApps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No connected apps
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        size="default"
      >
        <ModalHeader>
          <ModalTitle>Change Password</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              type="password"
              label="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              required
            />
            <Input
              type="password"
              label="New Password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              required
            />
            <Input
              type="password"
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              required
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowChangePassword(false)}>
            Cancel
          </Button>
          <Button onClick={handleChangePassword}>
            Change Password
          </Button>
        </ModalFooter>
      </Modal>

      {/* Revoke Session Confirmation */}
      <Modal
        open={!!sessionToRevoke}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Revoke Session</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Are you sure you want to revoke access for{' '}
              <strong>{sessionToRevoke?.device}</strong>? You will need to log in again on
              that device.
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setSessionToRevoke(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => sessionToRevoke && handleRevokeSession(sessionToRevoke.id)}
          >
            Revoke Access
          </Button>
        </ModalFooter>
      </Modal>

      {/* Revoke App Confirmation */}
      <Modal
        open={!!appToRevoke}
        onOpenChange={(open) => !open && setAppToRevoke(null)}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Revoke App Access</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Are you sure you want to revoke access for <strong>{appToRevoke?.name}</strong>?
              This app will no longer have access to your account.
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setAppToRevoke(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => appToRevoke && handleRevokeApp(appToRevoke.id)}
          >
            Revoke Access
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SecuritySettingsPage;
