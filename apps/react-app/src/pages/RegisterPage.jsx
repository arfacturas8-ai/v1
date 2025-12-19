/**
 * CRYB Platform - Register Page
 * Modern iOS Aesthetic - Ultra Clean & Minimal
 *
 * DESIGN PRINCIPLES:
 * - Light theme with soft shadows
 * - Delicate borders and glassmorphism
 * - Generous whitespace
 * - System font feel
 * - Smooth transitions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { getErrorMessage } from '../utils/errorUtils';

export default function RegisterPage() {
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const { signup, isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const validateForm = () => {
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await signup(formData);
      if (result.success) {
        // Mark user as new to trigger onboarding tour
        localStorage.setItem('show_onboarding_tour', 'true');
        navigate('/home', { replace: true });
      } else {
        setError(getErrorMessage(result.error, 'Registration failed. Please try again.'));
      }
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 8) return { strength: 25, text: 'Weak', color: '#FF3B3B' };

    let strength = 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    if (strength < 50) return { strength, text: 'Weak', color: '#FF3B3B' };
    if (strength < 75) return { strength, text: 'Medium', color: '#FFB800' };
    return { strength, text: 'Strong', color: '#00D26A' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Responsive breakpoints
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

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
        padding: isMobile ? '16px' : '48px',
      }}
      role="main"
      aria-label="Registration page"
    >
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            width: isDesktop ? '320px' : '256px',
            height: isDesktop ? '320px' : '256px',
            background: '#6366F1',
            filter: 'blur(80px)',
            opacity: 0.04,
            top: '64px',
            left: '32px',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: isDesktop ? '320px' : '256px',
            height: isDesktop ? '320px' : '256px',
            background: '#8B5CF6',
            filter: 'blur(80px)',
            opacity: 0.04,
            bottom: '64px',
            right: '32px',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Register Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '480px',
        }}
      >
        <div
          style={{
            borderRadius: '24px',
            padding: isDesktop ? '48px' : isMobile ? '24px' : '32px',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Header Section */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
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
              style={{
                fontSize: isDesktop ? '28px' : '24px',
                fontWeight: '700',
                lineHeight: '1.3',
                marginBottom: '8px',
                color: '#000000',
                letterSpacing: '-0.02em',
              }}
            >
              Create your account
            </h1>
            <p
              style={{
                fontSize: '15px',
                lineHeight: '1.5',
                color: '#666666',
              }}
            >
              Join the CRYB community
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                color: '#EF4444',
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
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Username Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="username"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  color: '#666666',
                }}
              >
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
                  }}
                >
                  <User
                    size={20}
                    strokeWidth={2}
                    style={{ color: '#999999' }}
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
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
                    transition: 'all 0.2s ease',
                  }}
                  placeholder="Choose a username"
                  autoComplete="username"
                  aria-required="true"
                  aria-invalid={error && error.includes('username') ? 'true' : 'false'}
                  aria-describedby="username-hint"
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.target.style.background = '#F9F9F9';
                  }}
                />
              </div>
              <p
                id="username-hint"
                style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#999999',
                  marginTop: '4px',
                }}
              >
                At least 3 characters
              </p>
            </div>

            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="email"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  color: '#666666',
                }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
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
                    transition: 'all 0.2s ease',
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={error && error.includes('email') ? 'true' : 'false'}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.target.style.background = '#F9F9F9';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  color: '#666666',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
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
                  minLength={8}
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
                    transition: 'all 0.2s ease',
                  }}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={error && error.includes('password') ? 'true' : 'false'}
                  aria-describedby="password-strength"
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.target.style.background = '#F9F9F9';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    transition: 'color 0.2s ease',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#999999'}
                >
                  {showPassword ? (
                    <EyeOff size={20} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={20} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div
                  id="password-strength"
                  style={{ marginTop: '8px' }}
                  role="status"
                  aria-live="polite"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: 'rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          background: passwordStrength.color,
                          width: `${passwordStrength.strength}%`,
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        lineHeight: '1.5',
                        minWidth: '64px',
                        color: '#666666',
                        fontWeight: '500',
                      }}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: '1.5',
                      color: '#999999',
                    }}
                  >
                    At least 8 characters recommended
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  color: '#666666',
                }}
              >
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
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
                    transition: 'all 0.2s ease',
                  }}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={error && error.includes('match') ? 'true' : 'false'}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                    e.target.style.background = '#F9F9F9';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    transition: 'color 0.2s ease',
                  }}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#999999'}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={20} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Acceptance */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                  style={{
                    width: '18px',
                    height: '18px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    accentColor: '#6366F1',
                  }}
                  aria-required="true"
                  aria-invalid={error && error.includes('Terms') ? 'true' : 'false'}
                />
                <span
                  style={{
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: '#666666',
                  }}
                >
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    style={{
                      color: '#6366F1',
                      textDecoration: 'none',
                      fontWeight: '500',
                      transition: 'color 0.2s ease',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#8B5CF6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6366F1'}
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    style={{
                      color: '#6366F1',
                      textDecoration: 'none',
                      fontWeight: '500',
                      transition: 'color 0.2s ease',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#8B5CF6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6366F1'}
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
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
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '1.5',
                gap: '8px',
                color: 'white',
                background: loading
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                borderRadius: '14px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease',
              }}
              aria-label="Create your account"
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
                }
              }}
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && (
                <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                  <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
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
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                flex: 1,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            />
            <span
              style={{
                paddingLeft: '16px',
                paddingRight: '16px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#999999',
              }}
            >
              or
            </span>
            <div
              style={{
                flex: 1,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            />
          </div>

          {/* Sign In Link */}
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '15px',
                lineHeight: '1.5',
                color: '#666666',
              }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#6366F1',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#8B5CF6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6366F1'}
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '16px',
            }}
          >
            <Link
              to="/"
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#999999',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#666666'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#999999'}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
