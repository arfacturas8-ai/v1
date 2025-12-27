import React, { useState, useEffect, memo } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Heart, Share2, ShoppingCart, Tag, Eye,
  Clock, TrendingUp, Users, ExternalLink, MoreVertical
} from 'lucide-react'
import nftService from '../services/nftService'
import { useToast } from '../contexts/ToastContext'
import { useResponsive } from '../hooks/useResponsive'

/**
 * NFTDetailPage Component
 * Detailed view of an NFT with metadata, history, and purchase options
 */
const NFTDetailPage = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const { nftId } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState('details') // details, history, offers
  const [nftData, setNftData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadNFTData()
  }, [nftId])

  const loadNFTData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await nftService.getNFTDetails(nftId)
      if (response.success && response.data) {
        setNftData(response.data)
      } else {
        throw new Error(response.error || 'Failed to load NFT details')
      }
    } catch (err) {
      console.error('Failed to load NFT:', err)
      const errorMsg = err.message || 'Failed to load NFT details. Please try again.'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async () => {
    try {
      // In a real app, this would integrate with Web3
      showSuccess('Purchase flow initiated')
      // await nftService.purchaseNFT(nftId)
    } catch (err) {
      console.error('Purchase failed:', err)
      showError('Purchase failed. Please try again.')
    }
  }

  const handleMakeOffer = async () => {
    try {
      // In a real app, this would open a modal for offer details
      showSuccess('Make offer modal would open')
      // Open offer modal
    } catch (err) {
      console.error('Make offer failed:', err)
      showError('Failed to make offer. Please try again.')
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: nftData?.name || 'NFT',
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        showSuccess('Link copied to clipboard')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err)
        showError('Failed to share')
      }
    }
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} role="status" aria-live="polite">
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid #E8EAED',
          borderTop: '4px solid #58a6ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>Loading NFT details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '16px' : '24px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
          <h2 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '700',
            marginBottom: '12px',
            color: '#1A1A1A'
          }}>Failed to Load NFT</h2>
          <p style={{
            fontSize: '16px',
            color: '#666666',
            marginBottom: '32px',
            lineHeight: '1.5'
          }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <button
              onClick={loadNFTData}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              aria-label="Retry loading NFT"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/nft-marketplace')}
              style={{
                padding: '14px 28px',
                background: '#FFFFFF',
                color: '#1A1A1A',
                border: '1px solid #E8EAED',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
              aria-label="Back to marketplace"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!nftData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '16px' : '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔍</div>
          <h2 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '700',
            marginBottom: '12px',
            color: '#1A1A1A'
          }}>NFT Not Found</h2>
          <p style={{
            fontSize: '16px',
            color: '#666666',
            marginBottom: '32px'
          }}>The NFT you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/nft-marketplace')}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            aria-label="Back to marketplace"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      paddingTop: isMobile ? '56px' : '72px'
    }} role="main" aria-label="NFT detail page">
      {/* Header */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E8EAED',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: isMobile ? '16px' : '24px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '12px' : '16px'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px',
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              color: '#666666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Go back"
          >
            <ArrowLeft style={{ width: '24px', height: '24px' }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: isMobile ? '20px' : '28px',
              fontWeight: '700',
              color: '#1A1A1A',
              marginBottom: '4px'
            }}>{nftData.name}</h1>
            <p style={{
              fontSize: '14px',
              color: '#666666'
            }}>{nftData.collection}</p>
          </div>
          <button
            onClick={handleShare}
            style={{
              padding: '10px',
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              color: '#666666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Share NFT"
          >
            <Share2 style={{ width: '24px', height: '24px' }} />
          </button>
          <button
            style={{
              padding: '10px',
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              color: '#666666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="More options"
          >
            <MoreVertical style={{ width: '24px', height: '24px' }} />
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: isMobile ? '16px' : isTablet ? '24px' : '32px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
          gap: isMobile ? '24px' : '32px'
        }}>
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{
              aspectRatio: '1',
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}>
              <img
                src={nftData.image}
                alt={nftData.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: isMobile ? '12px' : '16px'
            }}>
              <div style={{
                padding: isMobile ? '16px' : '20px',
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}>
                <Eye style={{
                  width: '24px',
                  height: '24px',
                  margin: '0 auto 8px',
                  color: '#1A1A1A'
                }} />
                <div style={{
                  fontSize: isMobile ? '18px' : '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '4px'
                }}>{nftData.stats.views}</div>
                <div style={{
                  fontSize: '12px',
                  color: '#666666'
                }}>Views</div>
              </div>
              <div style={{
                padding: isMobile ? '16px' : '20px',
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}>
                <Heart style={{
                  width: '24px',
                  height: '24px',
                  margin: '0 auto 8px',
                  color: '#FF6B9D'
                }} />
                <div style={{
                  fontSize: isMobile ? '18px' : '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '4px'
                }}>{nftData.stats.likes}</div>
                <div style={{
                  fontSize: '12px',
                  color: '#666666'
                }}>Likes</div>
              </div>
              <div style={{
                padding: isMobile ? '16px' : '20px',
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}>
                <Tag style={{
                  width: '24px',
                  height: '24px',
                  margin: '0 auto 8px',
                  color: '#1A1A1A'
                }} />
                <div style={{
                  fontSize: isMobile ? '18px' : '24px',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  marginBottom: '4px'
                }}>{nftData.stats.offers}</div>
                <div style={{
                  fontSize: '12px',
                  color: '#666666'
                }}>Offers</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '16px' : '24px'
            }}
          >
            {/* Price Card */}
            <div style={{
              padding: isMobile ? '20px' : '28px',
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}>
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '8px'
                  }}>Current Price</div>
                  <div style={{
                    fontSize: isMobile ? '32px' : '40px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: '4px'
                  }}>{nftData.price}</div>
                  <div style={{
                    fontSize: '16px',
                    color: '#666666'
                  }}>{nftData.priceUSD}</div>
                </div>
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  style={{
                    padding: '14px',
                    background: isLiked ? 'rgba(255, 107, 157, 0.1)' : '#F5F5F5',
                    border: isLiked ? '1px solid rgba(255, 107, 157, 0.3)' : '1px solid #E8EAED',
                    borderRadius: '12px',
                    color: isLiked ? '#FF6B9D' : '#666666',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label={isLiked ? 'Unlike NFT' : 'Like NFT'}
                  aria-pressed={isLiked}
                >
                  <Heart style={{
                    width: '24px',
                    height: '24px',
                    fill: isLiked ? 'currentColor' : 'none'
                  }} />
                </button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <button
                  onClick={handlePurchase}
                  style={{
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  aria-label="Buy this NFT now"
                >
                  <ShoppingCart style={{ width: '20px', height: '20px' }} />
                  Buy Now
                </button>
                <button
                  onClick={handleMakeOffer}
                  style={{
                    padding: '14px 24px',
                    background: '#FFFFFF',
                    color: '#1A1A1A',
                    border: '1px solid #E8EAED',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                  aria-label="Make an offer for this NFT"
                >
                  Make Offer
                </button>
              </div>
            </div>

            {/* Owner Info */}
            <div style={{
              padding: isMobile ? '20px' : '28px',
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile ? '20px' : '24px'
              }}>
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '12px'
                  }}>Creator</div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      flexShrink: 0
                    }} />
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1A1A1A'
                    }}>{nftData.creator}</div>
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '12px'
                  }}>Owner</div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      flexShrink: 0
                    }} />
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1A1A1A'
                    }}>{nftData.owner}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #E8EAED'
              }}>
                {['details', 'attributes', 'history'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      fontSize: '15px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      background: activeTab === tab ? 'rgba(88, 166, 255, 0.05)' : 'transparent',
                      color: activeTab === tab ? '#58a6ff' : '#666666',
                      borderBottom: activeTab === tab ? '2px solid #58a6ff' : '2px solid transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab) {
                        e.currentTarget.style.background = '#F5F5F5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`${tab}-panel`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ padding: isMobile ? '20px' : '28px' }}>
                {activeTab === 'details' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{
                      fontSize: '15px',
                      color: '#666666',
                      lineHeight: '1.6'
                    }}>{nftData.description}</p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #E8EAED'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          color: '#666666',
                          marginBottom: '6px'
                        }}>Contract</div>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          color: '#1A1A1A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {nftData.contract}
                          <ExternalLink style={{
                            width: '16px',
                            height: '16px',
                            color: '#1A1A1A'
                          }} />
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          color: '#666666',
                          marginBottom: '6px'
                        }}>Token ID</div>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          color: '#1A1A1A'
                        }}>{nftData.tokenId}</div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          color: '#666666',
                          marginBottom: '6px'
                        }}>Blockchain</div>
                        <div style={{
                          fontSize: '14px',
                          color: '#1A1A1A'
                        }}>{nftData.blockchain}</div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          color: '#666666',
                          marginBottom: '6px'
                        }}>Royalty</div>
                        <div style={{
                          fontSize: '14px',
                          color: '#1A1A1A'
                        }}>{nftData.royalty}</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attributes' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    {nftData.attributes.map((attr, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: '#F5F5F5',
                        border: '1px solid #E8EAED',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#666666',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: '600'
                        }}>{attr.trait_type}</div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#1A1A1A',
                          marginBottom: '8px'
                        }}>{attr.value}</div>
                        <div style={{
                          fontSize: '12px',
                          color: '#1A1A1A',
                          background: 'rgba(88, 166, 255, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>{attr.rarity} have this trait</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { event: 'Sale', from: 'bob.eth', to: 'alice.eth', price: '2.5 ETH', time: '2 hours ago' },
                      { event: 'Transfer', from: 'charlie.eth', to: 'bob.eth', price: '-', time: '1 day ago' },
                      { event: 'Minted', from: 'Creator', to: 'charlie.eth', price: '0.5 ETH', time: '7 days ago' }
                    ].map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: isMobile ? '16px' : '20px',
                        background: '#F5F5F5',
                        border: '1px solid #E8EAED',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '12px' : '16px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          width: isMobile ? '100%' : 'auto'
                        }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: item.event === 'Sale' ? '#10B981' :
                                       item.event === 'Transfer' ? '#000000' : '#000000',
                            flexShrink: 0
                          }} />
                          <div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#1A1A1A',
                              marginBottom: '4px'
                            }}>{item.event}</div>
                            <div style={{
                              fontSize: '14px',
                              color: '#666666'
                            }}>
                              {item.from} → {item.to}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          textAlign: isMobile ? 'left' : 'right',
                          width: isMobile ? '100%' : 'auto'
                        }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1A1A1A',
                            marginBottom: '4px'
                          }}>{item.price}</div>
                          <div style={{
                            fontSize: '13px',
                            color: '#666666'
                          }}>{item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

NFTDetailPage.propTypes = {}

export default memo(NFTDetailPage)
