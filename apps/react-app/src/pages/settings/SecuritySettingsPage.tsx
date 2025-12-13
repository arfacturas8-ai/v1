/**
 * CRYB Security Settings Page
 * Security settings, sessions, and two-factor authentication
 * Updated to use Design System v2.0 - Light Theme
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Key, Smartphone, Monitor, AlertCircle, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/InputV1';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../components/ui/modal';
import { formatRelativeTime } from '../../lib/utils';

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 'var(--space-20)' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              onClick={() => navigate('/settings')}
              className="btn-ghost"
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Shield size={20} style={{ color: 'var(--brand-primary)' }} />
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                Security
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '672px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Password */}
        <div className="card">
          <h2 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
            Password
          </h2>
          <Button
            variant="outline"
            onClick={() => setShowChangePassword(true)}
            leftIcon={<Key size={16} />}
          >
            Change Password
          </Button>
        </div>

        {/* Two-Factor Authentication */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                Two-Factor Authentication
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                Add an extra layer of security to your account
              </p>
            </div>
            {twoFactorEnabled && (
              <div style={{
                background: 'var(--color-success-light)',
                color: 'var(--color-success)',
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
              }}>
                Enabled
              </div>
            )}
          </div>
          <Button
            variant={twoFactorEnabled ? 'outline' : 'primary'}
            onClick={() => setShow2FASetup(true)}
            leftIcon={<Shield size={16} />}
          >
            {twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
          </Button>
        </div>

        {/* Active Sessions */}
        <div className="card">
          <h2 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            Active Sessions
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
            Manage and monitor devices that have access to your account
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {sessions.map((session, index) => (
              <div
                key={session.id}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: session.current ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                  background: session.current ? 'var(--color-info-light)' : 'transparent',
                  transition: 'all var(--transition-normal)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                    <div style={{ marginTop: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>{session.device}</div>
                        {session.current && (
                          <span style={{
                            fontSize: 'var(--text-xs)',
                            background: 'var(--brand-primary)',
                            color: 'white',
                            padding: '2px var(--space-2)',
                            borderRadius: 'var(--radius-full)',
                          }}>
                            Current
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                        {session.location} · {session.ip}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
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
        <div className="card">
          <h2 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
            Login History
          </h2>
          <Button
            variant="outline"
            onClick={() => navigate('/settings/security/login-history')}
          >
            View Login History
          </Button>
        </div>

        {/* Connected Apps */}
        <div className="card">
          <h2 style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            Connected Apps
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
            Apps and services that have access to your CRYB account
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {connectedApps.map((app) => (
              <div
                key={app.id}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'border-color var(--transition-normal)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: 1 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--brand-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'var(--font-bold)',
                    }}>
                      {app.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>{app.name}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                        {app.permissions.join(', ')}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
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
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
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
