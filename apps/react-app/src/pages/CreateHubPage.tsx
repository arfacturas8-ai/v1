/**
 * CreateHubPage - Create hub with options for posts, communities, NFTs
 *
 * iOS Design System:
 * - Background: #FAFAFA (light gray)
 * - Text: #000 (primary), #666 (secondary)
 * - Cards: white with subtle shadows
 * - Border radius: 16-24px for modern iOS feel
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04)
 * - Gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
 * - Icons: 20px standard size
 * - Hover: translateY(-2px) for interactive elements
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Image, Package } from 'lucide-react';

interface CreateOption {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  isLive: boolean;
}

export function CreateHubPage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null);

  const createOptions: CreateOption[] = [
    {
      title: 'New Post',
      description: 'Share updates with your followers',
      icon: <FileText size={32} />,
      route: '/create-post',
      isLive: true,
    },
    {
      title: 'Start Community',
      description: 'Build a space for your audience',
      icon: <Users size={32} />,
      route: '/create-community',
      isLive: true,
    },
    {
      title: 'Create NFT',
      description: 'Mint your creation on the blockchain',
      icon: <Image size={32} />,
      route: '/create-nft',
      isLive: false,
    },
    {
      title: 'Create Collection',
      description: 'Organize your NFTs into a collection',
      icon: <Package size={32} />,
      route: '/create-nft',
      isLive: false,
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>
            Create
          </h1>
          <p style={{ fontSize: '18px', color: '#666' }}>
            Share your creativity with the world
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
        }}>
          {createOptions.map((option, index) => (
            <div
              key={index}
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '24px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                position: 'relative',
                opacity: option.isLive ? 1 : 0.7,
                boxShadow: hoveredCard === index ? '0 4px 16px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: hoveredCard === index ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(option.route)}
            >
              {!option.isLive && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '4px 8px',
                  background: '#fef3c7',
                  color: '#f59e0b',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Coming Soon
                </div>
              )}

              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#fff',
              }}>
                {option.icon}
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>
                {option.title}
              </h2>

              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                {option.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CreateHubPage;
