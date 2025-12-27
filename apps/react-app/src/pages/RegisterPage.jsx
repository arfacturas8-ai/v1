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
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Sparkles, Check, Calendar } from 'lucide-react';
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
    dateOfBirth: '',
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
    // Age verification (COPPA compliance - must be 13+)
    if (!formData.dateOfBirth) {
      setError('Please enter your date of birth');
      return false;
    }
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 13) {
      setError('You must be at least 13 years old to create an account (COPPA requirement)');
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
        padding: isMobile ? '16px' : '24px',
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
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
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
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            filter: 'blur(80px)',
            opacity: 0.03,
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
            borderRadius: '20px',
            padding: isDesktop ? '32px' : isMobile ? '24px' : '28px',
            background: '#FFFFFF',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
            border: '1px solid #E8EAED',
          }}
        >
          {/* Header Section */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '24px',
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
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  boxShadow: '0 4px 16px rgba(88, 166, 255, 0.25)',
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
                margin: '0 0 6px 0',
              }}
            >
              Create your account
            </h1>
            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#666666',
                margin: 0,
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

            {/* Date of Birth Field (COPPA Compliance) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="dateOfBirth"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  color: '#666666',
                }}
              >
                Date of Birth
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
                  <Calendar
                    size={20}
                    strokeWidth={2}
                    style={{ color: '#999999' }}
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
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
                  autoComplete="bday"
                  aria-required="true"
                  aria-invalid={error && error.includes('date of birth') ? 'true' : 'false'}
                  aria-describedby="dob-hint"
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
                id="dob-hint"
                style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#999999',
                  marginTop: '4px',
                }}
              >
                You must be at least 13 years old
              </p>
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
              <label
                htmlFor="accept-terms"
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
                    id="accept-terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      margin: 0
                    }}
                    aria-required="true"
                    aria-invalid={error && error.includes('Terms') ? 'true' : 'false'}
                    aria-label="Accept terms and conditions"
                  />
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: `2px solid ${acceptTerms ? '#000000' : '#D1D5DB'}`,
                      background: acceptTerms ? '#000000' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    {acceptTerms && (
                      <Check size={14} strokeWidth={3} style={{ color: '#FFFFFF' }} />
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: '#666666',
                    fontWeight: '500'
                  }}
                >
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    style={{
                      color: '#000000',
                      textDecoration: 'none',
                      fontWeight: '600',
                      transition: 'color 0.2s ease',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#000000'}
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    style={{
                      color: '#000000',
                      textDecoration: 'none',
                      fontWeight: '600',
                      transition: 'color 0.2s ease',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#000000'}
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
                  : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: loading ? 'none' : '1px solid rgba(88, 166, 255, 0.3)',
                borderRadius: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: loading ? 'none' : '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s ease',
              }}
              aria-label="Create your account"
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 166, 255, 1) 0%, rgba(163, 113, 247, 1) 100%)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(88, 166, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
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
                  color: '#000000',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#000000'}
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
