/**
 * CRYB Authentication - Signup Page
 * Complete signup page with wallet connect, email, and OAuth
 */

import React, { useState, useEffect } from 'react';
import { getErrorMessage } from "../../utils/errorUtils";
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Wallet,
  Chrome, Apple, Twitter, AlertCircle, User, CheckCircle2, Gift
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

const WalletProviders = [
  { id: 'metamask', name: 'MetaMask', icon: Wallet, color: '#F6851B' },
  { id: 'walletconnect', name: 'WalletConnect', icon: Wallet, color: '#3B99FC' },
  { id: 'coinbase', name: 'Coinbase', icon: Wallet, color: '#0052FF' },
  { id: 'rainbow', name: 'Rainbow', icon: Wallet, color: '#FF6B6B' },
];

const SocialProviders = [
  { id: 'google', name: 'Google', icon: Chrome, color: '#4285F4' },
  { id: 'apple', name: 'Apple', icon: Apple, color: '#000000' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const [activeTab, setActiveTab] = useState<'wallet' | 'email'>('wallet');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: inviteCode || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string | null>(null);

  // Load invitation details
  useEffect(() => {
    if (inviteCode) {
      // Mock API call to get inviter details
      // In production, this would call /api/invitations/{code}
      const mockInviters = [
        'Johnny', 'Sarah', 'Mike', 'Emily', 'David'
      ];
      setInviterName(mockInviters[Math.floor(Math.random() * mockInviters.length)]);
      setFormData(prev => ({ ...prev, inviteCode }));
    }
  }, [inviteCode]);

  // Password validation
  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'Contains number', met: /[0-9]/.test(formData.password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';
  const allRequirementsMet = passwordRequirements.every((req) => req.met);

  const handleWalletConnect = async (walletId: string) => {
    if (!acceptTerms) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    setWalletConnecting(walletId);
    setError('');

    try {
      // Mock wallet connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Connecting to ${walletId}...`);

      // Navigate to onboarding
      navigate('/auth/onboarding-welcome', { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to connect wallet. Please try again.'));
    } finally {
      setWalletConnecting(null);
    }
  };

  const handleSocialSignup = async (provider: string) => {
    if (!acceptTerms) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mock OAuth
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Signing up with ${provider}...`);

      navigate('/auth/onboarding-welcome', { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err, `Failed to sign up with ${provider}`));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mock signup API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to email verification
      navigate('/auth/verify-email', { state: { email: formData.email } });
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to create account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10" />
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10" />
      </div>

      <Card className="relative z-10 w-full max-w-md bg-white backdrop-blur-xl border-[var(--border-subtle)]">
        <CardContent className="p-8">
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Create your account</h1>
            <p className="text-[var(--text-secondary)]">Join the CRYB community</p>
          </div>

          {/* Invitation banner */}
          {inviteCode && inviterName && (
            <div className="mb-6 p-4 bg-gradient-to-r from-[#58a6ff]/10 to-[#a371f7]/10 border border-[#58a6ff]/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    You've been invited! 🎉
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    <strong className="text-[#58a6ff]">{inviterName}</strong> invited you to join CRYB.
                    Create your account to connect with them and explore the platform.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            </div>
          )}

          {/* Tab selector */}
          <div className="flex gap-2 p-1 mb-6 bg-[var(--bg-secondary)] rounded-lg">
            <button
              onClick={() => setActiveTab('wallet')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                activeTab === 'wallet'
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              Wallet
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                activeTab === 'email'
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              Email
            </button>
          </div>

          {/* Wallet tab */}
          {activeTab === 'wallet' && (
            <div className="space-y-4 mb-6">
              {WalletProviders.map((wallet) => {
                const WalletIcon = wallet.icon;
                const isConnecting = walletConnecting === wallet.id;

                return (
                  <Button
                    key={wallet.id}
                    variant="outline"
                    fullWidth
                    size="lg"
                    onClick={() => handleWalletConnect(wallet.id)}
                    disabled={!!walletConnecting}
                    loading={isConnecting}
                    className="bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-gray-50 justify-start"
                  >
                    <WalletIcon className="w-5 h-5 mr-3" style={{ color: wallet.color }} />
                    {isConnecting ? 'Connecting...' : `Connect with ${wallet.name}`}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Email tab */}
          {activeTab === 'email' && (
            <div className="space-y-4 mb-6">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <Input
                  type="text"
                  label="Username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />

                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    required
                  />

                  {/* Password requirements */}
                  {formData.password && (
                    <div className="mt-3 space-y-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          {req.met ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                          )}
                          <span className={cn('text-xs', req.met ? 'text-green-500' : 'text-gray-500')}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    required
                  />

                  {formData.confirmPassword && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-500">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={loading}
                  disabled={loading || !allRequirementsMet || !passwordsMatch}
                  className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90"
                >
                  Create account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          )}

          {/* Social OAuth */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-subtle)]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-[var(--text-secondary)]">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {SocialProviders.map((provider) => {
                const ProviderIcon = provider.icon;
                return (
                  <Button
                    key={provider.id}
                    variant="outline"
                    size="lg"
                    onClick={() => handleSocialSignup(provider.id)}
                    disabled={loading}
                    className="bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-gray-50"
                  >
                    <ProviderIcon className="w-5 h-5" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="flex-shrink-0 cursor-pointer"
                style={{ width: '16px !important', height: '16px', minWidth: '5px', minHeight: '16px' }}
              />
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {/* Sign in link */}
          <div className="text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Sign in
            </Link>
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
