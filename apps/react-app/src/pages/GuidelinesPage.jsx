/**
 * CRYB Platform - Community Guidelines Page
 * iOS-Style Polish - Clean, Light, Professional
 *
 * DESIGN PRINCIPLES:
 * - Light theme only - NO black backgrounds
 * - Clean white cards with subtle shadows
 * - Proper spacing and hierarchy
 * - iOS system font aesthetic
 * - Smooth scrolling and interactions
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../components/LandingHeader';
import { useResponsive } from '../hooks/useResponsive';

function GuidelinesPage() {
  const { isMobile } = useResponsive();
  const [activeSection, setActiveSection] = useState('');

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'respectful', title: 'Be Respectful' },
    { id: 'safe', title: 'Stay Safe' },
    { id: 'quality', title: 'Quality Content' },
    { id: 'privacy', title: 'Privacy & Security' },
    { id: 'enforcement', title: 'Enforcement Actions' },
    { id: 'reporting', title: 'Reporting Violations' },
    { id: 'appeals', title: 'Appeals Process' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <LandingHeader />
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          paddingTop: isMobile ? '52px' : '64px',
          background: '#F8F9FA',
          color: '#1A1A1A',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
        }}
      >
      {/* Sidebar Table of Contents - Desktop Only */}
      {!isMobile && (
        <aside
          style={{
            width: '280px',
            position: 'sticky',
            top: '80px',
            height: 'calc(100vh - 80px)',
            overflowY: 'auto',
            padding: '40px 24px',
            borderRight: '1px solid #E8EAED',
            background: '#FFFFFF',
          }}
        >
          <div style={{ position: 'sticky', top: '24px' }}>
            <h2
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#999999',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '24px',
                margin: '0 0 24px 0',
              }}
            >
              Guidelines
            </h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  style={{
                    background: activeSection === section.id ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    color: activeSection === section.id ? '#000000' : '#666666',
                    fontWeight: activeSection === section.id ? '500' : '400',
                    borderLeft: activeSection === section.id ? '2px solid #000000' : '2px solid transparent',
                    paddingLeft: activeSection === section.id ? '10px' : '12px',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== section.id) {
                      e.target.style.background = 'rgba(0, 0, 0, 0.03)';
                      e.target.style.color = '#1A1A1A';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.id) {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#666666';
                    }
                  }}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          maxWidth: '800px',
          margin: '0 auto',
          padding: isMobile ? '12px 16px 48px 16px' : '40px 48px 48px 48px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: isMobile ? '36px' : '48px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Community Guidelines
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#999999',
              margin: '0',
            }}
          >
            Last updated: November 8, 2025
          </p>
        </div>

        {/* Introduction Section */}
        <section id="introduction" style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)',
              }}
            >
              Introduction
            </h2>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Welcome to the Cryb.ai community! Our platform is built on the principles of respect, safety, and meaningful engagement. These Community Guidelines outline the standards of behavior we expect from all users to create a positive and inclusive environment.
            </p>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              By using Cryb.ai, you agree to follow these guidelines. Violations may result in content removal, account suspension, or permanent ban. We encourage all community members to help maintain these standards by reporting violations and treating each other with respect.
            </p>
            <div
              style={{
                marginTop: '24px',
                padding: '20px',
                background: 'rgba(88, 166, 255, 0.08)',
                border: '1px solid rgba(88, 166, 255, 0.3)',
                borderLeft: '4px solid #000000',
                borderRadius: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#1A6BC0',
                  margin: '0',
                  fontWeight: '500',
                }}
              >
                Our mission is to build a community where everyone feels welcome to express themselves, connect with others, and engage in meaningful discussions.
              </p>
            </div>
          </div>
        </section>

        {/* Be Respectful Section */}
        <section id="respectful" style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)',
              }}
            >
              Be Respectful
            </h2>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Treat Others with Kindness
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Respect is the foundation of our community. Treat all members with kindness, empathy, and understanding, regardless of their background, beliefs, opinions, or identity.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              No Harassment or Bullying
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              The following behaviors are strictly prohibited:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Personal attacks, insults, or degrading language
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Harassment, stalking, or intimidation
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Bullying, trolling, or deliberately antagonizing others
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Doxxing or sharing personal information without consent
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Threats of violence or harm
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Sexual harassment or unwanted advances
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              No Hate Speech or Discrimination
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              We have zero tolerance for hate speech, discrimination, or content that promotes violence against individuals or groups based on:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Race, ethnicity, or national origin
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Religion or religious beliefs
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Gender identity or sexual orientation
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Disability or medical condition
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Age or veteran status
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Constructive Disagreement
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Disagreements are natural and can lead to productive discussions. When disagreeing:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Focus on ideas, not individuals
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Use respectful language and tone
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Listen to different perspectives
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Provide constructive feedback
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Know when to disengage from unproductive conversations
              </li>
            </ul>
          </div>
        </section>

        {/* Stay Safe Section */}
        <section id="safe" style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)',
              }}
            >
              Stay Safe
            </h2>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              No Illegal Content
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Do not post, share, or promote content that:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Violates local, national, or international laws
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Promotes illegal activities or services
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Involves child exploitation or abuse
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Distributes drugs, weapons, or other illegal items
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Involves fraud, scams, or financial crimes
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              No Violent or Graphic Content
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Content depicting or promoting violence, gore, or self-harm is prohibited, including:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Graphic violence or death
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Self-harm or suicide
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Animal abuse or cruelty
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Terrorism or extremist content
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              No Adult or Explicit Content
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Cryb.ai is intended for users 13 and older. Sexually explicit content, pornography, or content that sexualizes minors is strictly forbidden.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Protect Your Safety
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              For your own protection:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Do not share personal information (address, phone number, financial details)
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Be cautious about meeting people from the platform in person
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Report suspicious behavior or accounts
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Use strong passwords and enable two-factor authentication
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Be aware of phishing attempts and scams
              </li>
            </ul>
          </div>
        </section>

        {/* Quality Content Section */}
        <section id="quality" style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)',
              }}
            >
              Quality Content
            </h2>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              No Spam
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Spam degrades the community experience. Prohibited spam includes:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Repetitive, unsolicited, or irrelevant posts
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Excessive self-promotion or advertising
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Mass messaging or comment spam
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Misleading links or clickbait
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Vote manipulation or engagement bait
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Stay On Topic
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Post content relevant to the community or channel you're in. Off-topic posts may be removed, especially if they disrupt ongoing discussions or violate community-specific rules.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              No Misinformation
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Do not deliberately spread false or misleading information, especially regarding:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Health and medical advice
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Elections and voting
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Emergencies and public safety
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Financial advice or investment schemes
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Cryptocurrency scams or pump-and-dump schemes
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Original and Authentic Content
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Share original content or properly attribute others' work. Do not:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Plagiarize or steal content
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Post copyrighted material without permission
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Impersonate others or create fake accounts
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Manipulate media to deceive (deepfakes without disclosure)
              </li>
            </ul>
          </div>
        </section>

        {/* Privacy & Security Section */}
        <section id="privacy" style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)',
              }}
            >
              Privacy & Security
            </h2>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Respect Privacy
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Privacy is a fundamental right. You must not:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Share others' personal information without explicit consent
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Post private messages or conversations publicly
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Access accounts or data without authorization
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Track or monitor users without their knowledge
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Crypto and Web3 Security
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              When engaging with Web3 features:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Never share your private keys or seed phrases
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Verify wallet addresses before transactions
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Be cautious of phishing attempts
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Do not promote scams or rug pulls
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Report suspicious NFT or token projects
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Account Security
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Protect your account by:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Using a strong, unique password
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Enabling two-factor authentication
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Not sharing your account with others
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Logging out on shared devices
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Reporting unauthorized access immediately
              </li>
            </ul>
          </div>
        </section>

        {/* Enforcement Actions Section */}
        <section id="enforcement" style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)',
              }}
            >
              Enforcement Actions
            </h2>

            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              When guidelines are violated, we take appropriate action based on the severity and frequency of violations. Our enforcement approach is fair, consistent, and transparent.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Warning
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              For minor or first-time violations, we may issue a warning explaining the violation and expected behavior. Warnings are educational opportunities to help users understand our guidelines.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Content Removal
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Content that violates our guidelines will be removed. You will receive a notification explaining which guideline was violated and why the content was removed.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Temporary Suspension
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Repeated violations or serious infractions may result in temporary account suspension (1-30 days). During suspension, you cannot post, comment, or interact with the platform.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Permanent Ban
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Severe violations or continued pattern of abuse may result in permanent account termination. Banned users may not create new accounts.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Immediate Removal
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Certain violations result in immediate permanent ban without warning:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Child exploitation or abuse
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Credible threats of violence
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Terrorism or violent extremism
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Doxxing with malicious intent
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Operating a bot network or spam operation
              </li>
            </ul>
          </div>
        </section>

        {/* Reporting Violations Section */}
        <section id="reporting" style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)',
              }}
            >
              Reporting Violations
            </h2>

            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Help us maintain a safe community by reporting content or behavior that violates these guidelines.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              How to Report
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              To report a violation:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Click the three dots menu on any post or comment
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Select "Report"
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Choose the violation category
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Provide additional details if needed
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Submit your report
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              What Happens After Reporting
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Once you submit a report:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Our moderation team reviews it within 24 hours
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                We investigate based on context and guidelines
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Appropriate action is taken if violation is confirmed
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                You receive a notification about the outcome
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Your report remains confidential
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Emergency Situations
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              If you encounter content involving:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Immediate danger to life or safety
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Child exploitation
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Terrorism or violent threats
              </li>
            </ul>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Contact law enforcement immediately.
            </p>
          </div>
        </section>

        {/* Appeals Process Section */}
        <section id="appeals" style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)',
              }}
            >
              Appeals Process
            </h2>

            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              If you believe your content was removed or your account was suspended in error, you can appeal the decision.
            </p>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              How to Appeal
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              To submit an appeal:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Go to the enforcement notification email or message
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Click "Appeal this decision"
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Provide a clear explanation of why you believe the action was incorrect
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Include any relevant context or evidence
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Submit your appeal within 30 days
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Appeal Review
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Our appeals team will:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Review your appeal within 5-7 business days
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Re-examine the content and context
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Make an independent determination
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Notify you of the final decision
              </li>
            </ul>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '24px 0 12px 0',
              }}
            >
              Appeal Outcomes
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Possible outcomes include:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Uphold: Original decision stands
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Reverse: Content restored or account reinstated
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Modify: Enforcement action adjusted
              </li>
            </ul>

            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Appeal decisions are final. Multiple frivolous appeals may result in additional enforcement action.
            </p>
          </div>
        </section>

        {/* Footer Contact Section */}
        <div style={{ marginTop: '48px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '16px',
              padding: isMobile ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              Questions or Concerns?
            </h3>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0 0 16px 0',
              }}
            >
              If you have questions about these Community Guidelines or need clarification, please contact us:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', listStyle: 'disc' }}>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Help Center:{' '}
                <Link
                  to="/help"
                  style={{
                    color: '#000000',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#1a6bc0')}
                  onMouseLeave={(e) => (e.target.style.color = '#000000')}
                >
                  Visit Help Center
                </Link>
              </li>
              <li style={{ fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', marginBottom: '8px' }}>
                Terms of Service:{' '}
                <Link
                  to="/terms"
                  style={{
                    color: '#000000',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#1a6bc0')}
                  onMouseLeave={(e) => (e.target.style.color = '#000000')}
                >
                  Read our Terms
                </Link>
              </li>
            </ul>
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#1A1A1A',
                margin: '0',
              }}
            >
              Thank you for helping make Cryb.ai a welcoming and positive community for everyone!
            </p>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}

export default GuidelinesPage;
