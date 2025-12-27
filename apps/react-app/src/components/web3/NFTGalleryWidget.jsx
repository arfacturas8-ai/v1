/**
 * NFT Gallery Widget - Display User's NFT Collection
 * iOS-Style Modern Design with Grid Layout
 */

import React, { useState } from 'react';
import { Image as ImageIcon, ExternalLink, Eye, Heart, Share2 } from 'lucide-react';

const NFTCard = ({ nft, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 12px 24px rgba(0, 0, 0, 0.15)'
          : '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* NFT Image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          background: nft.image
            ? `url(${nft.image})`
            : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {!nft.image && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon size={32} color="#FFFFFF" opacity={0.5} />
          </div>
        )}

        {/* Hover Overlay */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                // View NFT details
              }}
              style={{
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Share NFT
              }}
              style={{
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Share2 size={20} />
            </button>
          </div>
        )}
      </div>

      {/* NFT Info */}
      <div style={{ padding: '12px', background: '#FFFFFF' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1A1A1A',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {nft.name || 'Untitled NFT'}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#666666',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {nft.collection || 'Unknown Collection'}
        </div>

        {nft.floorPrice && (
          <div
            style={{
              marginTop: '8px',
              padding: '6px 10px',
              background: '#F8F9FA',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '12px', color: '#666666' }}>Floor</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>
              {nft.floorPrice} ETH
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function NFTGalleryWidget({ nfts = [], onViewAll, compact = false }) {
  const displayNFTs = compact ? nfts.slice(0, 4) : nfts;

  if (nfts.length === 0) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E8EAED',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <ImageIcon size={48} color="#CCCCCC" style={{ margin: '0 auto 16px' }} />
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1A1A1A',
            marginBottom: '8px',
          }}
        >
          No NFTs Yet
        </h3>
        <p style={{ fontSize: '14px', color: '#666666', margin: 0 }}>
          Your NFT collection will appear here
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E8EAED',
        padding: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={20} color="#58a6ff" />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>
            NFT Collection
          </h3>
        </div>
        {onViewAll && nfts.length > (compact ? 4 : 0) && (
          <button
            onClick={onViewAll}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              color: '#58a6ff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            View All ({nfts.length})
          </button>
        )}
      </div>

      {/* NFT Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact
            ? 'repeat(2, 1fr)'
            : 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px',
        }}
      >
        {displayNFTs.map((nft, index) => (
          <NFTCard key={nft.id || index} nft={nft} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
}
