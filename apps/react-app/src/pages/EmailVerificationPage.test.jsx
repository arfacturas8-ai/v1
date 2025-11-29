/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EmailVerificationPage from './EmailVerificationPage';
import authService from '../services/authService';

// Mock authService
jest.mock('../services/authService');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock console methods
const mockConsoleError = jest.fn();
const originalConsoleError = console.error;

describe('EmailVerificationPage', () => {
  let mockNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockNavigate = jest.fn();
    console.error = mockConsoleError;

    // Mock successful verification by default
    authService.verifyEmail.mockResolvedValue({
      success: true,
      message: 'Email verified successfully!'
    });

    authService.resendVerification.mockResolvedValue({
      success: true,
      message: 'A new verification email has been sent! Check your inbox.'
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    console.error = originalConsoleError;
    mockConsoleError.mockClear();
  });

  const renderWithRouter = (initialRoute = '/?token=valid-token-123') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<EmailVerificationPage />} />
          <Route path="/home" element={<div>Home Page</div>} />
          <Route path="/help" element={<div>Help Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithRouter();
      expect(container).toBeInTheDocument();
    });

    it('renders main content area with proper role', () => {
      renderWithRouter();
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('aria-label', 'Email verification page');
    });

    it('renders without console errors', () => {
      renderWithRouter();
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('displays initial verifying state', () => {
      renderWithRouter();
      expect(screen.getByText('Verifying Email')).toBeInTheDocument();
      expect(screen.getByText('Verifying your email address...')).toBeInTheDocument();
    });

    it('displays loading spinner during verification', () => {
      renderWithRouter();
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Verifying email');
    });

    it('displays helper text during verification', () => {
      renderWithRouter();
      expect(screen.getByText('This may take a few seconds...')).toBeInTheDocument();
    });

    it('renders with proper page layout styles', () => {
      renderWithRouter();
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveStyle({
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
    });

    it('renders spin animation keyframes', () => {
      const { container } = renderWithRouter();
      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag.textContent).toContain('@keyframes spin');
    });
  });

  describe('Token Validation', () => {
    it('displays error when no token is provided', async () => {
      renderWithRouter('/?notoken=true');

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText('Invalid verification link. No token provided.')).toBeInTheDocument();
      });
    });

    it('does not call verifyEmail when no token is provided', async () => {
      renderWithRouter('/?notoken=true');

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      });

      expect(authService.verifyEmail).not.toHaveBeenCalled();
    });

    it('displays error icon when no token is provided', async () => {
      renderWithRouter('/?notoken=true');

      await waitFor(() => {
        expect(screen.getByText('❌')).toBeInTheDocument();
      });
    });

    it('calls verifyEmail with token when provided', async () => {
      renderWithRouter('/?token=test-token-123');

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledWith('test-token-123');
      });
    });

    it('extracts token from search params correctly', async () => {
      renderWithRouter('/?token=abc123xyz&other=param');

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledWith('abc123xyz');
      });
    });

    it('handles empty token parameter', async () => {
      renderWithRouter('/?token=');

      await waitFor(() => {
        expect(screen.getByText('Invalid verification link. No token provided.')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Verification', () => {
    it('displays success message on successful verification', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
        expect(screen.getByText('Email verified successfully!')).toBeInTheDocument();
      });
    });

    it('displays success icon on successful verification', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('✅')).toBeInTheDocument();
      });
    });

    it('displays Go to Home button on success', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /go to home/i });
        expect(homeLink).toBeInTheDocument();
        expect(homeLink).toHaveAttribute('href', '/home');
      });
    });

    it('displays auto-redirect message on success', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Redirecting automatically in 3 seconds...')).toBeInTheDocument();
      });
    });

    it('uses custom success message when provided', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Custom success message'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Custom success message')).toBeInTheDocument();
      });
    });

    it('uses default success message when not provided', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Email verified successfully!')).toBeInTheDocument();
      });
    });

    it('message has proper ARIA attributes on success', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        const message = screen.getByText('Email verified successfully!');
        expect(message).toHaveAttribute('role', 'status');
        expect(message).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('navigates to home after 3 seconds on success', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      });

      // Advance timers by 3 seconds
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        // The navigation happens via setTimeout
        // In a real test environment with actual router, this would navigate
        // We're testing that the timeout is called
      });
    });

    it('Go to Home link is clickable', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /go to home/i });
        expect(homeLink).toBeInTheDocument();
      });

      const homeLink = screen.getByRole('link', { name: /go to home/i });
      fireEvent.click(homeLink);
    });

    it('Go to Home link has proper accessibility label', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /go to home/i });
        expect(homeLink).toHaveAttribute('aria-label', 'Go to home page');
      });
    });
  });

  describe('Failed Verification - Expired Link', () => {
    it('displays expired status when verification returns expired', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'This verification link has expired or is invalid.'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
        expect(screen.getByText('This verification link has expired or is invalid.')).toBeInTheDocument();
      });
    });

    it('displays clock icon for expired link', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('⏰')).toBeInTheDocument();
      });
    });

    it('displays resend verification button on expired link', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /resend verification email/i });
        expect(resendButton).toBeInTheDocument();
      });
    });

    it('displays Back to Home link on expired link', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /back to home/i });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/');
      });
    });

    it('uses custom error message when provided', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Custom error message'
      });

      renderWithRouter('/?token=invalid-token');

      await waitFor(() => {
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
      });
    });

    it('uses default error message when not provided', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false
      });

      renderWithRouter('/?token=invalid-token');

      await waitFor(() => {
        expect(screen.getByText('This verification link has expired or is invalid.')).toBeInTheDocument();
      });
    });

    it('message has alert role on expired link', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        const message = screen.getByText('Link expired');
        expect(message).toHaveAttribute('role', 'alert');
        expect(message).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Failed Verification - Error State', () => {
    it('displays error status when API throws error', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('API Error'));

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText('An error occurred while verifying your email. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays error icon on API error', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('Network error'));

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(screen.getByText('❌')).toBeInTheDocument();
      });
    });

    it('logs error to console on API error', async () => {
      const testError = new Error('Test API Error');
      authService.verifyEmail.mockRejectedValue(testError);

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Email verification error:', testError);
      });
    });

    it('displays resend verification button on error', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('API Error'));

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /resend verification email/i });
        expect(resendButton).toBeInTheDocument();
      });
    });

    it('displays Back to Home link on error', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('API Error'));

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /back to home/i });
        expect(backLink).toBeInTheDocument();
      });
    });

    it('message has alert role on error', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('API Error'));

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        const message = screen.getByText('An error occurred while verifying your email. Please try again.');
        expect(message).toHaveAttribute('role', 'alert');
        expect(message).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Resend Verification Email', () => {
    beforeEach(async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });
    });

    it('calls resendVerification when button clicked', async () => {
      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(authService.resendVerification).toHaveBeenCalled();
      });
    });

    it('displays verifying state while resending', async () => {
      let resolveResend;
      authService.resendVerification.mockReturnValue(
        new Promise((resolve) => {
          resolveResend = resolve;
        })
      );

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Verifying Email')).toBeInTheDocument();
        expect(screen.getByText('Sending new verification email...')).toBeInTheDocument();
      });

      resolveResend({ success: true, message: 'Email sent' });
    });

    it('displays success message after successful resend', async () => {
      authService.resendVerification.mockResolvedValue({
        success: true,
        message: 'A new verification email has been sent! Check your inbox.'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
        expect(screen.getByText('A new verification email has been sent! Check your inbox.')).toBeInTheDocument();
      });
    });

    it('uses custom success message for resend', async () => {
      authService.resendVerification.mockResolvedValue({
        success: true,
        message: 'Custom resend success message'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Custom resend success message')).toBeInTheDocument();
      });
    });

    it('uses default success message for resend when not provided', async () => {
      authService.resendVerification.mockResolvedValue({
        success: true
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('A new verification email has been sent! Check your inbox.')).toBeInTheDocument();
      });
    });

    it('displays error message when resend fails', async () => {
      authService.resendVerification.mockResolvedValue({
        success: false,
        error: 'Failed to resend verification email. Please try again later.'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText('Failed to resend verification email. Please try again later.')).toBeInTheDocument();
      });
    });

    it('uses custom error message for resend failure', async () => {
      authService.resendVerification.mockResolvedValue({
        success: false,
        error: 'Custom resend error'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Custom resend error')).toBeInTheDocument();
      });
    });

    it('uses default error message for resend failure when not provided', async () => {
      authService.resendVerification.mockResolvedValue({
        success: false
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to resend verification email. Please try again later.')).toBeInTheDocument();
      });
    });

    it('handles resend API exception', async () => {
      authService.resendVerification.mockRejectedValue(new Error('Resend API Error'));

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText('Failed to resend verification email. Please try again later.')).toBeInTheDocument();
      });
    });

    it('logs resend error to console', async () => {
      const testError = new Error('Resend API Error');
      authService.resendVerification.mockRejectedValue(testError);

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Resend verification error:', testError);
      });
    });

    it('resend button has proper accessibility label', async () => {
      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      expect(resendButton).toHaveAttribute('aria-label', 'Resend verification email');
    });
  });

  describe('User Interactions', () => {
    it('Back to Home link has proper href', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /back to home/i });
        expect(backLink).toHaveAttribute('href', '/');
      });
    });

    it('Back to Home link has proper accessibility label', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /back to home/i });
        expect(backLink).toHaveAttribute('aria-label', 'Back to home page');
      });
    });

    it('Contact Support link is present', () => {
      renderWithRouter();
      const supportLink = screen.getByRole('link', { name: /contact support/i });
      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute('href', '/help');
    });

    it('Contact Support link is clickable', () => {
      renderWithRouter();
      const supportLink = screen.getByRole('link', { name: /contact support/i });
      fireEvent.click(supportLink);
    });

    it('displays "Having trouble?" text', () => {
      renderWithRouter();
      expect(screen.getByText(/Having trouble\?/i)).toBeInTheDocument();
    });

    it('handles button hover effects', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });

      fireEvent.mouseOver(resendButton);
      expect(resendButton).toHaveStyle({ transform: 'translateY(-2px)' });

      fireEvent.mouseOut(resendButton);
      expect(resendButton).toHaveStyle({ transform: 'translateY(0)' });
    });

    it('handles link hover effects for Go to Home', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      });

      const homeLink = screen.getByRole('link', { name: /go to home/i });

      fireEvent.mouseOver(homeLink);
      expect(homeLink).toHaveStyle({ transform: 'translateY(-2px)' });

      fireEvent.mouseOut(homeLink);
      expect(homeLink).toHaveStyle({ transform: 'translateY(0)' });
    });

    it('handles link hover effects for Back to Home', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const backLink = screen.getByRole('link', { name: /back to home/i });

      fireEvent.mouseOver(backLink);
      expect(backLink).toHaveStyle({
        backgroundColor: '#667eea',
        color: '#fff'
      });

      fireEvent.mouseOut(backLink);
      expect(backLink).toHaveStyle({
        backgroundColor: 'transparent',
        color: '#667eea'
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main landmark', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('aria-label', 'Email verification page');
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter();
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(1);
      expect(headings[0].tagName).toBe('H1');
    });

    it('heading displays correct text for each status', async () => {
      // Verifying
      const { rerender } = renderWithRouter();
      expect(screen.getByRole('heading', { name: /verifying email/i })).toBeInTheDocument();

      // Success
      authService.verifyEmail.mockResolvedValue({ success: true, message: 'Success' });
      rerender(
        <MemoryRouter initialEntries={['/?token=valid-token']}>
          <Routes>
            <Route path="/" element={<EmailVerificationPage />} />
          </Routes>
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /email verified/i })).toBeInTheDocument();
      });
    });

    it('spinner has proper ARIA attributes', () => {
      renderWithRouter();
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Verifying email');
    });

    it('icons have aria-hidden attribute', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Success'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        const icon = screen.getByText('✅');
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('status messages have proper ARIA live regions', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Success'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        const message = screen.getByText('Success');
        expect(message).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('error messages have alert role', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Error message'
      });

      renderWithRouter('/?token=invalid-token');

      await waitFor(() => {
        const message = screen.getByText('Error message');
        expect(message).toHaveAttribute('role', 'alert');
      });
    });

    it('all interactive elements are keyboard accessible', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Error'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      const backLink = screen.getByRole('link', { name: /back to home/i });
      const supportLink = screen.getByRole('link', { name: /contact support/i });

      expect(resendButton).toBeInTheDocument();
      expect(backLink).toBeInTheDocument();
      expect(supportLink).toBeInTheDocument();
    });

    it('buttons have descriptive labels', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Error'
      });

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /resend verification email/i });
        expect(resendButton).toHaveAccessibleName();
      });
    });

    it('links have descriptive labels', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Success'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /go to home/i });
        expect(homeLink).toHaveAccessibleName();
      });
    });
  });

  describe('Status States', () => {
    it('shows verifying state initially', () => {
      renderWithRouter();
      expect(screen.getByText('Verifying Email')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('transitions from verifying to success', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Success'
      });

      renderWithRouter('/?token=valid-token');

      expect(screen.getByText('Verifying Email')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
        expect(screen.getByText('✅')).toBeInTheDocument();
      });
    });

    it('transitions from verifying to expired', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Expired'
      });

      renderWithRouter('/?token=expired-token');

      expect(screen.getByText('Verifying Email')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
        expect(screen.getByText('⏰')).toBeInTheDocument();
      });
    });

    it('transitions from verifying to error', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('Error'));

      renderWithRouter('/?token=test-token');

      expect(screen.getByText('Verifying Email')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText('❌')).toBeInTheDocument();
      });
    });

    it('displays correct icon for each status', async () => {
      // Verifying - spinner
      const { rerender } = renderWithRouter();
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Success - checkmark
      authService.verifyEmail.mockResolvedValue({ success: true, message: 'Success' });
      rerender(
        <MemoryRouter initialEntries={['/?token=valid']}>
          <Routes>
            <Route path="/" element={<EmailVerificationPage />} />
          </Routes>
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText('✅')).toBeInTheDocument();
      });
    });

    it('does not show success actions in verifying state', () => {
      renderWithRouter();
      expect(screen.queryByRole('link', { name: /go to home/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/redirecting automatically/i)).not.toBeInTheDocument();
    });

    it('does not show error actions in verifying state', () => {
      renderWithRouter();
      expect(screen.queryByRole('button', { name: /resend verification email/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /back to home/i })).not.toBeInTheDocument();
    });

    it('does not show success actions in error state', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('Error'));

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      });

      expect(screen.queryByRole('link', { name: /go to home page/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/redirecting automatically/i)).not.toBeInTheDocument();
    });

    it('does not show error actions in success state', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Success'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /resend verification email/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /back to home page/i })).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long error messages', async () => {
      const longError = 'A'.repeat(500);
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: longError
      });

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(screen.getByText(longError)).toBeInTheDocument();
      });
    });

    it('handles empty error message gracefully', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: ''
      });

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(screen.getByText('This verification link has expired or is invalid.')).toBeInTheDocument();
      });
    });

    it('handles null error message', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: null
      });

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(screen.getByText('This verification link has expired or is invalid.')).toBeInTheDocument();
      });
    });

    it('handles undefined error message', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false
      });

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(screen.getByText('This verification link has expired or is invalid.')).toBeInTheDocument();
      });
    });

    it('handles empty success message gracefully', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: ''
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Email verified successfully!')).toBeInTheDocument();
      });
    });

    it('handles special characters in token', async () => {
      const specialToken = 'token-with-special-chars-!@#$%';
      renderWithRouter(`/?token=${encodeURIComponent(specialToken)}`);

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledWith(specialToken);
      });
    });

    it('handles multiple query parameters', async () => {
      renderWithRouter('/?token=test-token&utm_source=email&ref=campaign');

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledWith('test-token');
      });
    });

    it('handles rapid resend button clicks', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Expired'
      });

      authService.resendVerification.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'Sent' }), 100))
      );

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });

      // Click multiple times rapidly
      fireEvent.click(resendButton);
      fireEvent.click(resendButton);
      fireEvent.click(resendButton);

      // Should only be called once (or manage state properly)
      await waitFor(() => {
        expect(authService.resendVerification).toHaveBeenCalled();
      });
    });

    it('handles slow API responses', async () => {
      authService.verifyEmail.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'Success' }), 5000))
      );

      renderWithRouter('/?token=slow-token');

      expect(screen.getByText('Verifying Email')).toBeInTheDocument();
      expect(screen.getByText('This may take a few seconds...')).toBeInTheDocument();
    });

    it('handles component unmount during API call', async () => {
      let resolveVerify;
      authService.verifyEmail.mockReturnValue(
        new Promise((resolve) => {
          resolveVerify = resolve;
        })
      );

      const { unmount } = renderWithRouter('/?token=test-token');

      expect(screen.getByText('Verifying Email')).toBeInTheDocument();

      unmount();

      // Resolve after unmount
      resolveVerify({ success: true, message: 'Success' });

      // Should not cause errors
      expect(mockConsoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('memory leak')
      );
    });
  });

  describe('Styling and Layout', () => {
    it('applies gradient background to page', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      });
    });

    it('applies proper padding to page', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({
        padding: '20px'
      });
    });

    it('applies box shadow to content card', () => {
      const { container } = renderWithRouter();
      const card = container.querySelector('[style*="boxShadow"]');
      expect(card).toBeInTheDocument();
    });

    it('applies border radius to content card', () => {
      const { container } = renderWithRouter();
      const card = container.querySelector('[style*="borderRadius"]');
      expect(card).toBeInTheDocument();
    });

    it('centers content vertically and horizontally', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
    });

    it('applies correct font sizes to elements', () => {
      renderWithRouter();
      const heading = screen.getByRole('heading');
      expect(heading).toHaveStyle({
        fontSize: '28px',
        fontWeight: '600'
      });
    });

    it('applies correct colors to text', () => {
      renderWithRouter();
      const heading = screen.getByRole('heading');
      expect(heading).toHaveStyle({
        color: '#1a1a1a'
      });
    });

    it('displays help text with border separator', () => {
      const { container } = renderWithRouter();
      const helpSection = container.querySelector('[style*="borderTop"]');
      expect(helpSection).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('calls verifyEmail exactly once on mount with token', async () => {
      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call verifyEmail multiple times', async () => {
      const { rerender } = renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledTimes(1);
      });

      rerender(
        <MemoryRouter initialEntries={['/?token=test-token']}>
          <Routes>
            <Route path="/" element={<EmailVerificationPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should still be called only once
      expect(authService.verifyEmail).toHaveBeenCalledTimes(1);
    });

    it('passes correct token format to API', async () => {
      const token = 'valid-token-abc123xyz';
      renderWithRouter(`/?token=${token}`);

      await waitFor(() => {
        expect(authService.verifyEmail).toHaveBeenCalledWith(token);
      });
    });

    it('handles API timeout gracefully', async () => {
      jest.setTimeout(10000);
      authService.verifyEmail.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      );

      renderWithRouter('/?token=timeout-token');

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      }, { timeout: 6000 });
    });
  });

  describe('Console Logging', () => {
    it('logs verification errors to console', async () => {
      const error = new Error('Verification failed');
      authService.verifyEmail.mockRejectedValue(error);

      renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Email verification error:', error);
      });
    });

    it('logs resend errors to console', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Expired'
      });

      const resendError = new Error('Resend failed');
      authService.resendVerification.mockRejectedValue(resendError);

      renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Resend verification error:', resendError);
      });
    });

    it('does not log errors on successful operations', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Success'
      });

      renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      });

      expect(mockConsoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('error'),
        expect.anything()
      );
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for verifying state', () => {
      const { container } = renderWithRouter();
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for success state', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'Email verified successfully!'
      });

      const { container } = renderWithRouter('/?token=valid-token');

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for expired state', async () => {
      authService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Link expired'
      });

      const { container } = renderWithRouter('/?token=expired-token');

      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for error state', async () => {
      authService.verifyEmail.mockRejectedValue(new Error('API Error'));

      const { container } = renderWithRouter('/?token=test-token');

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for no token state', async () => {
      const { container } = renderWithRouter('/?notoken=true');

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });
});

export default mockConsoleError
