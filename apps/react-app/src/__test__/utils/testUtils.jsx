import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';

/**
 * Custom render with all providers
 * Use this instead of plain render() for components that need context
 */
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    route = '/',
    ...renderOptions
  } = {}
) {
  if (typeof window !== 'undefined') {
    window.history.pushState({}, 'Test page', route);
  }

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    preloadedState
  };
}

/**
 * Mock data generators
 */
export const mockUser = (overrides = {}) => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  avatar: '/avatars/default.png',
  createdAt: new Date().toISOString(),
  ...overrides
});

export const mockCommunity = (overrides = {}) => ({
  id: 'community-1',
  name: 'Test Community',
  slug: 'test-community',
  description: 'A test community',
  memberCount: 100,
  createdAt: new Date().toISOString(),
  ...overrides
});

export const mockPost = (overrides = {}) => ({
  id: 'post-1',
  title: 'Test Post',
  content: 'Test content',
  author: mockUser(),
  communityId: 'community-1',
  upvotes: 10,
  downvotes: 2,
  commentCount: 5,
  createdAt: new Date().toISOString(),
  ...overrides
});

export const mockComment = (overrides = {}) => ({
  id: 'comment-1',
  content: 'Test comment',
  author: mockUser(),
  postId: 'post-1',
  upvotes: 3,
  downvotes: 0,
  createdAt: new Date().toISOString(),
  ...overrides
});

export const mockMessage = (overrides = {}) => ({
  id: 'message-1',
  content: 'Test message',
  author: mockUser(),
  channelId: 'channel-1',
  createdAt: new Date().toISOString(),
  ...overrides
});

/**
 * Wait utilities
 */
export const waitForLoadingToFinish = async (screen) => {
  const { findByRole, queryByRole } = screen;
  try {
    await findByRole('progressbar', {}, { timeout: 100 });
    await waitForElementToBeRemoved(() => queryByRole('progressbar'));
  } catch {
    // No loading state found, continue
  }
};

/**
 * Simulate delay for async operations
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); }
  };
};

/**
 * Mock fetch
 */
export const mockFetch = (data, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    })
  );
};

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
};

export default renderWithProviders
