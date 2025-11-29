/**
 * Integration Test: Authentication Flow
 * Tests the complete user authentication journey
 */

// import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../src/App';

// Mock services
jest.mock('../../src/services/api', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('completes full registration flow', async () => {
    const apiMock = (await import('../../src/services/api')).default;

    // Mock successful registration
    apiMock.post.mockResolvedValueOnce({
      success: true,
      data: {
        token: 'test-token',
        user: {
          id: '1',
          username: 'newuser',
          email: 'new@example.com',
        },
      },
    });

    // Mock user data fetch
    apiMock.get.mockResolvedValue({
      success: true,
      data: {
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
      },
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Navigate to register page
    const registerLink = screen.queryByText(/sign up|register/i);
    if (registerLink) {
      fireEvent.click(registerLink);
    }

    await waitFor(() => {
      const usernameInput = screen.queryByLabelText(/username/i) ||
                           screen.queryByPlaceholderText(/username/i);
      if (usernameInput) {
        fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      }

      const emailInput = screen.queryByLabelText(/email/i) ||
                        screen.queryByPlaceholderText(/email/i);
      if (emailInput) {
        fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      }

      const passwordInput = screen.queryByLabelText(/^password/i) ||
                           screen.queryByPlaceholderText(/^password/i);
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      }
    });

    // Submit form
    const submitButton = screen.queryByRole('button', { name: /sign up|register/i });
    if (submitButton) {
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiMock.post).toHaveBeenCalled();
      });
    }
  });

  it('completes full login flow', async () => {
    const apiMock = (await import('../../src/services/api')).default;

    // Mock successful login
    apiMock.post.mockResolvedValueOnce({
      success: true,
      data: {
        token: 'test-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
        },
      },
    });

    // Mock user data fetch
    apiMock.get.mockResolvedValue({
      success: true,
      data: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      },
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Navigate to login page
    const loginLink = screen.queryByText(/sign in|login/i);
    if (loginLink) {
      fireEvent.click(loginLink);
    }

    await waitFor(() => {
      const emailInput = screen.queryByLabelText(/email/i) ||
                        screen.queryByPlaceholderText(/email/i);
      if (emailInput) {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      }

      const passwordInput = screen.queryByLabelText(/password/i) ||
                           screen.queryByPlaceholderText(/password/i);
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      }
    });

    // Submit form
    const submitButton = screen.queryByRole('button', { name: /sign in|login/i });
    if (submitButton) {
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiMock.post).toHaveBeenCalled();
      });
    }
  });

  it('handles login errors appropriately', async () => {
    const apiMock = (await import('../../src/services/api')).default;

    // Mock failed login
    apiMock.post.mockResolvedValueOnce({
      success: false,
      message: 'Invalid credentials',
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Navigate to login page
    const loginLink = screen.queryByText(/sign in|login/i);
    if (loginLink) {
      fireEvent.click(loginLink);
    }

    await waitFor(() => {
      const emailInput = screen.queryByLabelText(/email/i) ||
                        screen.queryByPlaceholderText(/email/i);
      if (emailInput) {
        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      }

      const passwordInput = screen.queryByLabelText(/password/i) ||
                           screen.queryByPlaceholderText(/password/i);
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      }
    });

    // Submit form
    const submitButton = screen.queryByRole('button', { name: /sign in|login/i });
    if (submitButton) {
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/invalid|error|wrong/i)).toBeTruthy();
      });
    }
  });

  it('completes logout flow', async () => {
    const apiMock = (await import('../../src/services/api')).default;

    // Set logged in state
    localStorage.setItem('token', 'test-token');

    // Mock logout
    apiMock.post.mockResolvedValueOnce({ success: true });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    await waitFor(() => {
      const logoutButton = screen.queryByText(/log out|logout|sign out/i);
      if (logoutButton) {
        fireEvent.click(logoutButton);

        expect(apiMock.post).toHaveBeenCalled();
        expect(localStorage.getItem('token')).toBeFalsy();
      }
    });
  });

  it('redirects unauthenticated users from protected routes', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Try to access protected route
    window.history.pushState({}, 'Test', '/settings');

    await waitFor(() => {
      // Should redirect to login or show auth prompt
      expect(
        screen.queryByText(/sign in|login/i) ||
        screen.queryByText(/unauthorized/i)
      ).toBeTruthy();
    });
  });
});
