/**
 * Cryb.ai - Password Reset Page
 * Reset password with token from email
 * Master Prompt Standards Applied:
 * - Spacing scale: 4, 8, 16, 24, 32, 48, 64px only
 * - Icons: All exactly 24px in fixed containers
 * - Input heights: 48px
 * - Button heights: 56px (lg), 48px (md)
 * - Responsive padding: 16px mobile, 24px tablet, 80px desktop
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import authService from '../services/authService';
import { useResponsive } from '../hooks/useResponsive';

export default function PasswordResetPage() {
  const { isMobile } = useResponsive();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState(token ? 'reset' : 'request'); // request, reset, success, error
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Validate token if present
    if (token) {
      validateToken(token);
    }
  }, [token]);

  useEffect(() => {
    // Calculate password strength
    if (password.length === 0) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    setPasswordStrength(strength);
  }, [password]);

  const validateToken = async (token) => {
    // Token validation happens when user attempts to reset password
    // No separate validation endpoint needed - backend validates on reset
    setStep('reset');
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.resetPassword(email);

      if (result?.success) {
        setMessage(
          result?.message || `Password reset email sent to ${email}. Check your inbox!`
        );
        setStep('success');
      } else {
        setError(result?.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setError('Password is too weak. Use uppercase, lowercase, numbers, and symbols.');
      setLoading(false);
      return;
    }

    try {
      // Backend expects token in request body with password
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1'}/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            password: password,
            confirmPassword: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data?.success) {
        setMessage(data?.message || 'Password reset successfully! Redirecting to login...');
        setStep('success');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(
          data?.error || 'Failed to reset password. Please try again or request a new link.'
        );
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to reset password. Please try again or request a new link.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#FF3B3B';
    if (passwordStrength <= 3) return '#f59e0b';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  // Determine responsive values
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const isTabletView = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;
  const pagePadding = isDesktop ? '80px' : isTabletView ? '24px' : '16px';

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'var(--bg-primary)',
        paddingLeft: pagePadding,
        paddingRight: pagePadding,
        paddingTop: '48px',
        paddingBottom: '48px',
      }}
      role="main"
      aria-label="Password reset page"
    >
      <div
        className="card card-elevated w-full"
        style={{
          maxWidth: '480px',
          borderRadius: '16px',
          padding: isDesktop ? '48px' : isTabletView ? '32px' : '24px',
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          className="text-center"
          style={{
            marginBottom: '32px',
          }}
        >
          <div
            className="flex items-center justify-center rounded-xl mx-auto"
            style={{
              width: '48px',
              height: '48px',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
              boxShadow: 'var(--shadow-md)',
            }}
            aria-hidden="true"
          >
            <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
              <KeyRound size={24} strokeWidth={2} style={{ color: 'white' }} />
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
            {step === 'request' && 'Reset Password'}
            {step === 'reset' && 'Create New Password'}
            {step === 'success' && 'Success!'}
            {step === 'error' && 'Invalid Link'}
          </h1>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'var(--text-secondary)',
            }}
          >
            {step === 'request' && 'Enter your email to receive a password reset link'}
            {step === 'reset' && 'Choose a strong password for your account'}
            {step === 'success' && 'Your password has been updated'}
            {step === 'error' && 'This reset link is no longer valid'}
          </p>
        </div>

        {/* Request Reset Form */}
        {step === 'request' && (
          <form onSubmit={handleRequestReset}>
            <div
              className="flex flex-col"
              style={{
                marginBottom: '24px',
                gap: '8px',
              }}
            >
              <label
                htmlFor="email-input"
                className="block font-medium"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)',
                }}
              >
                Email Address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="input w-full"
                style={{
                  height: '48px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'email-error' : undefined}
              />
            </div>

            {error && (
              <div
                id="email-error"
                role="alert"
                style={{
                  padding: '16px',
                  marginBottom: '24px',
                  borderRadius: '12px',
                  color: '#FF3B3B',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                {typeof error === 'string' ? error : 'An error occurred'}
              </div>
            )}

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
              aria-label={loading ? 'Sending reset email' : 'Send reset link'}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div
              className="text-center"
              style={{
                marginTop: '24px',
              }}
            >
              <Link
                to="/login"
                className="inline-flex items-center transition-colors"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--brand-primary)',
                  textDecoration: 'none',
                }}
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Reset Password Form */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div
              className="flex flex-col"
              style={{
                marginBottom: '24px',
                gap: '8px',
              }}
            >
              <label
                htmlFor="new-password"
                className="block font-medium"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)',
                }}
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="input w-full"
                  style={{
                    height: '48px',
                    paddingLeft: '16px',
                    paddingRight: '48px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
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
                    background: 'transparent',
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
                    <EyeOff size={24} strokeWidth={2} />
                  ) : (
                    <Eye size={24} strokeWidth={2} />
                  )}
                </button>
              </div>

              {password && (
                <div
                  id="password-strength"
                  style={{ marginTop: '8px' }}
                  role="status"
                  aria-live="polite"
                >
                  <div
                    className="rounded-sm overflow-hidden"
                    style={{
                      height: '8px',
                      background: 'var(--bg-tertiary)',
                    }}
                    aria-hidden="true"
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor(),
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.5',
                      marginTop: '4px',
                      color: getPasswordStrengthColor(),
                    }}
                  >
                    Strength: {getPasswordStrengthText()}
                  </p>
                </div>
              )}
            </div>

            <div
              className="flex flex-col"
              style={{
                marginBottom: '24px',
                gap: '8px',
              }}
            >
              <label
                htmlFor="confirm-password"
                className="block font-medium"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--text-secondary)',
                }}
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="input w-full"
                style={{
                  height: '48px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                aria-required="true"
                aria-invalid={error && error.includes('match') ? 'true' : 'false'}
              />
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  padding: '16px',
                  marginBottom: '24px',
                  borderRadius: '12px',
                  color: '#FF3B3B',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                {typeof error === 'string' ? error : 'An error occurred'}
              </div>
            )}

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
              aria-label={loading ? 'Resetting password' : 'Reset password'}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="text-center" role="status" aria-live="polite">
            <div
              className="mx-auto rounded-full flex items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                marginBottom: '32px',
                background: 'rgba(16, 185, 129, 0.1)',
              }}
              aria-hidden="true"
            >
              <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                <CheckCircle size={24} strokeWidth={2} style={{ color: '#10b981' }} />
              </div>
            </div>
            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                marginBottom: '32px',
                color: 'var(--text-secondary)',
              }}
            >
              {message}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center font-semibold transition-all"
              style={{
                height: '56px',
                paddingLeft: '32px',
                paddingRight: '32px',
                fontSize: '16px',
                lineHeight: '1.5',
                color: 'white',
                background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                borderRadius: '12px',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="text-center" role="alert">
            <div
              className="mx-auto rounded-full flex items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                marginBottom: '32px',
                background: 'rgba(245, 158, 11, 0.1)',
              }}
              aria-hidden="true"
            >
              <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                <AlertTriangle size={24} strokeWidth={2} style={{ color: '#f59e0b' }} />
              </div>
            </div>
            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                marginBottom: '32px',
                color: 'var(--text-secondary)',
              }}
            >
              {typeof error === 'string' ? error : 'An error occurred'}
            </p>
            <button
              onClick={() => setStep('request')}
              className="inline-flex items-center justify-center font-semibold transition-all"
              style={{
                height: '56px',
                paddingLeft: '32px',
                paddingRight: '32px',
                fontSize: '16px',
                lineHeight: '1.5',
                color: 'white',
                background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
              aria-label="Request new password reset link"
            >
              Request New Link
            </button>
          </div>
        )}

        {/* Help Text */}
        <div
          className="text-center"
          style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border-primary)',
            fontSize: '14px',
            lineHeight: '1.5',
            color: 'var(--text-tertiary)',
          }}
        >
          Need help?{' '}
          <Link
            to="/help"
            className="underline transition-colors"
            style={{
              color: 'var(--brand-primary)',
            }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
