/**
 * Bradley Himel Landing Page
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
import { Mail, Phone, Globe, Linkedin, Twitter, Instagram, CheckCircle } from 'lucide-react';

export default function BradleyHimelPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'user'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://api.cryb.ai/api/v1/brad-waitlist/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert(data.error || 'Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          [style*="display: flex"][style*=gap] {
            flex-wrap: inherit;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        paddingBottom: '48px'
      }}>
      {/* Hero Banner */}
      <div style={{
        height: '240px',
        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        position: 'relative',
        overflow: 'visible'
      }}>

        <div style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          padding: '12px 24px',
          borderRadius: '100px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <img src="/crypto.svg" alt="Logo" style={{ width: '58px', height: '58px' }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'white'
          }}>Join the Future of Social</span>
        </div>

        {/* Profile Photo - Positioned on top of banner */}
        <div style={{
          position: 'absolute',
          bottom: '-75px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          border: '6px solid #FAFAFA',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
          backgroundImage: 'url(/images/brad/bradley-himel.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1300 // Critical overlay
        }}>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0 16px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Profile Section */}
        <div style={{
          marginTop: '90px',
          textAlign: 'center',
          marginBottom: '32px'
        }}>

          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>Bradley Himel</h1>

          <p style={{
            fontSize: '16px',
            color: '#000000',
            fontWeight: '600',
            marginBottom: '4px'
          }}>Founder & CEO</p>

          <p style={{
            fontSize: '15px',
            color: '#666666',
            marginBottom: '24px'
          }}>Building the Future of Community Management</p>


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
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
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
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
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
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
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
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
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
              }}>Join the Waitlist</h2>

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
                    background: loading ? '#D1D5DB' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.85) 0%, rgba(139, 92, 246, 0.85) 100%)',
                    backdropFilter: loading ? 'none' : 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: loading ? 'none' : 'blur(40px) saturate(180%)',
                    color: 'white',
                    border: loading ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(99, 102, 241, 0.3), 0 8px 32px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4), 0 12px 40px rgba(0, 0, 0, 0.12)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3), 0 8px 32px rgba(0, 0, 0, 0.08)';
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
                Thank you for your interest. We'll reach out soon with exclusive early access information.
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
            href="https://stage.cryb.ai/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
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
            Learn More
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
