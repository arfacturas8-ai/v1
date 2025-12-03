/**
 * Cryb.ai - Register Page
 * Dedicated registration page with modern authentication
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { useResponsive } from '../hooks/useResponsive';

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
        navigate('/home', { replace: true });
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-3 py-3 sm:px-3 sm:py-3 pb-6 sm:pb-3 relative overflow-hidden bg-[#0D0D0D]" role="main" aria-label="Registration page">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-[48px] opacity-25 bg-[#58a6ff] top-10 sm:top-[60px] left-5 sm:left-[30px]" />
        <div className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-[48px] opacity-25 bg-[#a371f7] bottom-10 sm:bottom-[60px] right-5 sm:right-[30px]" />
      </div>

      <div className="relative z-10 w-full max-w-full sm:max-w-[480px] md:max-w-[440px]">
        <div className="bg-[#141414]/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-3.5 sm:p-4">
          <div className="text-center mb-3 sm:mb-2.5">
            <div className="flex justify-center mb-1.5 sm:mb-[5px]">
              <div className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center" aria-hidden="true">
                <Sparkles className="h-5.5 w-5.5 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-xl sm:text-lg font-bold mb-1 text-white">Create your account</h1>
            <p className="text-[#666666] text-sm sm:text-[13px]">Join the cryb</p>
          </div>

          {error && (
            <div
              className="mb-2 px-2.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs sm:text-xs"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-2">
            <div className="flex flex-col">
              <label htmlFor="username" className="block text-xs sm:text-xs font-medium text-[#A0A0A0] mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" aria-hidden="true" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl pl-[34px] pr-[34px] py-2.5 sm:py-2 text-white outline-none transition-all text-base sm:text-[13px] focus:border-[#58a6ff]/50 min-h-[44px]"
                  placeholder="Choose a username"
                  autoComplete="username"
                  aria-required="true"
                  aria-invalid={error && error.includes('username') ? "true" : "false"}
                  aria-describedby="username-hint"
                />
              </div>
              <p id="username-hint" className="mt-0.5 text-[11px] text-[#6e7681]">At least 3 characters</p>
            </div>

            <div className="flex flex-col">
              <label htmlFor="email" className="block text-xs sm:text-xs font-medium text-[#A0A0A0] mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" aria-hidden="true" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl pl-[34px] pr-[34px] py-2.5 sm:py-2 text-white outline-none transition-all text-base sm:text-[13px] focus:border-[#58a6ff]/50 min-h-[44px]"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={error && error.includes('email') ? "true" : "false"}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="block text-xs sm:text-xs font-medium text-[#A0A0A0] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl pl-[34px] pr-[34px] py-2.5 sm:py-2 text-white outline-none transition-all text-base sm:text-[13px] focus:border-[#58a6ff]/50 min-h-[44px]"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={error && error.includes('password') ? "true" : "false"}
                  aria-describedby="password-strength"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] bg-none border-none cursor-pointer p-1 flex items-center transition-colors hover:text-[#A0A0A0] min-h-[44px] min-w-[44px]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {formData.password && (
                <div id="password-strength" className="mt-1.5" role="status" aria-live="polite">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="flex-1 h-1.5 bg-[#0D0D0D] border border-white/10 rounded-xl overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          background: passwordStrength.color,
                          width: `${passwordStrength.strength}%`
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[#666666] min-w-[50px]">{passwordStrength.text}</span>
                  </div>
                  <p className="text-[11px] text-[#6e7681]">At least 8 characters recommended</p>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <label htmlFor="confirmPassword" className="block text-xs sm:text-xs font-medium text-[#A0A0A0] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" aria-hidden="true" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl pl-[34px] pr-[34px] py-2.5 sm:py-2 text-white outline-none transition-all text-base sm:text-[13px] focus:border-[#58a6ff]/50 min-h-[44px]"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={error && error.includes('match') ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] bg-none border-none cursor-pointer p-1 flex items-center transition-colors hover:text-[#A0A0A0] min-h-[44px] min-w-[44px]"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                  className="w-3 h-3 min-w-[12px] min-h-[12px] rounded-sm border border-white/20 bg-transparent mt-0.5 mr-1.5 cursor-pointer accent-blue-500"
                  aria-required="true"
                  aria-invalid={error && error.includes('Terms') ? "true" : "false"}
                />
                <span className="text-[#666666] text-[11px] leading-tight">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-400 no-underline transition-colors hover:text-blue-300" onClick={(e) => e.stopPropagation()}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-400 no-underline transition-colors hover:text-blue-300" onClick={(e) => e.stopPropagation()}>
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] border-none rounded-xl px-4 py-2.5 sm:py-2.5 text-white font-semibold text-base sm:text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-opacity w-full hover:opacity-90 min-h-[44px]"
              aria-label="Create your account"
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />}
            </Button>
          </form>

          <div className="my-3 sm:my-2.5 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-2.5 text-xs sm:text-xs text-[#666666]">or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          <div className="text-center">
            <p className="text-[#666666] text-sm sm:text-[13px]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-400 font-medium no-underline transition-colors hover:text-blue-300"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-2 sm:mt-1.5 text-center">
            <Link
              to="/"
              className="text-xs sm:text-xs text-[#666666] no-underline transition-colors hover:text-[#A0A0A0]"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

