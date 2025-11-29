/**
 * Tests for CookieConsent component
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CookieConsent from './CookieConsent';

describe('CookieConsent', () => {
  let localStorageMock;

  beforeEach(() => {
    jest.useFakeTimers();

    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing initially', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const { container } = render(<CookieConsent />);

      expect(container.firstChild).toBeNull();
    });

    it('shows banner after 1 second when no consent given', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<CookieConsent />);

      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });

    it('does not show when cookies already accepted', () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
    });

    it('does not show when cookies declined', () => {
      localStorageMock.getItem.mockReturnValue('declined');
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
    });
  });

  describe('Banner Content', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('renders cookie emoji', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('🍪')).toBeInTheDocument();
    });

    it('renders title', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/We use cookies to enhance your experience/)).toBeInTheDocument();
    });

    it('renders Privacy Policy link', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy');
    });

    it('renders Terms of Service link', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const termsLink = screen.getByText('Terms of Service');
      expect(termsLink).toBeInTheDocument();
      expect(termsLink.closest('a')).toHaveAttribute('href', '/terms');
    });

    it('renders Accept button', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('Accept All Cookies')).toBeInTheDocument();
    });

    it('renders Decline button', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('Decline')).toBeInTheDocument();
    });
  });

  describe('Accept Functionality', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('saves acceptance to localStorage', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const acceptButton = screen.getByText('Accept All Cookies');
      fireEvent.click(acceptButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-cookies-accepted', 'true');
    });

    it('hides banner after accepting', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const acceptButton = screen.getByText('Accept All Cookies');
      fireEvent.click(acceptButton);

      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
    });

    it('calls localStorage.setItem only once', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const acceptButton = screen.getByText('Accept All Cookies');
      fireEvent.click(acceptButton);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('Decline Functionality', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('saves decline to localStorage', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const declineButton = screen.getByText('Decline');
      fireEvent.click(declineButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('cryb-cookies-accepted', 'declined');
    });

    it('hides banner after declining', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const declineButton = screen.getByText('Decline');
      fireEvent.click(declineButton);

      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
    });

    it('calls localStorage.setItem only once', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const declineButton = screen.getByText('Decline');
      fireEvent.click(declineButton);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('LocalStorage Checks', () => {
    it('checks localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<CookieConsent />);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('cryb-cookies-accepted');
    });

    it('respects existing acceptance', () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
    });

    it('respects existing decline', () => {
      localStorageMock.getItem.mockReturnValue('declined');
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
    });
  });

  describe('Timing', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('does not show before 1 second', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
    });

    it('shows exactly after 1 second', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });

    it('shows after more than 1 second', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('has fixed position at bottom', () => {
      const { container } = render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const banner = container.firstChild;
      expect(banner).toHaveStyle({ position: 'fixed', bottom: '0' });
    });

    it('has high z-index', () => {
      const { container } = render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const banner = container.firstChild;
      expect(banner).toHaveStyle({ zIndex: '9999' });
    });

    it('has animation keyframes', () => {
      const { container } = render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag.textContent).toContain('@keyframes slideUp');
    });
  });

  describe('Button Interactions', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('accept button is clickable', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const acceptButton = screen.getByText('Accept All Cookies');
      expect(acceptButton).toBeEnabled();
      fireEvent.click(acceptButton);

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('decline button is clickable', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const declineButton = screen.getByText('Decline');
      expect(declineButton).toBeEnabled();
      fireEvent.click(declineButton);

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('handles multiple clicks on accept', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const acceptButton = screen.getByText('Accept All Cookies');
      fireEvent.click(acceptButton);
      fireEvent.click(acceptButton);

      // Banner should be hidden after first click
      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
    });

    it('handles multiple clicks on decline', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const declineButton = screen.getByText('Decline');
      fireEvent.click(declineButton);
      fireEvent.click(declineButton);

      // Banner should be hidden after first click
      expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
    });
  });

  describe('Links', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('privacy link has correct styling', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toHaveStyle({ color: '#60a5fa' });
    });

    it('terms link has correct styling', () => {
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const termsLink = screen.getByText('Terms of Service');
      expect(termsLink).toHaveStyle({ color: '#60a5fa' });
    });
  });

  describe('Cleanup', () => {
    it('clears timeout on unmount', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const { unmount } = render(<CookieConsent />);

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      unmount();

      // Component should clean up setTimeout
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles localStorage being null', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });

    it('handles localStorage error on get', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not crash
      expect(() => render(<CookieConsent />)).not.toThrow();
    });

    it('handles localStorage error on set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const acceptButton = screen.getByText('Accept All Cookies');

      // Should not crash on error
      expect(() => fireEvent.click(acceptButton)).not.toThrow();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot when hidden', () => {
      localStorageMock.getItem.mockReturnValue('true');
      const { container } = render(<CookieConsent />);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when visible', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const { container } = render(<CookieConsent />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(container).toMatchSnapshot();
    });
  });
});

export default privacyLink
