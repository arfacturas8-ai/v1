/**
 * Cryb.ai - Email Verification Page
 * Email verification status display
 * Master Prompt Standards Applied:
 * - Spacing scale: 4, 8, 16, 24, 32, 48, 64px only
 * - Icons: All exactly 24px in fixed containers
 * - Button heights: 48px (md), 56px (lg)
 * - Responsive padding: 16px mobile, 24px tablet, 80px desktop
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import authService from '../services/authService';
import { useResponsive } from '../hooks/useResponsive';

export default function EmailVerificationPage() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token) => {
    try {
      const result = await authService.verifyEmail(token);

      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');

        setTimeout(() => {
          navigate('/home');
        }, 3000);
      } else {
        setStatus('expired');
        setMessage(result.error || 'This verification link has expired or is invalid.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
      console.error('Email verification error:', error);
    }
  };

  const resendVerification = async () => {
    setStatus('verifying');
    setMessage('Sending new verification email...');

    try {
      const result = await authService.resendVerification();

      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'A new verification email has been sent! Check your inbox.');
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to resend verification email. Please try again later.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to resend verification email. Please try again later.');
      console.error('Resend verification error:', error);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'verifying':
        return (
          <div
            className="rounded-full"
            style={{
              width: '64px',
              height: '64px',
              border: '4px solid #000000',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
            role="status"
            aria-label="Verifying email"
          />
        );
      case 'success':
        return (
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '64px',
              height: '64px',
              background: 'rgba(16, 185, 129, 0.1)',
            }}
            aria-hidden="true"
          >
            <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
              <CheckCircle size={24} strokeWidth={2} style={{ color: '#10b981' }} />
            </div>
          </div>
        );
      case 'error':
        return (
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '64px',
              height: '64px',
              background: 'rgba(239, 68, 68, 0.1)',
            }}
            aria-hidden="true"
          >
            <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
              <XCircle size={24} strokeWidth={2} style={{ color: '#ef4444' }} />
            </div>
          </div>
        );
      case 'expired':
        return (
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '64px',
              height: '64px',
              background: 'rgba(245, 158, 11, 0.1)',
            }}
            aria-hidden="true"
          >
            <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
              <Clock size={24} strokeWidth={2} style={{ color: '#f59e0b' }} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Use responsive hook values
  const { isDesktop, isTablet } = useResponsive();
  const pagePadding = isDesktop ? '80px' : isTablet ? '24px' : '16px';

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
      aria-label="Email verification page"
    >
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div
        className="card card-elevated w-full text-center"
        style={{
          maxWidth: '480px',
          borderRadius: '16px',
          padding: isDesktop ? '48px' : isTabletView ? '32px' : '24px',
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div
          className="flex justify-center"
          style={{
            marginBottom: '32px',
          }}
        >
          {getIcon()}
        </div>

        <h1
          className="font-bold"
          style={{
            fontSize: isDesktop ? '24px' : '20px',
            lineHeight: '1.4',
            marginBottom: '16px',
            color: 'var(--text-primary)',
          }}
        >
          {status === 'verifying' && 'Verifying Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
          {status === 'expired' && 'Link Expired'}
        </h1>

        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
            marginBottom: '32px',
            color: 'var(--text-secondary)',
          }}
          role={status === 'error' || status === 'expired' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message}
        </p>

        <div className="flex flex-col" style={{ gap: '16px' }}>
          {status === 'success' && (
            <>
              <Link
                to="/home"
                className="inline-flex items-center justify-center font-semibold transition-all"
                style={{
                  height: '56px',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  color: 'white',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                  backdropFilter: 'blur(40px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  border: '1px solid rgba(88, 166, 255, 0.3)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  boxShadow: '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                }}
                aria-label="Go to home page"
              >
                Go to Home →
              </Link>
              <p
                style={{
                  fontSize: '12px',
                  lineHeight: '1.5',
                  fontStyle: 'italic',
                  margin: 0,
                  color: 'var(--text-secondary)',
                }}
              >
                Redirecting automatically in 3 seconds...
              </p>
            </>
          )}

          {(status === 'error' || status === 'expired') && (
            <>
              <button
                onClick={resendVerification}
                className="inline-flex items-center justify-center font-semibold transition-all"
                style={{
                  height: '56px',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  color: 'white',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                  backdropFilter: 'blur(40px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(88, 166, 255, 0.3)',
                  cursor: 'pointer',
                  boxShadow: '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                }}
                aria-label="Resend verification email"
              >
                Resend Verification Email
              </button>

              <Link
                to="/"
                className="inline-flex items-center justify-center font-semibold transition-all"
                style={{
                  height: '48px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#000000',
                  background: 'transparent',
                  border: '2px solid #000000',
                  borderRadius: '12px',
                  textDecoration: 'none',
                }}
                aria-label="Back to home page"
              >
                Back to Home
              </Link>
            </>
          )}

          {status === 'verifying' && (
            <p
              style={{
                fontSize: '12px',
                lineHeight: '1.5',
                fontStyle: 'italic',
                margin: 0,
                color: 'var(--text-secondary)',
              }}
            >
              This may take a few seconds...
            </p>
          )}
        </div>

        <div
          className="text-center"
          style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border-primary)',
            fontSize: '14px',
            lineHeight: '1.5',
            color: 'var(--text-secondary)',
          }}
        >
          <p style={{ margin: 0 }}>
            Having trouble?{' '}
            <Link
              to="/help"
              className="underline transition-colors"
              style={{
                color: '#000000',
                textDecoration: 'underline',
              }}
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
