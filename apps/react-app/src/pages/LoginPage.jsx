/**
 * Cryb.ai - Login Page
 * Dedicated login page with modern authentication
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { useResponsive } from '../hooks/useResponsive';
import { getErrorMessage } from '../utils/errorUtils';

export default function LoginPage() {
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password, rememberMe);
      if (result.success) {
        const from = location.state?.from?.pathname || '/home';
        navigate(from, { replace: true });
      } else {
        setError(getErrorMessage(result.error, 'Login failed. Please check your credentials.'));
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 py-3 sm:px-3 sm:py-3 pb-6 sm:pb-3 relative overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} role="main" aria-label="Login page">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-[48px] opacity-[0.08] bg-[#58a6ff] top-10 sm:top-[60px] left-5 sm:left-[30px]" />
        <div className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-[48px] opacity-[0.08] bg-[#a371f7] bottom-10 sm:bottom-[60px] right-5 sm:right-[30px]" />
      </div>

      <div className="relative z-10 w-full max-w-full sm:max-w-[480px] md:max-w-[440px]">
        <div className="card card-elevated rounded-2xl p-3.5 sm:p-4">
          <div className="text-center mb-3 sm:mb-2.5">
            <div className="flex justify-center mb-1.5 sm:mb-[5px]">
              <div className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center" aria-hidden="true">
                <Sparkles className="h-5.5 w-5.5 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-xl sm:text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
            <p className="text-sm sm:text-[13px]" style={{ color: 'var(--text-secondary)' }}>Enter your cryb</p>
          </div>

          {error && (
            <div
              className="mb-2 px-2.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs sm:text-xs"
              role="alert"
              aria-live="assertive"
            >
              {typeof error === 'string' ? error : 'An error occurred'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-2">
            <div className="flex flex-col">
              <label htmlFor="email" className="block text-xs sm:text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input w-full pl-[34px] pr-[34px] py-2.5 sm:py-2 text-base sm:text-[13px] min-h-[44px]"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="block text-xs sm:text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input w-full pl-[34px] pr-[34px] py-2.5 sm:py-2 text-base sm:text-[13px] min-h-[44px]"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer p-1 flex items-center transition-colors min-h-[44px] min-w-[44px]"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs flex-wrap gap-1.5 sm:gap-0 sm:flex-nowrap">
              <label className="flex items-center cursor-pointer gap-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  name="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="flex-shrink-0 cursor-pointer"
                  style={{ width: '16px !important', height: '16px', minWidth: '5px', minHeight: '16px' }}
                  aria-label="Remember me"
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remember me</span>
              </label>
              <Link to="/password-reset" className="no-underline transition-colors whitespace-nowrap" style={{ color: 'var(--brand-primary)' }}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              className="btn btn-primary w-full min-h-[44px] flex items-center justify-center gap-1.5"
              aria-label="Sign in to your account"
            >
              Sign in
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          <div className="my-3 sm:my-2.5 flex items-center">
            <div className="flex-1" style={{ borderTop: '1px solid var(--border-subtle)' }}></div>
            <span className="px-2.5 text-xs sm:text-xs" style={{ color: 'var(--text-secondary)' }}>or</span>
            <div className="flex-1" style={{ borderTop: '1px solid var(--border-subtle)' }}></div>
          </div>

          <div className="text-center">
            <p className="text-sm sm:text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium no-underline transition-colors"
                style={{ color: 'var(--brand-primary)' }}
              >
                Sign up for free
              </Link>
            </p>
          </div>

          <div className="mt-2 sm:mt-1.5 text-center">
            <Link
              to="/"
              className="text-xs sm:text-xs no-underline transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

