/**
 * Cryb.ai - Forgot Password Page
 * Request password reset email
 * Master Prompt Standards Applied:
 * - Spacing scale: 4, 8, 16, 24, 32, 48, 64px only
 * - Icons: All exactly 24px in fixed containers
 * - Input heights: 48px
 * - Button heights: 56px (lg), 48px (md)
 * - Responsive padding: 16px mobile, 24px tablet, 80px desktop
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

export default function ForgotPasswordPage() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1'}/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok && data?.success) {
        setIsSubmitted(true);
      } else {
        setError(data?.error || data?.message || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Use responsive hook values
  const pagePadding = isDesktop ? '80px' : isTablet ? '24px' : '16px';

  if (isSubmitted) {
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
        aria-label="Password reset confirmation"
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
          <div
            className="flex justify-center"
            style={{
              marginBottom: '24px',
            }}
          >
            <div
              className="inline-flex items-center justify-center rounded-full"
              style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              }}
              aria-hidden="true"
            >
              <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                <CheckCircle size={24} strokeWidth={2} style={{ color: '#fff' }} aria-hidden="true" />
              </div>
            </div>
          </div>

          <h1
            className="font-bold text-center"
            style={{
              fontSize: isDesktop ? '24px' : '20px',
              lineHeight: '1.4',
              marginBottom: '16px',
              color: 'var(--text-primary)',
            }}
          >
            Check Your Email
          </h1>

          <p
            className="text-center"
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              marginBottom: '24px',
              color: 'var(--text-secondary)',
            }}
          >
            We've sent password reset instructions to <strong>{email}</strong>
          </p>

          <div
            className="rounded-xl"
            style={{
              padding: '16px',
              marginBottom: '24px',
              background: 'var(--bg-tertiary)',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                lineHeight: '1.5',
                margin: 0,
                color: 'var(--text-secondary)',
              }}
            >
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSubmitted(false)}
                className="font-semibold underline transition-colors"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--brand-primary)',
                }}
                aria-label="Try sending reset email again"
              >
                try again
              </button>
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center justify-center font-semibold transition-all w-full"
            style={{
              height: '48px',
              paddingLeft: '24px',
              paddingRight: '24px',
              fontSize: '14px',
              lineHeight: '1.5',
              gap: '8px',
              color: 'var(--text-primary)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '12px',
              textDecoration: 'none',
            }}
            aria-label="Back to login page"
          >
            <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
              <ArrowLeft size={24} strokeWidth={2} aria-hidden="true" />
            </div>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

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
      aria-label="Forgot password page"
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
        <div
          className="text-center"
          style={{
            marginBottom: '32px',
          }}
        >
          <h1
            className="font-bold"
            style={{
              fontSize: isDesktop ? '24px' : '20px',
              lineHeight: '1.4',
              marginBottom: '8px',
              color: 'var(--text-primary)',
            }}
          >
            Forgot Password?
          </h1>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'var(--text-secondary)',
            }}
          >
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="flex flex-col"
            style={{
              marginBottom: '24px',
              gap: '8px',
            }}
          >
            <label
              htmlFor="email"
              className="block font-semibold"
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'var(--text-primary)',
              }}
            >
              Email Address
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
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={isLoading}
                className="input w-full"
                style={{
                  height: '48px',
                  paddingLeft: '48px',
                  paddingRight: '16px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: error ? '1px solid #FF3B3B' : '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                aria-label="Email address"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'email-error' : undefined}
              />
            </div>
            {error && (
              <p
                id="email-error"
                role="alert"
                style={{
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: '#FF3B3B',
                  margin: 0,
                }}
              >
                {typeof error === 'string' ? error : 'An error occurred'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center font-semibold transition-all"
            style={{
              height: '56px',
              paddingLeft: '32px',
              paddingRight: '32px',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px',
              color: 'white',
              background: isLoading
                ? 'var(--bg-tertiary)'
                : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
              backdropFilter: isLoading ? 'none' : 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: isLoading ? 'none' : 'blur(40px) saturate(200%)',
              borderRadius: '12px',
              border: isLoading ? 'none' : '1px solid rgba(88, 166, 255, 0.3)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              boxShadow: isLoading ? 'none' : '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            }}
            aria-label={isLoading ? 'Sending reset email...' : 'Send reset email'}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center font-semibold transition-colors"
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                gap: '8px',
                color: 'var(--brand-primary)',
                textDecoration: 'none',
              }}
              aria-label="Back to login page"
            >
              <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                <ArrowLeft size={24} strokeWidth={2} aria-hidden="true" />
              </div>
              Back to Login
            </Link>
          </div>
        </form>

        <div
          className="text-center"
          style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border-primary)',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              marginBottom: '16px',
              color: 'var(--text-secondary)',
            }}
          >
            Don't have an account?
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center font-semibold transition-all"
            style={{
              height: '48px',
              paddingLeft: '24px',
              paddingRight: '24px',
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'var(--text-primary)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '12px',
              textDecoration: 'none',
            }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

ForgotPasswordPage.propTypes = {};

export { ForgotPasswordPage };
