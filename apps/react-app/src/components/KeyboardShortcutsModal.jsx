/**
 * Keyboard Shortcuts Help Modal
 * Press '?' to view all shortcuts
 */

import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  const { isMobile, isTablet } = useResponsive();
  const shortcuts = [
    {
      category: 'General',
      items: [
        { keys: ['⌘', 'K'], description: 'Open command palette' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['ESC'], description: 'Close dialog/modal' },
        { keys: ['⌘', 'Enter'], description: 'Submit form' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['G', 'H'], description: 'Go to home feed' },
        { keys: ['G', 'E'], description: 'Go to explore' },
        { keys: ['G', 'M'], description: 'Go to messages' },
        { keys: ['G', 'N'], description: 'Go to notifications' },
        { keys: ['G', 'P'], description: 'Go to profile' },
        { keys: ['G', 'S'], description: 'Go to settings' },
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['C'], description: 'Create new post' },
        { keys: ['N'], description: 'New message' },
        { keys: ['/'], description: 'Focus search' },
        { keys: ['R'], description: 'Reply to post' },
        { keys: ['L'], description: 'Like/upvote' },
        { keys: ['S'], description: 'Save post' },
      ]
    },
    {
      category: 'Posts & Comments',
      items: [
        { keys: ['J'], description: 'Next post' },
        { keys: ['K'], description: 'Previous post' },
        { keys: ['Enter'], description: 'Open post' },
        { keys: ['X'], description: 'Expand post' },
        { keys: ['↑', '↓'], description: 'Navigate items' },
      ]
    },
    {
      category: 'Text Editing',
      items: [
        { keys: ['⌘', 'B'], description: 'Bold text' },
        { keys: ['⌘', 'I'], description: 'Italic text' },
        { keys: ['⌘', 'U'], description: 'Underline text' },
        { keys: ['⌘', 'K'], description: 'Insert link (in editor)' },
        { keys: ['⌘', 'Z'], description: 'Undo' },
        { keys: ['⌘', '⇧', 'Z'], description: 'Redo' },
      ]
    },
    {
      category: 'Web3',
      items: [
        { keys: ['G', 'W'], description: 'Go to wallet' },
        { keys: ['G', 'T'], description: 'Go to token economics' },
        { keys: ['G', 'D'], description: 'Go to DAO governance' },
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{background: "var(--bg-primary)"}} className="fixed inset-0 /40 backdrop-blur-sm z-[9998]"
      />

      {/* Modal Wrapper */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
        <div className="w-full max-w-2xl sm:max-w-3xl max-h-[90vh] bg-white  rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div style={{ width: "48px", height: "48px", flexShrink: 0 }}>
                <Keyboard style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] m-0">Keyboard Shortcuts</h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] m-0">Navigate Cryb.ai like a pro</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px] hover:bg-white/50 transition-colors"
            >
              <X style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              {shortcuts.map((category) => (
                <div key={category.category}>
                  <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
                    {category.category}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {category.items.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-3 sm:p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)]"
                      >
                        <span className="text-xs sm:text-sm text-[var(--text-primary)] flex-1">{shortcut.description}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {shortcut.keys.map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              <kbd className="px-2 py-1 bg-white text-[var(--text-secondary)] rounded border border-[var(--border-subtle)] text-xs font-mono inline-flex items-center justify-center min-w-[28px]">
                                {key === '⌘' ? <Command style={{ width: "24px", height: "24px", flexShrink: 0 }} /> : key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-[var(--text-secondary)] text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                <span>💡 Tip: Press</span>
                <kbd className="px-2 py-1 bg-white text-[var(--text-secondary)] rounded border border-[var(--border-subtle)] text-xs font-mono">?</kbd>
                <span>anytime to view shortcuts</span>
              </div>
              <button
                onClick={onClose}
                style={{color: "var(--text-primary)"}} className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] border-none rounded-lg  text-sm font-medium cursor-pointer hover:opacity-90 transition-all min-h-[44px]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default KeyboardShortcutsModal;
