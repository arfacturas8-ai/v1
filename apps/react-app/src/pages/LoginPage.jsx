/**
 * Cryb.ai - Login Page
 * Modern iOS Aesthetic - Ultra Clean & Minimal
 *
 * DESIGN PRINCIPLES:
 * - Light theme with soft shadows
 * - Delicate borders and refined inputs
 * - Generous whitespace
 * - System font feel
 * - Smooth transitions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
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

  // Responsive breakpoints
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const isTabletView = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#FAFAFA',
        color: '#000000',
        paddingLeft: isDesktop ? '48px' : isTabletView ? '24px' : '20px',
        paddingRight: isDesktop ? '48px' : isTabletView ? '24px' : '20px',
        paddingTop: '48px',
        paddingBottom: '48px'
      }}
      role="main"
      aria-label="Login page"
    >
      {/* Subtle Background Effects */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            width: isDesktop ? '320px' : '256px',
            height: isDesktop ? '320px' : '256px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.04,
            top: '64px',
            left: '32px'
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: isDesktop ? '320px' : '256px',
            height: isDesktop ? '320px' : '256px',
            background: 'linear-gradient(135deg, #00D26A 0%, #0095FF 100%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.03,
            bottom: '64px',
            right: '32px'
          }}
        />
      </div>

      {/* Login Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          zIndex: 10
        }}
      >
        <div
          style={{
            borderRadius: '24px',
            padding: isDesktop ? '48px' : isTabletView ? '36px' : '28px',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Header Section */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)'
                }}
                aria-hidden="true"
              >
                <div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                  <Sparkles
                    size={32}
                    strokeWidth={2}
                    style={{ color: 'white' }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
            <h1
              style={{
                fontSize: isDesktop ? '28px' : '24px',
                fontWeight: '700',
                lineHeight: '1.3',
                marginBottom: '8px',
                color: '#000000',
                letterSpacing: '-0.01em',
                margin: '0 0 8px 0'
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                fontSize: '15px',
                lineHeight: '1.5',
                color: '#666666',
                margin: 0
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
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '12px',
                color: '#ef4444',
                fontSize: '14px',
                lineHeight: '1.5'
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
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '1.5',
                  color: '#000000'
                }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Mail
                    size={20}
                    strokeWidth={2}
                    style={{ color: '#999999' }}
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
                  style={{
                    width: '100%',
                    height: '52px',
                    paddingLeft: '48px',
                    paddingRight: '16px',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    borderRadius: '12px',
                    background: '#F9F9F9',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    color: '#000000',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'
                    e.target.style.background = 'white'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                    e.target.style.background = '#F9F9F9'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '1.5',
                  color: '#000000'
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Lock
                    size={20}
                    strokeWidth={2}
                    style={{ color: '#999999' }}
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
                  style={{
                    width: '100%',
                    height: '52px',
                    paddingLeft: '48px',
                    paddingRight: '48px',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    borderRadius: '12px',
                    background: '#F9F9F9',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    color: '#000000',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'
                    e.target.style.background = 'white'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                    e.target.style.background = '#F9F9F9'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    width: '24px',
                    height: '24px',
                    color: '#999999',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onMouseEnter={(e) => e.target.style.color = '#000000'}
                  onMouseLeave={(e) => e.target.style.color = '#999999'}
                >
                  {showPassword ? (
                    <EyeOff size={20} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={20} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  name="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    accentColor: '#6366F1'
                  }}
                  aria-label="Remember me"
                />
                <span style={{ color: '#666666', fontWeight: '500' }}>Remember me</span>
              </label>
              <Link
                to="/password-reset"
                style={{
                  color: '#6366F1',
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '1.5',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#8B5CF6'}
                onMouseLeave={(e) => e.target.style.color = '#6366F1'}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '56px',
                paddingLeft: '32px',
                paddingRight: '32px',
                fontSize: '17px',
                fontWeight: '600',
                lineHeight: '1.5',
                gap: '8px',
                color: 'white',
                background: loading
                  ? '#CCCCCC'
                  : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                borderRadius: '16px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease'
              }}
              aria-label="Sign in to your account"
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)'
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && (
                <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                  <ArrowRight size={20} strokeWidth={2.5} aria-hidden="true" />
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '32px',
              marginBottom: '32px'
            }}
          >
            <div
              style={{
                flex: 1,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            />
            <span
              style={{
                paddingLeft: '16px',
                paddingRight: '16px',
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#999999',
                fontWeight: '500'
              }}
            >
              or
            </span>
            <div
              style={{
                flex: 1,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            />
          </div>

          {/* Sign Up Link */}
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '15px',
                lineHeight: '1.5',
                color: '#666666',
                margin: 0
              }}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: '#6366F1',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#8B5CF6'}
                onMouseLeave={(e) => e.target.style.color = '#6366F1'}
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '20px'
            }}
          >
            <Link
              to="/"
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#999999',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#000000'}
              onMouseLeave={(e) => e.target.style.color = '#999999'}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
