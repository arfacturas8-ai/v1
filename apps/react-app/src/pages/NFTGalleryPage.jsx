/**
 * NFTGalleryPage Component
 * Displays user's NFT gallery with iOS aesthetic
 * Features: Grid/list view, search, filters, collection stats
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Image, Grid, List, Filter, Search, ExternalLink, Heart } from 'lucide-react'
import { PageSkeleton } from '../components/LoadingSkeleton'
import { useResponsive } from '../hooks/useResponsive'

const NFTCard = ({ nft, isMobile }) => {
  const [liked, setLiked] = useState(false)

  return (
    <Link
      to={`/nft/${nft.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          overflow: 'hidden',
          transition: 'all 0.2s',
          borderRadius: isMobile ? '16px' : '20px',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          minHeight: isMobile ? '240px' : '280px',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '1',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
        }}>
          {nft.image ? (
            <img
              src={nft.image}
              alt={nft.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s'
              }}
              loading="lazy"
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Image size={48} style={{ color: '#999999' }} />
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              setLiked(!liked)
            }}
            style={{
              position: 'absolute',
              top: isMobile ? '8px' : '12px',
              right: isMobile ? '8px' : '12px',
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              background: liked ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={20}
              fill={liked ? 'white' : 'none'}
              style={{ color: liked ? 'white' : 'white' }}
            />
          </button>
        </div>

        <div style={{ padding: '16px' }}>
          <h3 style={{
            fontWeight: '600',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#1A1A1A',
            fontSize: '16px'
          }}>
            {nft.name}
          </h3>
          <p style={{
            fontSize: '14px',
            marginBottom: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#666666'
          }}>
            {nft.collection}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#999999' }}>Price</div>
              <div style={{
                fontWeight: '600',
                color: '#1A1A1A'
              }}>
                {nft.price || '—'}
              </div>
            </div>
            {nft.rarity && (
              <div style={{
                padding: '6px 12px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: '500',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#1A1A1A'
              }}>
                {nft.rarity}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

const NFTListItem = ({ nft }) => {
  const [liked, setLiked] = useState(false)

  return (
    <Link
      to={`/nft/${nft.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px',
          borderRadius: '20px',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          minHeight: '100px',
          transition: 'all 0.2s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: '16px',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
        }}>
          {nft.image ? (
            <img
              src={nft.image}
              alt={nft.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              loading="lazy"
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Image size={48} style={{ color: '#999999' }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontWeight: '600',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#1A1A1A',
            fontSize: '16px'
          }}>
            {nft.name}
          </h3>
          <p style={{
            fontSize: '14px',
            marginBottom: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#666666'
          }}>
            {nft.collection}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#999999' }}>Price</div>
              <div style={{
                fontWeight: '600',
                fontSize: '14px',
                color: '#1A1A1A'
              }}>
                {nft.price || '—'}
              </div>
            </div>
            {nft.rarity && (
              <div style={{
                padding: '6px 12px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: '500',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#1A1A1A'
              }}>
                {nft.rarity}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.preventDefault()
              setLiked(!liked)
            }}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              background: liked ? 'rgba(239, 68, 68, 0.1)' : '#F9FAFB',
              border: '1px solid #E5E7EB',
              cursor: 'pointer',
              flexShrink: 0
            }}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={20}
              fill={liked ? '#EF4444' : 'none'}
              style={{ color: liked ? '#EF4444' : '#666666' }}
            />
          </button>
        </div>
      </div>
    </Link>
  )
}

export default function NFTGalleryPage() {
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const [nfts, setNfts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [filterBy, setFilterBy] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const pagePadding = isDesktop ? '80px' : isTablet ? '24px' : '16px'
  const headerPaddingTop = isDesktop || isTablet ? '72px' : '56px'

  useEffect(() => {
    fetchNFTs()
  }, [filterBy])

  const fetchNFTs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/nfts/gallery?filter=${filterBy}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setNfts(data.nfts || [])
      }
    } catch (error) {
      console.error('NFT fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNFTs = nfts.filter(nft =>
    nft.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nft.collection?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return <PageSkeleton />
  }

  return (
    <div
      role="main"
      aria-label="NFT gallery page"
      style={{
        background: '#FAFAFA',
        paddingTop: headerPaddingTop,
        paddingLeft: pagePadding,
        paddingRight: pagePadding,
        paddingBottom: '48px',
        minHeight: '100vh'
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '48px'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '28px' : '32px',
              marginBottom: '16px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              My NFT Gallery
            </h1>
            <p style={{ color: '#666666', fontSize: '16px' }}>
              View and manage your digital collectibles
            </p>
          </div>

          <Link
            to="/nft-marketplace"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '16px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s',
              height: '48px',
              padding: '0 24px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              color: '#FFFFFF',
              fontSize: '16px',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            aria-label="Browse marketplace"
          >
            Browse Marketplace
            <ExternalLink size={20} />
          </Link>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            flex: 1,
            minWidth: isMobile ? '200px' : '300px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <Search size={20} style={{ color: '#999999' }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NFTs..."
              style={{
                width: '100%',
                outline: 'none',
                transition: 'all 0.2s',
                height: '48px',
                paddingLeft: '48px',
                paddingRight: '16px',
                fontSize: '16px',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                background: '#FFFFFF',
                color: '#1A1A1A'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#58a6ff'
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.boxShadow = 'none'
              }}
              aria-label="Search NFTs"
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={20} style={{ color: '#666666' }} />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              style={{
                outline: 'none',
                cursor: 'pointer',
                height: '48px',
                padding: '0 16px',
                fontSize: '16px',
                fontWeight: '500',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                background: '#FFFFFF',
                color: '#1A1A1A'
              }}
              aria-label="Filter NFTs"
            >
              <option value="all">All NFTs</option>
              <option value="art">Art</option>
              <option value="collectibles">Collectibles</option>
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
              <option value="photography">Photography</option>
            </select>
          </div>

          <div style={{
            display: 'flex',
            gap: '4px',
            borderRadius: '16px',
            padding: '4px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB'
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: viewMode === 'grid' ? '#58a6ff' : '#666666',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '12px',
                transition: 'all 0.2s'
              }}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: viewMode === 'list' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: viewMode === 'list' ? '#58a6ff' : '#666666',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '12px',
                transition: 'all 0.2s'
              }}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {[
            { label: 'Total NFTs', value: filteredNFTs.length, color: '#000000' },
            { label: 'Collections', value: new Set(filteredNFTs.map(n => n.collection)).size, color: '#000000' },
            { label: 'Total Value', value: '$12,450', color: '#10B981' }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                padding: '24px',
                minHeight: '100px',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{
                marginBottom: '8px',
                fontWeight: '500',
                color: '#666666',
                fontSize: '14px'
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: isMobile ? '24px' : '28px',
                fontWeight: '700',
                color: stat.color
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {filteredNFTs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            borderRadius: '20px',
            border: '1px solid #E5E7EB',
            background: '#FFFFFF',
            padding: isMobile ? '64px 24px' : '80px 24px'
          }}>
            <div style={{
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              marginBottom: '24px'
            }}>
              <Image size={48} style={{ color: '#666666' }} />
            </div>
            <h3 style={{
              fontWeight: '600',
              marginBottom: '12px',
              fontSize: isMobile ? '18px' : '20px',
              color: '#000000'
            }}>
              No NFTs Found
            </h3>
            <p style={{
              marginBottom: '24px',
              fontSize: '16px',
              color: '#666666'
            }}>
              {searchQuery ? 'Try adjusting your search or filters' : 'Start collecting NFTs to see them here'}
            </p>
            <Link
              to="/nft-marketplace"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '16px',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '48px',
                padding: '0 24px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                color: '#FFFFFF',
                fontSize: '16px',
                textDecoration: 'none'
              }}
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: isMobile ? '16px' : '24px'
              }}>
                {filteredNFTs.map((nft, index) => (
                  <NFTCard key={nft.id || index} nft={nft} isMobile={isMobile} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {filteredNFTs.map((nft, index) => (
                  <NFTListItem key={nft.id || index} nft={nft} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
