/**
 * Tests for App.jsx root component
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock all context providers
jest.mock('./contexts/AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({ user: null, isAuthenticated: false })
}));

jest.mock('./contexts/ToastContext.jsx', () => ({
  ToastProvider: ({ children }) => <div data-testid="toast-provider">{children}</div>
}));

jest.mock('./contexts/OnboardingContext.jsx', () => ({
  OnboardingProvider: ({ children }) => <div data-testid="onboarding-provider">{children}</div>
}));

jest.mock('./contexts/NavigationContext.jsx', () => ({
  NavigationProvider: ({ children }) => <div data-testid="navigation-provider">{children}</div>
}));

jest.mock('./contexts/ThemeContext.tsx', () => ({
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>
}));

// Mock Web3Provider
jest.mock('./Web3Provider', () => ({
  Web3Provider: ({ children }) => <div data-testid="web3-provider">{children}</div>
}));

// Mock core components
jest.mock('./components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="protected-route">{children}</div>
}));

jest.mock('./components/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>
}));

jest.mock('./components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>
}));

jest.mock('./components/MobileHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-header">Mobile Header</div>
}));

jest.mock('./components/Navigation/MobileBottomNav', () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-bottom-nav">Mobile Bottom Nav</div>
}));

jest.mock('./components/CookieConsent', () => ({
  __esModule: true,
  default: () => <div data-testid="cookie-consent">Cookie Consent</div>
}));

jest.mock('./components/TermsAcceptanceModal', () => ({
  __esModule: true,
  default: () => <div data-testid="terms-modal">Terms Modal</div>
}));

jest.mock('./components/PageLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="page-loader">Loading...</div>
}));

jest.mock('./components/onboarding/OnboardingOverlay', () => ({
  __esModule: true,
  default: () => <div data-testid="onboarding-overlay">Onboarding</div>
}));

// Mock analytics hook
jest.mock('./hooks/useAnalytics', () => ({
  usePageTracking: jest.fn()
}));

// Mock all lazy-loaded pages
jest.mock('./pages/LandingPage', () => ({
  __esModule: true,
  default: () => <div data-testid="landing-page">Landing Page</div>
}));

jest.mock('./pages/LoginPage', () => ({
  __esModule: true,
  default: () => <div data-testid="login-page">Login Page</div>
}));

jest.mock('./pages/RegisterPage', () => ({
  __esModule: true,
  default: () => <div data-testid="register-page">Register Page</div>
}));

jest.mock('./pages/HomePage', () => ({
  __esModule: true,
  default: () => <div data-testid="home-page">Home Page</div>
}));

jest.mock('./pages/NotFoundPage', () => ({
  __esModule: true,
  default: () => <div data-testid="not-found-page">404 Page</div>
}));

describe('App', () => {
  const renderApp = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    );
  };

  describe('Providers Hierarchy', () => {
    it('renders all context providers', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
        expect(screen.getByTestId('navigation-provider')).toBeInTheDocument();
        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
        expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
        expect(screen.getByTestId('onboarding-provider')).toBeInTheDocument();
        expect(screen.getByTestId('web3-provider')).toBeInTheDocument();
      });
    });

    it('wraps app with error boundary', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      });
    });
  });

  describe('Public Routes', () => {
    it('renders landing page at root', async () => {
      renderApp('/');

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });
    });

    it('renders login page', async () => {
      renderApp('/login');

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('renders register page', async () => {
      renderApp('/register');

      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
      });
    });

    it('handles /signup alias for register', async () => {
      renderApp('/signup');

      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
      });
    });
  });

  describe('Protected Routes', () => {
    it('wraps protected routes with ProtectedRoute', async () => {
      renderApp('/home');

      await waitFor(() => {
        expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      });
    });

    it('renders home page in protected route', async () => {
      renderApp('/home');

      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });
  });

  describe('AppLayout', () => {
    it('renders header for desktop', async () => {
      renderApp('/home');

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('renders mobile header', async () => {
      renderApp('/home');

      await waitFor(() => {
        expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
      });
    });

    it('renders mobile bottom navigation', async () => {
      renderApp('/home');

      await waitFor(() => {
        expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument();
      });
    });

    it('renders onboarding overlay', async () => {
      renderApp('/home');

      await waitFor(() => {
        expect(screen.getByTestId('onboarding-overlay')).toBeInTheDocument();
      });
    });

    it('applies correct styles for layout', async () => {
      renderApp('/home');

      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toHaveClass('pb-16');
        expect(main).toHaveClass('lg:pb-0');
      });
    });
  });

  describe('Global UI Components', () => {
    it('renders cookie consent', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('cookie-consent')).toBeInTheDocument();
      });
    });

    it('renders terms acceptance modal', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows page loader during suspense', async () => {
      renderApp('/');

      // Suspense should show PageLoader
      expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    });

    it('applies loading styles correctly', async () => {
      renderApp('/');

      const loader = screen.getByTestId('page-loader');
      expect(loader.parentElement).toHaveStyle({
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
    });
  });

  describe('404 Not Found', () => {
    it('renders not found page for invalid routes', async () => {
      renderApp('/invalid-route-that-does-not-exist');

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });
  });

  describe('Analytics', () => {
    it('wraps app with analytics tracking', async () => {
      const { usePageTracking } = require('./hooks/useAnalytics');
      renderApp('/');

      await waitFor(() => {
        expect(usePageTracking).toHaveBeenCalled();
      });
    });
  });

  describe('Route Groups', () => {
    it('defines public routes correctly', async () => {
      const publicRoutes = ['/', '/login', '/register', '/privacy', '/terms'];

      for (const route of publicRoutes) {
        const { unmount } = renderApp(route);
        await waitFor(() => {
          expect(screen.queryByTestId('protected-route')).not.toBeInTheDocument();
        });
        unmount();
      }
    });

    it('defines protected routes correctly', async () => {
      const protectedRoutes = ['/home', '/messages', '/settings'];

      for (const route of protectedRoutes) {
        const { unmount } = renderApp(route);
        await waitFor(() => {
          expect(screen.getByTestId('protected-route')).toBeInTheDocument();
        });
        unmount();
      }
    });
  });

  describe('Auth Hook Export', () => {
    it('exports useAuth hook', () => {
      const { useAuth } = require('./App');
      expect(useAuth).toBeDefined();
      expect(typeof useAuth).toBe('function');
    });
  });
});

export default renderApp
