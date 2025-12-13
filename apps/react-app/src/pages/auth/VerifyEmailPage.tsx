/**
 * CRYB Authentication - Verify Email Page
 * Email verification flow with resend option
 */

import React, { useState, useEffect } from 'react';
import { getErrorMessage } from "../../utils/errorUtils";
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailFromState = location.state?.email || '';

  const [email] = useState(emailFromState);
  const [verifying, setVerifying] = useState(!!token);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Auto-verify if token is present
  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resent && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setResent(false);
      setCountdown(60);
    }
  }, [resent, countdown]);

  const verifyEmail = async (verificationToken: string) => {
    setVerifying(true);
    setError('');

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate verification
      setVerified(true);

      // Redirect to onboarding after 2 seconds
      setTimeout(() => {
        navigate('/auth/onboarding-welcome');
      }, 2000);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to verify email. The link may be expired or invalid.'));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('No email address provided');
      return;
    }

    setResending(true);
    setError('');

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResent(true);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to resend verification email'));
    } finally {
      setResending(false);
    }
  };

  // Verifying state
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10 " />
          <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10 " />
        </div>

        <Card className="relative z-10 w-full max-w-md bg-white backdrop-blur-xl border-[var(--border-subtle)]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-blue-500 " />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Verifying your email</h1>
            <p className="text-[var(--text-secondary)]">Please wait while we verify your email address...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10 " />
          <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10 " />
        </div>

        <Card className="relative z-10 w-full max-w-md bg-white backdrop-blur-xl border-[var(--border-subtle)]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Email verified!</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Your email has been successfully verified. Redirecting to onboarding...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check email state
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--bg-primary)] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10" />
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10" />
      </div>

      <Card className="relative z-10 w-full max-w-md bg-white backdrop-blur-xl border-[var(--border-subtle)]">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Check your email</h1>
            {email && (
              <p className="text-[var(--text-secondary)] mb-4">
                We've sent a verification link to <span className="text-[var(--text-primary)] font-medium">{email}</span>
              </p>
            )}
            <p className="text-sm text-[var(--text-secondary)]">
              Click the link in the email to verify your account. The link will expire in 24 hours.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            </div>
          )}

          {resent && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-500">Verification email sent successfully!</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="outline"
              fullWidth
              size="lg"
              onClick={handleResend}
              disabled={resending || resent}
              loading={resending}
              className="bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-gray-50"
            >
              {resent ? `Resend in ${countdown}s` : 'Resend verification email'}
            </Button>

            <p className="text-center text-sm text-[var(--text-secondary)]">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={handleResend}
                disabled={resending || resent}
                className="text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                try again
              </button>
            </p>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-center text-sm text-[var(--text-secondary)]">
                Wrong email?{' '}
                <button
                  onClick={() => navigate('/auth/signup')}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign up again
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
