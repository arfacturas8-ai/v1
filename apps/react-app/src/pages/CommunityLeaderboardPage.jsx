/**
 * CommunityLeaderboardPage.jsx
 * iOS-inspired modern design with clean aesthetics
 * Updated: 2025-12-19
 */

import React, { memo } from 'react'
import { Trophy, Medal, Crown, Star } from 'lucide-react'

const CommunityLeaderboardPage = () => {
  return (
    <div
      style={{ minHeight: '100vh', padding: '48px 16px', background: '#FAFAFA' }}
      role="main"
      aria-label="Community leaderboard page"
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Trophy size={32} style={{ color: '#F59E0B' }} />
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px'
          }}>
            Community Leaderboard
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>Top contributors and most active members</p>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '40px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '240px',
            background: 'white',
            border: '1px solid rgba(192, 192, 192, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Medal size={32} style={{ color: '#C0C0C0', marginBottom: '12px' }} />
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#000', margin: '12px 0' }}>2</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>--</div>
            <div style={{ fontSize: '14px', color: '#666' }}>0 pts</div>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '240px',
            background: 'white',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Crown size={40} style={{ color: '#F59E0B', marginBottom: '12px' }} />
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#000', margin: '12px 0' }}>1</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>--</div>
            <div style={{ fontSize: '14px', color: '#666' }}>0 pts</div>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '240px',
            background: 'white',
            border: '1px solid rgba(205, 127, 50, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Star size={32} style={{ color: '#CD7F32', marginBottom: '12px' }} />
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#000', margin: '12px 0' }}>3</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>--</div>
            <div style={{ fontSize: '14px', color: '#666' }}>0 pts</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '24px' }}>All Rankings</h3>
          <p style={{
            color: '#666',
            fontSize: '14px',
            textAlign: 'center',
            padding: '48px 0'
          }}>
            No rankings available yet. Start participating to earn points!
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(CommunityLeaderboardPage)
