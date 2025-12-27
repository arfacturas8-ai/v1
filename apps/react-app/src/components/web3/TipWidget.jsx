/**
 * Tip Widget - Send Crypto Tips to Content Creators
 * iOS-Style Modern Design with Multi-Token Support
 */

import React, { useState } from 'react';
import { Zap, X, TrendingUp, Check } from 'lucide-react';

const QUICK_AMOUNTS = [
  { label: '$1', value: 1 },
  { label: '$5', value: 5 },
  { label: '$10', value: 10 },
  { label: '$25', value: 25 },
];

const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$', color: '#2775CA' },
  { symbol: 'DAI', name: 'Dai', icon: '◈', color: '#F5AC37' },
];

export default function TipWidget({ recipient, onSend, onClose, inline = false }) {
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setSending(true);
    try {
      await onSend({
        token: selectedToken.symbol,
        amount: parseFloat(amount),
        message: message.trim(),
        recipient: recipient.id,
      });
      setSent(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      console.error('Tip send error:', error);
    } finally {
      setSending(false);
    }
  };

  const content = (
    <div style={{ background: '#FFFFFF' }}>
      {/* Success State */}
      {sent ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: '#10B981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={32} color="#FFFFFF" />
          </div>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1A1A1A',
              marginBottom: '8px',
            }}
          >
            Tip Sent!
          </h3>
          <p style={{ fontSize: '15px', color: '#666666', margin: 0 }}>
            {recipient.displayName} will receive your tip shortly
          </p>
        </div>
      ) : (
        <>
          {/* Recipient Info */}
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid #E8EAED',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: recipient.avatarUrl
                  ? `url(${recipient.avatarUrl})`
                  : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                backgroundSize: 'cover',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1A1A1A',
                  marginBottom: '2px',
                }}
              >
                Tip {recipient.displayName}
              </div>
              <div style={{ fontSize: '13px', color: '#666666' }}>
                @{recipient.username}
              </div>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Token Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#666666',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Token
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {TOKENS.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => setSelectedToken(token)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background:
                        selectedToken.symbol === token.symbol
                          ? `${token.color}15`
                          : '#F8F9FA',
                      border:
                        selectedToken.symbol === token.symbol
                          ? `2px solid ${token.color}`
                          : '2px solid transparent',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{token.icon}</span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1A1A1A',
                      }}
                    >
                      {token.symbol}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Amounts */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#666666',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Quick Amount
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {QUICK_AMOUNTS.map((quickAmount) => (
                  <button
                    key={quickAmount.value}
                    onClick={() => setAmount(quickAmount.value.toString())}
                    style={{
                      padding: '10px',
                      background:
                        amount === quickAmount.value.toString()
                          ? 'rgba(88, 166, 255, 0.1)'
                          : '#F8F9FA',
                      border:
                        amount === quickAmount.value.toString()
                          ? '2px solid #58a6ff'
                          : '2px solid transparent',
                      borderRadius: '8px',
                      color: '#1A1A1A',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {quickAmount.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#666666',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Custom Amount (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '2px solid #E8EAED',
                  borderRadius: '10px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#58a6ff')}
                onBlur={(e) => (e.target.style.borderColor = '#E8EAED')}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#666666',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a nice message..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid #E8EAED',
                  borderRadius: '10px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#58a6ff')}
                onBlur={(e) => (e.target.style.borderColor = '#E8EAED')}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !amount || parseFloat(amount) <= 0}
              style={{
                width: '100%',
                padding: '14px 24px',
                background:
                  sending || !amount || parseFloat(amount) <= 0
                    ? '#CCCCCC'
                    : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor:
                  sending || !amount || parseFloat(amount) <= 0
                    ? 'not-allowed'
                    : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!sending && amount && parseFloat(amount) > 0) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <Zap size={20} />
              {sending ? 'Sending...' : `Send ${amount ? `$${amount}` : 'Tip'}`}
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (inline) {
    return <div style={{ borderRadius: '16px', overflow: 'hidden' }}>{content}</div>;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        {!sent && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)')}
          >
            <X size={20} color="#666666" />
          </button>
        )}

        {content}
      </div>
    </div>
  );
}
