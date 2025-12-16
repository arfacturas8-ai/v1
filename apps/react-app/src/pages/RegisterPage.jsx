/**
 * Cryb.ai - Register Page
 * Dedicated registration page with modern authentication
 * Master Prompt Standards Applied:
 * - Spacing scale: 4, 8, 16, 24, 32, 48, 64px only
 * - Icons: All exactly 24px in fixed containers
 * - Input heights: 48px
 * - Button heights: 56px (lg)
 * - Responsive padding: 16px mobile, 24px tablet, 80px desktop
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
      aria-label="Registration page"
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

      {/* Register Card */}
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
              Create your account
            </h1>
            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'var(--text-secondary)',
              }}
            >
              Join the cryb community
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
            {/* Username Field */}
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label
                htmlFor="username"
                className="block font-medium"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)',
                }}
              >
                Username
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
                  <User
                    size={24}
                    strokeWidth={2}
                    style={{ color: 'var(--text-tertiary)' }}
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
                  placeholder="Choose a username"
                  autoComplete="username"
                  aria-required="true"
                  aria-invalid={error && error.includes('username') ? 'true' : 'false'}
                  aria-describedby="username-hint"
                />
              </div>
              <p
                id="username-hint"
                style={{
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: 'var(--text-tertiary)',
                  marginTop: '4px',
                }}
              >
                At least 3 characters
              </p>
            </div>

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
                  aria-invalid={error && error.includes('email') ? 'true' : 'false'}
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
                  minLength={8}
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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={error && error.includes('password') ? 'true' : 'false'}
                  aria-describedby="password-strength"
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div
                  id="password-strength"
                  style={{ marginTop: '8px' }}
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center" style={{ gap: '8px', marginBottom: '4px' }}>
                    <div
                      className="flex-1 rounded-xl overflow-hidden"
                      style={{
                        height: '8px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                      }}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          background: passwordStrength.color,
                          width: `${passwordStrength.strength}%`,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        lineHeight: '1.5',
                        minWidth: '64px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.5',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    At least 8 characters recommended
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label
                htmlFor="confirmPassword"
                className="block font-medium"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)',
                }}
              >
                Confirm Password
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
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
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={error && error.includes('match') ? 'true' : 'false'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={24} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Eye size={24} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Acceptance */}
            <div>
              <label className="flex items-center cursor-pointer" style={{ gap: '8px' }}>
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                  className="cursor-pointer"
                  style={{
                    width: '16px',
                    height: '16px',
                    flexShrink: 0,
                  }}
                  aria-required="true"
                  aria-invalid={error && error.includes('Terms') ? 'true' : 'false'}
                />
                <span
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: 'var(--text-secondary)',
                  }}
                >
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="no-underline transition-colors"
                    style={{ color: 'var(--brand-primary)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className="no-underline transition-colors"
                    style={{ color: 'var(--brand-primary)' }}
                    onClick={(e) => e.stopPropagation()}
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
              aria-label="Create your account"
            >
              {loading ? 'Creating account...' : 'Create account'}
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

          {/* Sign In Link */}
          <div className="text-center">
            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'var(--text-secondary)',
              }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium no-underline transition-colors"
                style={{
                  color: 'var(--brand-primary)',
                }}
              >
                Sign in
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
