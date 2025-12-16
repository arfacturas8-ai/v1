/**
 * Cryb.ai - Login Page
 * Dedicated login page with modern authentication
 * Master Prompt Standards Applied:
 * - Spacing scale: 4, 8, 16, 24, 32, 48, 64px only
 * - Icons: All exactly 24px in fixed containers
 * - Input heights: 48px
 * - Button heights: 56px (lg)
 * - Responsive padding: 16px mobile, 24px tablet, 80px desktop
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { Button as HeroButton } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
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

  // Determine responsive values
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const isTabletView = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;
  const pagePadding = isDesktop ? '80px' : isTabletView ? '24px' : '16px';

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        paddingLeft: pagePadding,
        paddingRight: pagePadding,
        paddingTop: '48px',
        paddingBottom: '48px',
      }}
      role="main"
      aria-label="Login page"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: isDesktop ? '320px' : '256px',
            height: isDesktop ? '320px' : '256px',
            background: '#58a6ff',
            filter: 'blur(48px)',
            opacity: 0.08,
            top: '64px',
            left: '32px',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: isDesktop ? '320px' : '256px',
            height: isDesktop ? '320px' : '256px',
            background: '#a371f7',
            filter: 'blur(48px)',
            opacity: 0.08,
            bottom: '64px',
            right: '32px',
          }}
        />
      </div>

      {/* Login Card */}
      <div
        className="relative w-full"
        style={{
          zIndex: 10,
          maxWidth: '480px',
        }}
      >
        <div
          className="card card-elevated"
          style={{
            borderRadius: '16px',
            padding: isDesktop ? '48px' : isTabletView ? '32px' : '24px',
            background: 'var(--bg-elevated)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header Section */}
          <div
            className="text-center"
            style={{
              marginBottom: '32px',
            }}
          >
            <div
              className="flex justify-center"
              style={{
                marginBottom: '16px',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                }}
                aria-hidden="true"
              >
                <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                  <Sparkles
                    size={24}
                    strokeWidth={2}
                    style={{ color: 'white' }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
            <h1
              className="font-bold"
              style={{
                fontSize: isDesktop ? '24px' : '20px',
                lineHeight: '1.4',
                marginBottom: '8px',
                color: 'var(--text-primary)',
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'var(--text-secondary)',
              }}
            >
              Enter your credentials to continue
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                color: '#ef4444',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
              role="alert"
              aria-live="assertive"
            >
              {typeof error === 'string' ? error : 'An error occurred'}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col"
            style={{
              gap: '24px',
            }}
          >
            {/* Email Field */}
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label
                htmlFor="email"
                className="block font-medium"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)',
                }}
              >
                Email
              </label>
              <div className="relative">
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
                  }}
                >
                  <Mail
                    size={24}
                    strokeWidth={2}
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input w-full"
                  style={{
                    height: '48px',
                    paddingLeft: '48px',
                    paddingRight: '16px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label
                htmlFor="password"
                className="block font-medium"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)',
                }}
              >
                Password
              </label>
              <div className="relative">
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
                  }}
                >
                  <Lock
                    size={24}
                    strokeWidth={2}
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-hidden="true"
                  />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input w-full"
                  style={{
                    height: '48px',
                    paddingLeft: '48px',
                    paddingRight: '48px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute flex items-center justify-center transition-colors"
                  style={{
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    width: '24px',
                    height: '24px',
                    color: 'var(--text-tertiary)',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={24} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={24} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div
              className="flex items-center justify-between flex-wrap"
              style={{
                gap: '16px',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              <label className="flex items-center cursor-pointer" style={{ gap: '8px' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  name="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="cursor-pointer"
                  style={{
                    width: '16px',
                    height: '16px',
                    flexShrink: 0,
                  }}
                  aria-label="Remember me"
                />
                <span style={{ color: 'var(--text-secondary)' }}>Remember me</span>
              </label>
              <Link
                to="/password-reset"
                className="no-underline transition-colors whitespace-nowrap"
                style={{
                  color: 'var(--brand-primary)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center font-semibold transition-all"
              style={{
                height: '56px',
                paddingLeft: '32px',
                paddingRight: '32px',
                fontSize: '16px',
                lineHeight: '1.5',
                gap: '8px',
                color: 'white',
                background: loading
                  ? 'var(--bg-tertiary)'
                  : 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                borderRadius: '12px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: loading ? 'none' : 'var(--shadow-sm)',
              }}
              aria-label="Sign in to your account"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && (
                <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                  <ArrowRight size={24} strokeWidth={2} aria-hidden="true" />
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            className="flex items-center"
            style={{
              marginTop: '32px',
              marginBottom: '32px',
            }}
          >
            <div
              className="flex-1"
              style={{
                borderTop: '1px solid var(--border-primary)',
              }}
            />
            <span
              style={{
                paddingLeft: '16px',
                paddingRight: '16px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'var(--text-secondary)',
              }}
            >
              or
            </span>
            <div
              className="flex-1"
              style={{
                borderTop: '1px solid var(--border-primary)',
              }}
            />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'var(--text-secondary)',
              }}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium no-underline transition-colors"
                style={{
                  color: 'var(--brand-primary)',
                }}
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div
            className="text-center"
            style={{
              marginTop: '16px',
            }}
          >
            <Link
              to="/"
              className="no-underline transition-colors"
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'var(--text-secondary)',
              }}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
