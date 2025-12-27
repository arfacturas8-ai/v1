/**
 * Wallet Widget - Connect Wallet & Display Balance
 * iOS-Style Modern Design with Multi-Chain Support
 */

import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Copy, CheckCircle, ExternalLink, ChevronDown } from 'lucide-react';

export default function WalletWidget({ user, onConnect, onDisconnect, compact = false }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (user?.walletAddress) {
      setIsConnected(true);
      setWalletAddress(user.walletAddress);
      setBalance(user.walletBalance || { usd: 0, eth: 0 });
    }
  }, [user]);

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatBalance = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: compact ? '8px 16px' : '12px 20px',
          background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: compact ? '10px' : '12px',
          fontSize: compact ? '14px' : '15px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(88, 166, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 166, 255, 0.3)';
        }}
      >
        <Wallet size={compact ? 18 : 20} />
        Connect Wallet
      </button>
    );
  }

  if (compact) {
    return (
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
        }}
      >
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(88, 166, 255, 0.1)',
            border: '1px solid #58a6ff',
            borderRadius: '10px',
            color: '#58a6ff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Wallet size={16} />
          {shortenAddress(walletAddress)}
          <ChevronDown size={14} />
        </button>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              minWidth: '200px',
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8EAED' }}>
              <div style={{ fontSize: '12px', color: '#666666', marginBottom: '4px' }}>
                Balance
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A' }}>
                {formatBalance(balance?.usd)}
              </div>
            </div>
            <button
              onClick={copyAddress}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                color: '#1A1A1A',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {copied ? <CheckCircle size={16} color="#10B981" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
            <button
              onClick={() => window.open(`https://etherscan.io/address/${walletAddress}`, '_blank')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                color: '#1A1A1A',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ExternalLink size={16} />
              View on Explorer
            </button>
            <button
              onClick={onDisconnect}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderTop: '1px solid #E8EAED',
                color: '#EF4444',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderRadius: '16px',
        padding: '20px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translate(30%, -30%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Wallet size={20} />
          <span style={{ fontSize: '15px', fontWeight: '600', opacity: 0.9 }}>
            Your Wallet
          </span>
        </div>

        {/* Balance */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
            {formatBalance(balance?.usd)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
            <span style={{ fontSize: '14px' }}>
              {balance?.eth?.toFixed(4) || '0.0000'} ETH
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
              <TrendingUp size={14} />
              +12.5%
            </div>
          </div>
        </div>

        {/* Address */}
        <button
          onClick={copyAddress}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '12px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
        >
          <span>{shortenAddress(walletAddress)}</span>
          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.open(`https://etherscan.io/address/${walletAddress}`, '_blank')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            View Explorer
          </button>
          <button
            onClick={onDisconnect}
            style={{
              padding: '10px 16px',
              background: 'rgba(239, 68, 68, 0.2)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
