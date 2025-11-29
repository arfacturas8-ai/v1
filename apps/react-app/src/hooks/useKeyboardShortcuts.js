/**
 * Global keyboard shortcuts handler
 */

import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = ({ onShowHelp }) => {
  const navigate = useNavigate();
  const [sequenceKeys, setSequenceKeys] = useState([]);

  useEffect(() => {
    let sequenceTimeout;

    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input
      const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) ||
                        e.target.isContentEditable;

      // Show help with '?'
      if (e.key === '?' && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onShowHelp?.();
        return;
      }

      // Ignore other shortcuts if typing
      if (isTyping) return;

      // Handle sequence shortcuts (G + X)
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setSequenceKeys(['g']);

        clearTimeout(sequenceTimeout);
        sequenceTimeout = setTimeout(() => {
          setSequenceKeys([]);
        }, 1000);
        return;
      }

      // Handle second key in sequence
      if (sequenceKeys.includes('g')) {
        e.preventDefault();
        clearTimeout(sequenceTimeout);
        setSequenceKeys([]);

        switch (e.key.toLowerCase()) {
          case 'h':
            navigate('/home');
            break;
          case 'e':
            navigate('/communities');
            break;
          case 'm':
            navigate('/direct-messages');
            break;
          case 'n':
            navigate('/notifications');
            break;
          case 'p':
            navigate('/profile');
            break;
          case 's':
            navigate('/settings');
            break;
          case 'w':
            navigate('/crypto');
            break;
          case 't':
            navigate('/token-economics');
            break;
          case 'd':
            navigate('/governance');
            break;
        }
        return;
      }

      // Single key shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            if (!isTyping) {
              e.preventDefault();
              navigate('/create-post');
            }
            break;
          case 'n':
            if (!isTyping) {
              e.preventDefault();
              navigate('/direct-messages/new');
            }
            break;
          case '/':
            if (!isTyping) {
              e.preventDefault();
              const searchInput = document.querySelector('[data-search-input]');
              searchInput?.focus();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(sequenceTimeout);
    };
  }, [navigate, sequenceKeys, onShowHelp]);

  return { sequenceKeys };
};
