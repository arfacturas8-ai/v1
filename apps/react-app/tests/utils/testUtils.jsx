/**
 * Comprehensive Test Utilities
 * Provides reusable test helpers for consistent testing across the app
 */

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthContext from '../../src/contexts/AuthContext';

/**
 * Mock user data
 */
export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  avatar: null,
  bio: 'Test bio',
  role: 'user',
  isVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  walletAddress: '0x1234567890123456789012345678901234567890',
};

/**
 * Mock authenticated context
 */
export const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loading: false,
  error: null,
  updateUser: jest.fn(),
};

/**
 * Mock unauthenticated context
 */
export const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loading: false,
  error: null,
  updateUser: jest.fn(),
};

/**
 * Render component with Router and Auth context
 */
export const renderWithRouter = (
  component,
  { authValue = mockAuthContext, route = '/' } = {}
) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

/**
 * Render component with only Router
 */
export const renderWithRouterOnly = (component, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

/**
 * Render component with Auth context only
 */
export const renderWithAuth = (component, authValue = mockAuthContext) => {
  return render(
    <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
  );
};

/**
 * Wait for async operations with timeout
 */
export const waitForAsync = (timeout = 100) => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

/**
 * Mock framer-motion for tests
 */
export const mockFramerMotion = {
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
  }),
  useInView: () => true,
};

/**
 * Mock socket.io-client
 */
export const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
};

/**
 * Create mock API response
 */
export const createMockApiResponse = (data, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
});

/**
 * Create mock error response
 */
export const createMockErrorResponse = (message = 'An error occurred') => ({
  success: false,
  message,
  error: message,
});

/**
 * Setup all common mocks
 */
export const setupCommonMocks = () => {
  // Mock console methods to reduce noise
  global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
  };

  // Mock window.scrollTo
  window.scrollTo = jest.fn();

  // Mock navigator.clipboard
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(),
      readText: jest.fn(),
    },
  });

  // Mock window.navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
};

/**
 * Cleanup mocks after tests
 */
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
};
