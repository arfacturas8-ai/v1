/**
 * CRYB Authentication - Forgot Password Page
 * Email input for password reset
 */

import React, { useState } from 'react';
import { getErrorMessage } from "../../utils/errorUtils";
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to send reset link. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--bg-primary)] relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10 " />
          <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10 " />
        </div>

        <Card className="relative z-10 w-full max-w-md bg-white backdrop-blur-xl border-[var(--border-subtle)]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Check your email</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              We've sent a password reset link to <span className="text-[var(--text-primary)] font-medium">{email}</span>
            </p>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => setSuccess(false)}
                className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90"
              >
                Resend link
              </Button>
              <Link to="/auth/login">
                <Button variant="outline" fullWidth className="bg-transparent border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-gray-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10" />
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10" />
      </div>

      <Card className="relative z-10 w-full max-w-md bg-white backdrop-blur-xl border-[var(--border-subtle)]">
        <CardContent className="p-8">
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Forgot your password?</h1>
            <p className="text-[var(--text-secondary)]">No worries, we'll send you reset instructions</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="We'll send a password reset link to this email"
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading}
              className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90"
            >
              Send reset link
            </Button>

            <Link to="/auth/login">
              <Button variant="ghost" fullWidth className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
