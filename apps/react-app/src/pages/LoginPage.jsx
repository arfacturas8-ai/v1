/**
 * Cryb.ai - Login Page
 * Modern iOS Aesthetic - Ultra Clean & Minimal
 * LIGHT THEME ONLY - NO DARK MODE
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Check } from 'lucide-react';
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#F8F9FA',
        color: '#1A1A1A',
        paddingLeft: isMobile ? '16px' : isTablet ? '24px' : '80px',
        paddingRight: isMobile ? '16px' : isTablet ? '24px' : '80px',
        paddingTop: '24px',
        paddingBottom: '24px'
      }}
      role="main"
      aria-label="Login page"
    >
      {/* Subtle Background Effects */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            width: isMobile ? '200px' : isTablet ? '256px' : '320px',
            height: isMobile ? '200px' : isTablet ? '256px' : '320px',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.04,
            top: isMobile ? '32px' : '64px',
            left: '32px'
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: isDesktop ? '320px' : '256px',
            height: isDesktop ? '320px' : '256px',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
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
            borderRadius: '20px',
            padding: isDesktop ? '32px' : isTabletView ? '28px' : '24px',
            background: '#FFFFFF',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
            border: '1px solid #E8EAED'
          }}
        >
          {/* Header Section */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  boxShadow: '0 4px 16px rgba(88, 166, 255, 0.25)'
                }}
                aria-hidden="true"
              >
                <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                  <Sparkles
                    size={24}
                    strokeWidth={2}
                    style={{ color: '#FFFFFF' }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
            <h1
              style={{
                fontSize: isDesktop ? '24px' : '20px',
                fontWeight: '700',
                lineHeight: '1.3',
                marginBottom: '6px',
                color: '#1A1A1A',
                letterSpacing: '-0.01em',
                margin: '0 0 6px 0'
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                fontSize: '14px',
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
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(255, 59, 59, 0.08)',
                border: '1px solid rgba(255, 59, 59, 0.15)',
                borderRadius: '12px',
                color: '#FF3B3B',
                fontSize: '13px',
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
              gap: '16px'
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
                  color: '#1A1A1A'
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
                    background: '#F0F2F5',
                    border: '1px solid #E8EAED',
                    color: '#1A1A1A',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#58a6ff'
                    e.target.style.background = '#FFFFFF'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8EAED'
                    e.target.style.background = '#F0F2F5'
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
                  color: '#1A1A1A'
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
                    background: '#F0F2F5',
                    border: '1px solid #E8EAED',
                    color: '#1A1A1A',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#58a6ff'
                    e.target.style.background = '#FFFFFF'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8EAED'
                    e.target.style.background = '#F0F2F5'
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
                  onMouseEnter={(e) => e.target.style.color = '#1A1A1A'}
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
              <label
                htmlFor="remember-me"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="remember-me"
                    name="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      margin: 0
                    }}
                    aria-label="Remember me"
                  />
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: `2px solid ${rememberMe ? '#58a6ff' : '#D1D5DB'}`,
                      background: rememberMe ? '#58a6ff' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    {rememberMe && (
                      <Check size={14} strokeWidth={3} style={{ color: '#FFFFFF' }} />
                    )}
                  </div>
                </div>
                <span style={{ color: '#666666', fontWeight: '500' }}>Remember me</span>
              </label>
              <Link
                to="/password-reset"
                style={{
                  color: '#58a6ff',
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '1.5',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#a371f7'}
                onMouseLeave={(e) => e.target.style.color = '#58a6ff'}
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
                color: '#FFFFFF',
                background: loading
                  ? '#D1D5DB'
                  : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: loading ? 'none' : '1px solid rgba(88, 166, 255, 0.3)',
                borderRadius: '9999px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: loading ? 'none' : '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s ease'
              }}
              aria-label="Sign in to your account"
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.background = 'linear-gradient(135deg, rgba(88, 166, 255, 1) 0%, rgba(163, 113, 247, 1) 100%)'
                  e.target.style.boxShadow = '0 8px 32px rgba(88, 166, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.background = 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)'
                  e.target.style.boxShadow = '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
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
                borderTop: '1px solid #E8EAED'
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
                borderTop: '1px solid #E8EAED'
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
                  color: '#58a6ff',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#a371f7'}
                onMouseLeave={(e) => e.target.style.color = '#58a6ff'}
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
              onMouseEnter={(e) => e.target.style.color = '#1A1A1A'}
              onMouseLeave={(e) => e.target.style.color = '#999999'}
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
