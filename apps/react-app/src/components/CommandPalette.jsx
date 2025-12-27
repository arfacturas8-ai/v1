/**
 * Command Palette - Cmd+K Quick Search
 * Navigate anywhere in the app quickly
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Hash,
  User,
  Settings,
  LogOut,
  Home,
  MessageCircle,
  Bell,
  Compass,
  TrendingUp,
  Wallet,
  Shield,
  Users,
  FileText,
  HelpCircle,
  X,
  Command
} from 'lucide-react';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Command definitions
  const commands = [
    // Navigation
    { id: 'home', label: 'Home Feed', icon: Home, action: () => navigate('/home'), keywords: 'home feed dashboard' },
    { id: 'explore', label: 'Explore Communities', icon: Compass, action: () => navigate('/communities'), keywords: 'explore discover communities' },
    { id: 'messages', label: 'Direct Messages', icon: MessageCircle, action: () => navigate('/direct-messages'), keywords: 'messages dm chat' },
    { id: 'notifications', label: 'Notifications', icon: Bell, action: () => navigate('/notifications'), keywords: 'notifications alerts' },
    { id: 'profile', label: 'My Profile', icon: User, action: () => navigate('/profile'), keywords: 'profile me account' },
    { id: 'search', label: 'Search', icon: Search, action: () => navigate('/search'), keywords: 'search find' },

    // Web3
    { id: 'nft', label: 'NFT Marketplace', icon: TrendingUp, action: () => navigate('/nft-marketplace'), keywords: 'nft marketplace opensea' },
    { id: 'governance', label: 'DAO Governance', icon: Shield, action: () => navigate('/governance'), keywords: 'dao governance vote' },

    // Settings
    { id: 'settings', label: 'Settings', icon: Settings, action: () => navigate('/settings'), keywords: 'settings preferences config' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, action: () => navigate('/help'), keywords: 'help support faq' },

    // Admin (show conditionally)
    { id: 'admin', label: 'Admin Dashboard', icon: Shield, action: () => navigate('/admin'), keywords: 'admin moderation dashboard', adminOnly: true },
    { id: 'users', label: 'User Management', icon: Users, action: () => navigate('/users'), keywords: 'users manage admin', adminOnly: true },

    // Actions
    { id: 'create-post', label: 'Create Post', icon: FileText, action: () => navigate('/create-post'), keywords: 'create post new write' },
    { id: 'create-community', label: 'Create Community', icon: Hash, action: () => navigate('/create-community'), keywords: 'create community new' },
    { id: 'logout', label: 'Log Out', icon: LogOut, action: () => { localStorage.clear(); navigate('/'); }, keywords: 'logout signout exit' },
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(cmd => {
    const searchText = `${cmd.label} ${cmd.keywords}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev === 0 ? filteredCommands.length - 1 : prev - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const executeCommand = (command) => {
    command.action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'var(--bg-tertiary)',
              backdropFilter: 'blur(4px)',
              zIndex: 50
            }}
          />

          {/* Command Palette */}
          <div style={{
            position: 'fixed',
            top: '100px',
            left: 0,
            right: 0,
            zIndex: 51,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}>
            <div
              style={{
                width: '100%',
                maxWidth: '640px',
                background: 'rgba(22, 27, 34, 0.6)',
                backdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Search Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <Search style={{
                  width: '20px',
                  height: '20px',
                  color: '#666666'
                }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, pages, users..."
                  style={{
                    flex: '1',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    color: '#ffffff'
                  }}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#666666'
                }}>
                  <kbd style={{
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    background: 'rgba(22, 27, 34, 0.6)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Command style={{
                      width: '12px',
                      height: '12px'
                    }} /> K
                  </kbd>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X style={{
                    width: '20px',
                    height: '20px',
                    color: '#666666'
                  }} />
                </button>
              </div>

              {/* Results */}
              <div style={{
                maxHeight: '384px',
                overflowY: 'auto'
              }}>
                {filteredCommands.length === 0 ? (
                  <div style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '32px',
                    paddingBottom: '32px',
                    textAlign: 'center',
                    color: '#666666',
                    fontSize: '14px'
                  }}>
                    No commands found for "{query}"
                  </div>
                ) : (
                  <div style={{
                    paddingTop: '8px',
                    paddingBottom: '8px'
                  }}>
                    {filteredCommands.map((command, index) => {
                      const Icon = command.icon;
                      const isSelected = index === selectedIndex;

                      return (
                        <button
                          key={command.id}
                          onClick={() => executeCommand(command)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            paddingLeft: '16px',
                            paddingRight: '16px',
                            paddingTop: '12px',
                            paddingBottom: '12px',
                            background: isSelected ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            color: isSelected ? '#ffffff' : '#666666'
                          }}
                        >
                          <Icon style={{
                            width: '20px',
                            height: '20px',
                            color: isSelected ? '#58a6ff' : '#666666'
                          }} />
                          <span style={{
                            flex: '1',
                            textAlign: 'left',
                            fontSize: '14px'
                          }}>{command.label}</span>
                          {isSelected && (
                            <kbd style={{
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '4px',
                              paddingBottom: '4px',
                              background: 'rgba(22, 27, 34, 0.6)',
                              borderRadius: '4px',
                              fontSize: '11px',
                              border: '1px solid var(--border-subtle)',
                              color: '#666666'
                            }}>
                              Enter
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '12px',
                paddingBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '12px',
                color: '#666666'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <kbd style={{
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      background: 'rgba(22, 27, 34, 0.6)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: '1px solid var(--border-subtle)'
                    }}>↑</kbd>
                    <kbd style={{
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      background: 'rgba(22, 27, 34, 0.6)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: '1px solid var(--border-subtle)'
                    }}>↓</kbd>
                    <span style={{ marginLeft: '4px' }}>Navigate</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <kbd style={{
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      background: 'rgba(22, 27, 34, 0.6)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: '1px solid var(--border-subtle)'
                    }}>Enter</kbd>
                    <span style={{ marginLeft: '4px' }}>Select</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <kbd style={{
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      background: 'rgba(22, 27, 34, 0.6)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: '1px solid var(--border-subtle)'
                    }}>Esc</kbd>
                    <span style={{ marginLeft: '4px' }}>Close</span>
                  </div>
                </div>
                <div style={{
                  color: '#666666'
                }}>
                  {filteredCommands.length} {filteredCommands.length === 1 ? 'result' : 'results'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};



export default CommandPalette;
