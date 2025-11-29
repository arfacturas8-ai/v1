/**
 * Tests for ConnectionStatusIndicator component
 */
import { render, screen } from '@testing-library/react';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

jest.mock('../hooks/useConnectionStatus');

describe('ConnectionStatusIndicator', () => {
  const mockConnectionStatus = {
    isConnected: true,
    isConnecting: false,
    connectionType: 'websocket',
    usePolling: false,
    reconnectAttempts: 0,
    isPollingFallback: false,
    connectionQuality: 'good'
  };

  beforeEach(() => {
    useConnectionStatus.mockReturnValue(mockConnectionStatus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when connected via WebSocket without showDetails', () => {
      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when showDetails is true', () => {
      render(<ConnectionStatusIndicator showDetails={true} />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('renders when using polling fallback', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('Limited Connection')).toBeInTheDocument();
    });

    it('renders when disconnected', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: false
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  describe('Status Text', () => {
    it('shows "Connected" when connected', () => {
      render(<ConnectionStatusIndicator showDetails={true} />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('shows "Disconnected" when not connected', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: false
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('shows "Connecting..." when connecting', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: true,
        reconnectAttempts: 0
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('shows reconnect attempts when reconnecting', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: true,
        reconnectAttempts: 3
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('Reconnecting (3)...')).toBeInTheDocument();
    });

    it('shows "Limited Connection" when using polling', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('Limited Connection')).toBeInTheDocument();
    });
  });

  describe('Status Icons', () => {
    it('shows ✓ icon when connected', () => {
      render(<ConnectionStatusIndicator showDetails={true} />);
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('shows ⚠ icon when disconnected', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: false
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('shows ⟳ icon when connecting', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: true
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('⟳')).toBeInTheDocument();
    });

    it('shows ⚡ icon when using polling', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('applies status-connected class when connected', () => {
      const { container } = render(<ConnectionStatusIndicator showDetails={true} />);
      expect(container.firstChild).toHaveClass('status-connected');
    });

    it('applies status-disconnected class when disconnected', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: false
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toHaveClass('status-disconnected');
    });

    it('applies status-connecting class when connecting', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: true
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toHaveClass('status-connecting');
    });

    it('applies status-degraded class when using polling', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toHaveClass('status-degraded');
    });

    it('applies default position class', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toHaveClass('position-bottom-right');
    });

    it('applies custom position class', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      const { container } = render(<ConnectionStatusIndicator position="top-left" />);
      expect(container.firstChild).toHaveClass('position-top-left');
    });
  });

  describe('Tooltips', () => {
    it('shows WebSocket tooltip when connected', () => {
      const { container } = render(<ConnectionStatusIndicator showDetails={true} />);
      expect(container.firstChild).toHaveAttribute('title', 'Connected via WebSocket');
    });

    it('shows polling fallback tooltip when using polling', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toHaveAttribute(
        'title',
        'Connected via HTTP polling fallback. Some features may be delayed.'
      );
    });

    it('shows reconnecting tooltip when disconnected', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toHaveAttribute(
        'title',
        'Connection lost. Attempting to reconnect...'
      );
    });
  });

  describe('Show Details Prop', () => {
    it('shows connection type when showDetails is true', () => {
      render(<ConnectionStatusIndicator showDetails={true} />);
      expect(screen.getByText('(websocket)')).toBeInTheDocument();
    });

    it('does not show connection type when showDetails is false', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      render(<ConnectionStatusIndicator showDetails={false} />);
      expect(screen.queryByText('(websocket)')).not.toBeInTheDocument();
    });

    it('defaults showDetails to false', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.queryByText('(websocket)')).not.toBeInTheDocument();
    });
  });

  describe('Position Prop', () => {
    it('defaults position to bottom-right', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toHaveClass('position-bottom-right');
    });

    it('accepts custom position', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      const { container } = render(<ConnectionStatusIndicator position="top-left" />);
      expect(container.firstChild).toHaveClass('position-top-left');
    });

    it('accepts bottom-left position', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      const { container } = render(<ConnectionStatusIndicator position="bottom-left" />);
      expect(container.firstChild).toHaveClass('position-bottom-left');
    });
  });

  describe('Edge Cases', () => {
    it('handles connecting with zero reconnect attempts', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: true,
        reconnectAttempts: 0
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.queryByText(/Reconnecting/)).not.toBeInTheDocument();
    });

    it('handles high reconnect attempts', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false,
        isConnecting: true,
        reconnectAttempts: 99
      });

      render(<ConnectionStatusIndicator />);
      expect(screen.getByText('Reconnecting (99)...')).toBeInTheDocument();
    });

    it('handles polling fallback with showDetails', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true,
        connectionType: 'polling'
      });

      render(<ConnectionStatusIndicator showDetails={true} />);
      expect(screen.getByText('Limited Connection')).toBeInTheDocument();
      expect(screen.getByText('(polling)')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot when connected', () => {
      const { container } = render(<ConnectionStatusIndicator showDetails={true} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when disconnected', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        isConnected: false
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when using polling', () => {
      useConnectionStatus.mockReturnValue({
        ...mockConnectionStatus,
        usePolling: true
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container).toMatchSnapshot();
    });
  });
});

export default mockConnectionStatus
