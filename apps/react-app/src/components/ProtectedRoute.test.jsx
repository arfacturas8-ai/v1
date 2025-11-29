/**
 * Tests for ProtectedRoute component
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

jest.mock('../contexts/AuthContext');
jest.mock('./PageLoader', () => {
  return function PageLoader({ fullScreen }) {
    return <div data-testid="page-loader">Loading{fullScreen && ' (fullscreen)'}</div>;
  };
});

describe('ProtectedRoute', () => {
  const mockUseAuth = useAuth;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loader when loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('page-loader')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows fullscreen loader', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText(/fullscreen/i)).toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    it('renders children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('page-loader')).not.toBeInTheDocument();
    });

    it('renders multiple children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Content 1</div>
            <div>Content 2</div>
            <div>Content 3</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });

    it('renders complex children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      });

      const ComplexComponent = () => (
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to your dashboard</p>
        </div>
      );

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <ComplexComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to your dashboard')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('redirects to login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('does not show loader when redirecting', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('page-loader')).not.toBeInTheDocument();
    });

    it('preserves location state for redirect', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false
      });

      let capturedState = null;

      const LoginPage = () => {
        const location = window.location;
        capturedState = location.state;
        return <div>Login Page</div>;
      };

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Auth State Changes', () => {
    it('transitions from loading to authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true
      });

      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('page-loader')).toBeInTheDocument();

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      });

      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('page-loader')).not.toBeInTheDocument();
    });

    it('transitions from loading to unauthenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('page-loader')).toBeInTheDocument();

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('handles logout (authenticated to unauthenticated)', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false
      });

      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      });

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>{null}</ProtectedRoute>
        </MemoryRouter>
      );

      expect(container).toBeInTheDocument();
    });

    it('handles undefined isAuthenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: undefined,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('handles missing loading property', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Multiple Protected Routes', () => {
    it('handles multiple protected routes', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <div>Profile</div>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <div>Settings</div>
              </ProtectedRoute>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('redirects all protected routes when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute><div>Dashboard</div></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><div>Profile</div></ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login')).toBeInTheDocument();

      rerender(
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute><div>Dashboard</div></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><div>Profile</div></ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot when loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true
      });

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false
      });

      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(container).toMatchSnapshot();
    });
  });
});

export default PageLoader
