import React from 'react';
import { SkeletonFeed, SkeletonGrid, SkeletonList } from './SkeletonGrid';
import { SkeletonProfile, SkeletonProfileStats, SkeletonProfileActivity } from './SkeletonProfile';
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton } from './SkeletonBase';

/**
 * Page-specific Skeleton Loading Components
 * Pre-configured skeletons for entire pages
 */

export function HomePageSkeleton({ className = '' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117'
    }}>
      <div style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '32px',
        paddingBottom: '32px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Hero Section */}
        <div
          className="mb-8"
        >
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <Skeleton width="300px" height="3rem" className="mb-4 mx-auto" />
            <SkeletonText lines={2} className="max-w-2xl mx-auto" />
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(22, 27, 34, 0.6)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '24px',
                  textAlign: 'center'
                }}
              >
                <Skeleton width="60px" height="2.5rem" className="mb-2 mx-auto" />
                <Skeleton width="100px" height="1rem" className="mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Featured Communities */}
        <div
          className="mb-8"
        >
          <Skeleton width="200px" height="2rem" className="mb-6" />
          <SkeletonGrid items={6} columns={3} type="community" />
        </div>

        {/* Trending Posts */}
        <div>
          <Skeleton width="200px" height="2rem" className="mb-6" />
          <SkeletonFeed items={5} showMedia />
        </div>
      </div>
    </div>
  );
}

export function CommunitiesPageSkeleton({ className = '' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117'
    }}>
      <div style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '32px',
        paddingBottom: '32px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}
        >
          <div>
            <Skeleton width="250px" height="2.5rem" className="mb-2" />
            <Skeleton width="350px" height="1rem" />
          </div>
          <SkeletonButton size="lg" />
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <Skeleton width="200px" height="40px" rounded="lg" />
          <Skeleton width="150px" height="40px" rounded="lg" />
          <Skeleton width="150px" height="40px" rounded="lg" />
        </div>

        {/* Communities Grid */}
        <SkeletonGrid items={12} columns={3} type="community" />
      </div>
    </div>
  );
}

export function ProfilePageSkeleton({ className = '' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117'
    }}>
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <SkeletonProfile />

        <div style={{
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '32px',
          paddingBottom: '32px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <SkeletonProfileStats />
              <div
                style={{
                  background: 'rgba(22, 27, 34, 0.6)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '24px'
                }}
              >
                <Skeleton width="120px" height="1.25rem" className="mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <SkeletonCircle size="xs" />
                      <Skeleton width="150px" height="1rem" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <SkeletonProfileActivity items={8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PostDetailPageSkeleton({ className = '' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117'
    }}>
      <div style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '32px',
        paddingBottom: '32px',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Post */}
        <div
          style={{
            background: 'rgba(22, 27, 34, 0.6)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            marginBottom: '24px'
          }}
        >
          <div style={{
            padding: '24px'
          }}>
            {/* Post Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <SkeletonCircle size="md" />
              <div style={{
                flex: '1'
              }}>
                <Skeleton width="150px" height="1rem" className="mb-2" />
                <Skeleton width="200px" height="0.875rem" />
              </div>
            </div>

            {/* Post Title */}
            <Skeleton width="100%" height="2rem" className="mb-4" />

            {/* Post Content */}
            <SkeletonText lines={5} spacing="sm" className="mb-4" />

            {/* Post Image */}
            <Skeleton width="100%" height="400px" rounded="lg" className="mb-4" />

            {/* Post Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <SkeletonButton size="sm" />
                <SkeletonButton size="sm" />
                <SkeletonButton size="sm" />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Skeleton width="24px" height="24px" />
                <Skeleton width="24px" height="24px" />
                <Skeleton width="24px" height="24px" />
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div
          style={{
            background: 'rgba(22, 27, 34, 0.6)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px'
          }}
        >
          <Skeleton width="150px" height="1.5rem" className="mb-6" />

          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px'
              }}>
                <SkeletonCircle size="sm" />
                <div style={{
                  flex: '1'
                }}>
                  <Skeleton width="120px" height="1rem" className="mb-2" />
                  <SkeletonText lines={2} spacing="xs" className="mb-3" />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <Skeleton width="60px" height="0.875rem" />
                    <Skeleton width="60px" height="0.875rem" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchPageSkeleton({ className = '' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117'
    }}>
      <div style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '32px',
        paddingBottom: '32px',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Search Bar */}
        <div
          className="mb-8"
        >
          <Skeleton width="100%" height="56px" rounded="xl" className="mb-4" />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Skeleton width="100px" height="32px" rounded="full" />
            <Skeleton width="120px" height="32px" rounded="full" />
            <Skeleton width="90px" height="32px" rounded="full" />
          </div>
        </div>

        {/* Results */}
        <div>
          <Skeleton width="200px" height="1.5rem" className="mb-6" />
          <SkeletonList items={10} showAvatar showSecondary showAction />
        </div>
      </div>
    </div>
  );
}

export function SettingsPageSkeleton({ className = '' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117'
    }}>
      <div style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '32px',
        paddingBottom: '32px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div
          className="mb-8"
        >
          <Skeleton width="200px" height="2.5rem" className="mb-2" />
          <Skeleton width="300px" height="1rem" />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Sidebar */}
          <div
            className="lg:col-span-1"
          >
            <div style={{
              background: 'rgba(22, 27, 34, 0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px'
            }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} width="100%" height="40px" rounded="lg" className="mb-2" />
              ))}
            </div>
          </div>

          {/* Settings Content */}
          <div
            className="lg:col-span-3 space-y-6"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(22, 27, 34, 0.6)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '24px'
                }}
              >
                <Skeleton width="200px" height="1.5rem" className="mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j}>
                      <Skeleton width="150px" height="1rem" className="mb-2" />
                      <Skeleton width="100%" height="40px" rounded="lg" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePageSkeleton
