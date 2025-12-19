/**
 * CRYB Platform - Bradley Himel Landing Page
 * Modern iOS Aesthetic - Lead Generator & Waitlist
 *
 * DESIGN PRINCIPLES:
 * - Light theme with soft shadows
 * - Delicate borders and glassmorphism
 * - Generous whitespace
 * - System font feel
 * - Smooth transitions
 */

import React, { useState } from 'react';
import { Mail, Phone, Globe, Linkedin, Twitter, Instagram, CheckCircle, Sparkles } from 'lucide-react';

export default function BradleyHimelPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'investor'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      paddingBottom: '48px'
    }}>
      {/* Hero Banner */}
      <div style={{
        height: '240px',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop) center/cover',
          opacity: 0.2
        }} />
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '12px 24px',
          borderRadius: '100px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          <Sparkles style={{ width: '20px', height: '20px', color: '#6366F1' }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Join the Future of Social</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* Profile Section */}
        <div style={{
          marginTop: '-60px',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          {/* Profile Photo */}
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            border: '4px solid #FAFAFA',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: '700',
            color: 'white'
          }}>
            BH
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>Bradley Himel</h1>

          <p style={{
            fontSize: '16px',
            color: '#6366F1',
            fontWeight: '600',
            marginBottom: '4px'
          }}>Founder & CEO</p>

          <p style={{
            fontSize: '15px',
            color: '#666666',
            marginBottom: '24px'
          }}>CRYB Platform</p>

          <p style={{
            fontSize: '15px',
            color: '#666666',
            lineHeight: '1.6',
            maxWidth: '500px',
            margin: '0 auto 32px'
          }}>
            Building the next generation of social networking. Join our waitlist to be among the first to experience CRYB - where authentic connections meet cutting-edge technology.
          </p>

          {/* Quick Links */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '32px'
          }}>
            <a
              href="mailto:brad@cryb.ai"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'white',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
                color: '#666666',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
              }}
            >
              <Mail style={{ width: '18px', height: '18px' }} />
              Email
            </a>

            <a
              href="https://linkedin.com/in/bradleyhimel"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'white',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
                color: '#666666',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
              }}
            >
              <Linkedin style={{ width: '18px', height: '18px' }} />
              LinkedIn
            </a>

            <a
              href="https://cryb.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'white',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
                color: '#666666',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
              }}
            >
              <Globe style={{ width: '18px', height: '18px' }} />
              Website
            </a>
          </div>
        </div>

        {/* Waitlist Form */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          marginBottom: '32px'
        }}>
          {!submitted ? (
            <>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#000000',
                marginBottom: '8px',
                textAlign: 'center'
              }}>Join the CRYB Waitlist</h2>

              <p style={{
                fontSize: '15px',
                color: '#666666',
                textAlign: 'center',
                marginBottom: '32px',
                lineHeight: '1.5'
              }}>
                Be among the first to experience the future of social networking
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '8px'
                  }}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    style={{
                      width: '100%',
                      height: '52px',
                      padding: '0 16px',
                      background: '#F9F9F9',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      color: '#000000',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
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

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '8px'
                  }}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      height: '52px',
                      padding: '0 16px',
                      background: '#F9F9F9',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      color: '#000000',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
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

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '8px'
                  }}>Phone (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    style={{
                      width: '100%',
                      height: '52px',
                      padding: '0 16px',
                      background: '#F9F9F9',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      color: '#000000',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
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

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '8px'
                  }}>I'm interested as a... *</label>
                  <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      height: '52px',
                      padding: '0 16px',
                      background: '#F9F9F9',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      color: '#000000',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                      e.target.style.background = '#F9F9F9';
                    }}
                  >
                    <option value="investor">Potential Investor</option>
                    <option value="user">Early User</option>
                    <option value="partner">Business Partner</option>
                    <option value="developer">Developer/Creator</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '56px',
                    background: loading ? '#D1D5DB' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(99, 102, 241, 0.3)'
                  }}
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
                  {loading ? 'Submitting...' : 'Join Waitlist'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle style={{ width: '40px', height: '40px', color: '#10B981' }} />
              </div>

              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#000000',
                marginBottom: '12px'
              }}>You're on the list!</h3>

              <p style={{
                fontSize: '15px',
                color: '#666666',
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>
                Thank you for your interest in CRYB. We'll reach out soon with exclusive early access information.
              </p>

              <button
                onClick={() => setSubmitted(false)}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '12px',
                  color: '#666666',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Submit Another
              </button>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{
          textAlign: 'center',
          padding: '32px 0'
        }}>
          <a
            href="https://cryb.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '14px',
              color: '#666666',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
            }}
          >
            Learn More About CRYB
          </a>

          <p style={{
            fontSize: '13px',
            color: '#999999',
            marginTop: '24px'
          }}>
            © 2024 CRYB Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
