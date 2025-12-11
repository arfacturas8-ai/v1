/**
 * CRYB Authentication - Login Page
 * Complete login page with wallet connect, email magic link, and OAuth
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Wallet,
  Chrome, Apple, Twitter, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

// Wallet provider icons (mock SVG paths for now)
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

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'wallet' | 'email'>('wallet');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleWalletConnect = async (walletId: string) => {
    if (!acceptTerms) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    setWalletConnecting(walletId);
    setError('');

    try {
      // Mock wallet connection - replace with actual wallet integration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate successful connection
      console.log(`Connecting to ${walletId}...`);

      // Navigate to onboarding or home
      const from = location.state?.from?.pathname || '/auth/onboarding-welcome';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setWalletConnecting(null);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (!acceptTerms) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mock OAuth - replace with actual OAuth integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Logging in with ${provider}...`);

      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || `Failed to login with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mock magic link send - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mock login - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0D0D0D] relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10 " />
          <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10 " />
        </div>

        <Card className="relative z-10 w-full max-w-md bg-[#141414]/80 backdrop-blur-xl border-white/10">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">Check your email</h1>
            <p className="text-gray-400 mb-6">
              We've sent a magic link to <span className="text-white font-medium">{formData.email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to sign in. The link will expire in 15 minutes.
            </p>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setMagicLinkSent(false)}
              className="bg-transparent border-white/20 text-white hover:bg-white/5"
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0D0D0D] relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10" />
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10" />
      </div>

      <Card className="relative z-10 w-full max-w-md bg-[#141414]/80 backdrop-blur-xl border-white/10">
        <CardContent className="p-8">
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">Welcome back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Tab selector */}
          <div className="flex gap-2 p-1 mb-6 bg-[#0D0D0D] rounded-lg">
            <button
              onClick={() => setActiveTab('wallet')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                activeTab === 'wallet'
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                  : 'text-gray-400 hover:text-white'
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
                  : 'text-gray-400 hover:text-white'
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
                    className="bg-[#0D0D0D] border-white/20 text-white hover:bg-white/5 justify-start"
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
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
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

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }}
                      className="flex-shrink-0 rounded border-2 border-white/20 bg-[#0D0D0D] text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-[#141414] cursor-pointer transition-colors hover:border-white/40"
                    />
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                  </label>
                  <Link to="/auth/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={loading}
                  disabled={loading}
                  className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90"
                >
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#141414] text-gray-400">Or sign in with magic link</span>
                </div>
              </div>

              <Button
                variant="outline"
                fullWidth
                size="lg"
                onClick={handleMagicLink}
                disabled={loading || !formData.email}
                className="bg-[#0D0D0D] border-white/20 text-white hover:bg-white/5"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send magic link
              </Button>
            </div>
          )}

          {/* Social OAuth */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#141414] text-gray-400">Or continue with</span>
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
                    onClick={() => handleSocialLogin(provider.id)}
                    disabled={loading}
                    className="bg-[#0D0D0D] border-white/20 text-white hover:bg-white/5"
                  >
                    <ProviderIcon className="w-5 h-5" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', marginTop: '2px' }}
                className="flex-shrink-0 rounded border-2 border-white/20 bg-[#0D0D0D] text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-[#141414] cursor-pointer transition-colors hover:border-white/40"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {/* Sign up link */}
          <div className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign up for free
            </Link>
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
