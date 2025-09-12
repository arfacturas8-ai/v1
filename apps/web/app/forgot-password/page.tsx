"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.forgotPassword(email);
      
      if (response.success) {
        setSubmitted(true);
      } else {
        setError(response.error || "Failed to send reset email. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white mb-2">CRYB</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-300">
            Reset your password
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          {!submitted ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email address *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-brand-primary focus:ring-brand-primary"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="w-full"
                disabled={loading || !email}
                loading={loading}
                loadingText="Sending..."
              >
                Send reset link
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-6xl">📧</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Check your email</h3>
                <p className="text-sm text-gray-400">
                  We've sent a password reset link to <strong className="text-white">{email}</strong>
                </p>
              </div>
              <div className="text-xs text-gray-500">
                <p>Didn't receive the email? Check your spam folder or</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-brand-primary hover:text-brand-primary-light underline"
                >
                  try a different email address
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Remember your password?{" "}
              <Link 
                href="/login" 
                className="text-brand-primary hover:text-brand-primary-light transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Contact{" "}
            <a href="mailto:support@cryb.app" className="text-brand-primary hover:text-brand-primary-light">
              support@cryb.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}