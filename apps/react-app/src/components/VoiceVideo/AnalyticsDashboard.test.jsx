import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsDashboard from './AnalyticsDashboard';
import { webrtcService } from '../../services/webrtc';

// Mock webrtcService
jest.mock('../../services/webrtc', () => ({
  webrtcService: {
    getDetailedStats: jest.fn(),
    getRoomStats: jest.fn(),
    getHistoricalAnalytics: jest.fn()
  }
}));

// Mock CSS import
jest.mock('./AnalyticsDashboard.css', () => ({}));

// Mock canvas context
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn()
};

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document methods
const createElementSpy = jest.spyOn(document, 'createElement');
const appendChildSpy = jest.spyOn(document.body, 'appendChild');
const removeChildSpy = jest.spyOn(document.body, 'removeChild');

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCanvasContext);
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  // Default mock responses
  webrtcService.getDetailedStats.mockResolvedValue({
    bandwidth: { upload: 1000, download: 2000 },
    video: { quality: 4 },
    audio: { quality: 5 },
    connection: {
      rtt: 50,
      jitter: 10,
      packetLoss: 0.01,
      state: 'connected'
    }
  });

  webrtcService.getRoomStats.mockResolvedValue({
    participantCount: 5,
    speakingCount: 2,
    videoCount: 4,
    participants: [
      {
        id: 'user-1',
        name: 'John Doe',
        avatar: 'avatar1.jpg',
        isSpeaking: true,
        hasVideo: true,
        hasAudio: true,
        quality: 4,
        latency: 45
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        avatar: null,
        isSpeaking: false,
        hasVideo: true,
        hasAudio: true,
        quality: 5,
        latency: 60
      },
      {
        id: 'user-3',
        name: 'Bob Johnson',
        avatar: 'avatar3.jpg',
        isSpeaking: true,
        hasVideo: false,
        hasAudio: true,
        quality: 3,
        latency: 120
      }
    ]
  });

  webrtcService.getHistoricalAnalytics.mockResolvedValue({
    sessionStart: Date.now() - 3600000,
    peakParticipants: 10,
    averageQuality: 4.2,
    dataTransferred: 150.5
  });

  mockCanvasContext.fillStyle = '';
  mockCanvasContext.strokeStyle = '';
  mockCanvasContext.lineWidth = 0;
  mockCanvasContext.font = '';
  mockCanvasContext.textAlign = '';
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('AnalyticsDashboard Component', () => {
  // Rendering Tests
  describe('Rendering', () => {
    test('renders loading state initially', () => {
      render(<AnalyticsDashboard roomId="test-room" />);
      expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
      expect(screen.getByClassName('loading-spinner')).toBeInTheDocument();
    });

    test('renders dashboard after loading', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });
    });

    test('displays room ID', async () => {
      render(<AnalyticsDashboard roomId="test-room-123" />);

      await waitFor(() => {
        expect(screen.getByText(/room: test-room-123/i)).toBeInTheDocument();
      });
    });

    test('renders all navigation tabs', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Participants')).toBeInTheDocument();
        expect(screen.getByText('Performance')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
      });
    });

    test('renders time range selector', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Time Range:')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { value: '1h' })).toBeInTheDocument();
      });
    });

    test('renders auto refresh toggle', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Auto Refresh')).toBeInTheDocument();
        const checkbox = screen.getByRole('checkbox', { name: /auto refresh/i });
        expect(checkbox).toBeChecked();
      });
    });

    test('renders export button', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Export Data')).toBeInTheDocument();
      });
    });

    test('renders overview tab by default', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Bandwidth Usage')).toBeInTheDocument();
        expect(screen.getByText('Connection Quality')).toBeInTheDocument();
        expect(screen.getByText('Latency')).toBeInTheDocument();
      });
    });
  });

  // Data Fetching Tests
  describe('Data Fetching', () => {
    test('fetches real-time data on mount', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(webrtcService.getDetailedStats).toHaveBeenCalled();
        expect(webrtcService.getRoomStats).toHaveBeenCalledWith('test-room');
      });
    });

    test('fetches historical data on mount', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(webrtcService.getHistoricalAnalytics).toHaveBeenCalledWith('test-room', '1h');
      });
    });

    test('updates real-time data at intervals when auto-refresh is enabled', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(webrtcService.getDetailedStats).toHaveBeenCalledTimes(1);
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(webrtcService.getDetailedStats).toHaveBeenCalledTimes(2);
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(webrtcService.getDetailedStats).toHaveBeenCalledTimes(3);
      });
    });

    test('does not auto-refresh when auto-refresh is disabled', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /auto refresh/i });
      fireEvent.click(checkbox);

      const initialCallCount = webrtcService.getDetailedStats.mock.calls.length;

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        expect(webrtcService.getDetailedStats).toHaveBeenCalledTimes(initialCallCount);
      });
    });

    test('cleans up interval on unmount', async () => {
      const { unmount } = render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    test('handles error when fetching real-time data', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      webrtcService.getDetailedStats.mockRejectedValue(new Error('Network error'));

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error collecting real-time data:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles error when fetching historical data', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      webrtcService.getHistoricalAnalytics.mockRejectedValue(new Error('Network error'));

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching historical data:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    test('refetches historical data when time range changes', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(webrtcService.getHistoricalAnalytics).toHaveBeenCalledWith('test-room', '1h');
      });

      const selector = screen.getByRole('combobox');
      fireEvent.change(selector, { target: { value: '24h' } });

      await waitFor(() => {
        expect(webrtcService.getHistoricalAnalytics).toHaveBeenCalledWith('test-room', '24h');
      });
    });
  });

  // Voice/Video Metrics Display Tests
  describe('Voice/Video Metrics Display', () => {
    test('displays bandwidth metrics', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Bandwidth Usage')).toBeInTheDocument();
      });
    });

    test('displays connection quality metrics', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Connection Quality')).toBeInTheDocument();
      });
    });

    test('displays participant metrics', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Participants')).toBeInTheDocument();
      });
    });

    test('displays latency metrics', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Latency')).toBeInTheDocument();
      });
    });

    test('displays real-time statistics', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Real-time Statistics')).toBeInTheDocument();
        expect(screen.getByText('Packet Loss')).toBeInTheDocument();
        expect(screen.getByText('Jitter')).toBeInTheDocument();
        expect(screen.getByText('Connection State')).toBeInTheDocument();
        expect(screen.getByText('Active Speakers')).toBeInTheDocument();
      });
    });

    test('displays packet loss percentage', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('1.00%')).toBeInTheDocument(); // 0.01 * 100
      });
    });

    test('displays jitter value', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('10ms')).toBeInTheDocument();
      });
    });

    test('displays connection state', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('connected')).toBeInTheDocument();
      });
    });

    test('displays active speakers count', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        const speakersElements = screen.getAllByText('2');
        expect(speakersElements.length).toBeGreaterThan(0);
      });
    });
  });

  // Charts and Visualizations Tests
  describe('Charts and Visualizations', () => {
    test('renders bandwidth chart canvas', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        const canvases = document.querySelectorAll('canvas');
        expect(canvases.length).toBeGreaterThan(0);
      });
    });

    test('calls canvas context methods for bandwidth chart', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
        expect(mockCanvasContext.fillRect).toHaveBeenCalled();
        expect(mockCanvasContext.stroke).toHaveBeenCalled();
      });
    });

    test('renders quality chart with quality meters', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(mockCanvasContext.fillRect).toHaveBeenCalled();
        expect(mockCanvasContext.fillText).toHaveBeenCalled();
      });
    });

    test('renders participants pie chart', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(mockCanvasContext.arc).toHaveBeenCalled();
        expect(mockCanvasContext.fill).toHaveBeenCalled();
      });
    });

    test('renders latency gauge chart', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(mockCanvasContext.arc).toHaveBeenCalled();
        expect(mockCanvasContext.stroke).toHaveBeenCalled();
      });
    });

    test('updates charts when real-time data changes', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
      });

      const clearRectCallCount = mockCanvasContext.clearRect.mock.calls.length;

      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 2000, download: 3000 },
        video: { quality: 3 },
        audio: { quality: 4 },
        connection: { rtt: 100, jitter: 20, packetLoss: 0.02, state: 'connected' }
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(mockCanvasContext.clearRect.mock.calls.length).toBeGreaterThan(clearRectCallCount);
      });
    });
  });

  // Tab Navigation Tests
  describe('Tab Navigation', () => {
    test('shows overview tab by default', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        const overviewTab = screen.getByRole('button', { name: /overview/i });
        expect(overviewTab).toHaveClass('active');
      });
    });

    test('switches to participants tab when clicked', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      expect(participantsTab).toHaveClass('active');
      expect(screen.getByText('Active Participants (3)')).toBeInTheDocument();
    });

    test('switches to performance tab when clicked', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const performanceTab = screen.getByRole('button', { name: /performance/i });
      fireEvent.click(performanceTab);

      expect(performanceTab).toHaveClass('active');
      expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
    });

    test('switches to history tab when clicked', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      expect(historyTab).toHaveClass('active');
      expect(screen.getByText('Historical Data')).toBeInTheDocument();
    });
  });

  // Participants Tab Tests
  describe('Participants Tab', () => {
    test('displays participant list', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    test('displays participant avatars', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      const avatarImg = screen.getByAltText('John Doe');
      expect(avatarImg).toHaveAttribute('src', 'avatar1.jpg');
    });

    test('displays placeholder for missing avatars', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      expect(screen.getByText('J')).toBeInTheDocument(); // Jane Smith's placeholder
    });

    test('displays participant status badges', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      const speakingBadges = screen.getAllByText('Speaking');
      expect(speakingBadges.length).toBeGreaterThan(0);
    });

    test('displays participant quality metrics', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      const qualityLabels = screen.getAllByText('Quality');
      expect(qualityLabels.length).toBeGreaterThan(0);
    });

    test('displays participant latency', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      expect(screen.getByText('45ms')).toBeInTheDocument();
      expect(screen.getByText('60ms')).toBeInTheDocument();
      expect(screen.getByText('120ms')).toBeInTheDocument();
    });

    test('shows admin actions when isAdmin is true', async () => {
      render(<AnalyticsDashboard roomId="test-room" isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      const muteButtons = screen.getAllByText('Mute');
      const kickButtons = screen.getAllByText('Kick');

      expect(muteButtons.length).toBe(3); // One for each participant
      expect(kickButtons.length).toBe(3);
    });

    test('hides admin actions when isAdmin is false', async () => {
      render(<AnalyticsDashboard roomId="test-room" isAdmin={false} />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      expect(screen.queryByText('Mute')).not.toBeInTheDocument();
      expect(screen.queryByText('Kick')).not.toBeInTheDocument();
    });

    test('renders search input for participants', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      expect(screen.getByPlaceholderText('Search participants...')).toBeInTheDocument();
    });

    test('renders filter dropdown for participants', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      const filterSelect = screen.getByRole('combobox', { name: '' });
      expect(filterSelect).toBeInTheDocument();
    });
  });

  // Performance Tab Tests
  describe('Performance Tab', () => {
    test('displays performance analysis section', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const performanceTab = screen.getByRole('button', { name: /performance/i });
      fireEvent.click(performanceTab);

      expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
    });

    test('displays network performance metrics', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const performanceTab = screen.getByRole('button', { name: /performance/i });
      fireEvent.click(performanceTab);

      expect(screen.getByText('Network Performance')).toBeInTheDocument();
      expect(screen.getByText('Average RTT:')).toBeInTheDocument();
      expect(screen.getByText('Bandwidth Utilization:')).toBeInTheDocument();
    });

    test('displays media quality metrics', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const performanceTab = screen.getByRole('button', { name: /performance/i });
      fireEvent.click(performanceTab);

      expect(screen.getByText('Media Quality')).toBeInTheDocument();
      expect(screen.getByText('Video Quality:')).toBeInTheDocument();
      expect(screen.getByText('Audio Quality:')).toBeInTheDocument();
    });

    test('displays resource usage metrics', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const performanceTab = screen.getByRole('button', { name: /performance/i });
      fireEvent.click(performanceTab);

      expect(screen.getByText('Resource Usage')).toBeInTheDocument();
      expect(screen.getByText('CPU Usage:')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage:')).toBeInTheDocument();
      expect(screen.getByText('GPU Usage:')).toBeInTheDocument();
    });
  });

  // History Tab Tests
  describe('History Tab', () => {
    test('displays historical data section', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      expect(screen.getByText('Historical Data')).toBeInTheDocument();
    });

    test('displays session summary', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      expect(screen.getByText('Session Summary')).toBeInTheDocument();
      expect(screen.getByText('Total Duration:')).toBeInTheDocument();
      expect(screen.getByText('Peak Participants:')).toBeInTheDocument();
      expect(screen.getByText('Average Quality:')).toBeInTheDocument();
      expect(screen.getByText('Data Transferred:')).toBeInTheDocument();
    });

    test('displays historical data values', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      expect(screen.getByText('10')).toBeInTheDocument(); // Peak participants
      expect(screen.getByText('4.2/5')).toBeInTheDocument(); // Average quality
      expect(screen.getByText('150.50 MB')).toBeInTheDocument(); // Data transferred
    });
  });

  // Alert Tests
  describe('Alerts and Notifications', () => {
    test('shows high bandwidth usage alert', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 6000, download: 2000 },
        video: { quality: 4 },
        audio: { quality: 5 },
        connection: { rtt: 50, jitter: 10, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('High Bandwidth Usage')).toBeInTheDocument();
      });
    });

    test('shows poor quality alert', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 1000, download: 2000 },
        video: { quality: 2 },
        audio: { quality: 5 },
        connection: { rtt: 50, jitter: 10, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('Poor Connection Quality')).toBeInTheDocument();
      });
    });

    test('shows high latency alert', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 1000, download: 2000 },
        video: { quality: 4 },
        audio: { quality: 5 },
        connection: { rtt: 350, jitter: 10, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('High Latency Detected')).toBeInTheDocument();
      });
    });

    test('displays alert count', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 6000, download: 2000 },
        video: { quality: 2 },
        audio: { quality: 2 },
        connection: { rtt: 350, jitter: 10, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/active alerts \(3\)/i)).toBeInTheDocument();
      });
    });

    test('dismisses individual alert', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 6000, download: 2000 },
        video: { quality: 4 },
        audio: { quality: 5 },
        connection: { rtt: 50, jitter: 10, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('High Bandwidth Usage')).toBeInTheDocument();
      });

      const dismissButton = screen.getByText('×');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('High Bandwidth Usage')).not.toBeInTheDocument();
      });
    });

    test('clears all alerts', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 6000, download: 2000 },
        video: { quality: 2 },
        audio: { quality: 2 },
        connection: { rtt: 350, jitter: 10, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/active alerts/i)).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByText(/active alerts/i)).not.toBeInTheDocument();
      });
    });

    test('limits alerts display to 3 most recent', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 6000, download: 2000 },
        video: { quality: 2 },
        audio: { quality: 2 },
        connection: { rtt: 350, jitter: 10, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        const alertElements = document.querySelectorAll('.alert');
        expect(alertElements.length).toBeLessThanOrEqual(3);
      });
    });
  });

  // Export Data Tests
  describe('Export Data', () => {
    test('calls onExportData callback when provided', async () => {
      const mockExport = jest.fn();
      render(<AnalyticsDashboard roomId="test-room" onExportData={mockExport} />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);

      expect(mockExport).toHaveBeenCalled();
      expect(mockExport.mock.calls[0][0]).toHaveProperty('roomId', 'test-room');
      expect(mockExport.mock.calls[0][0]).toHaveProperty('realTimeData');
      expect(mockExport.mock.calls[0][0]).toHaveProperty('historicalData');
      expect(mockExport.mock.calls[0][0]).toHaveProperty('participants');
      expect(mockExport.mock.calls[0][0]).toHaveProperty('alerts');
    });

    test('downloads JSON file when no callback provided', async () => {
      const mockAnchor = {
        click: jest.fn(),
        href: '',
        download: ''
      };

      createElementSpy.mockReturnValue(mockAnchor);
      appendChildSpy.mockImplementation(() => {});
      removeChildSpy.mockImplementation(() => {});

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toContain('analytics-test-room-');
      expect(mockAnchor.download).toContain('.json');
    });

    test('creates blob with correct data structure', async () => {
      const blobSpy = jest.spyOn(global, 'Blob');

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);

      expect(blobSpy).toHaveBeenCalled();
      expect(blobSpy.mock.calls[0][1]).toEqual({ type: 'application/json' });
    });
  });

  // Time Range Tests
  describe('Time Range Selection', () => {
    test('changes time range selection', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const selector = screen.getByRole('combobox');
      expect(selector.value).toBe('1h');

      fireEvent.change(selector, { target: { value: '24h' } });

      expect(selector.value).toBe('24h');
    });

    test('has all time range options', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      expect(screen.getByText('5 minutes')).toBeInTheDocument();
      expect(screen.getByText('1 hour')).toBeInTheDocument();
      expect(screen.getByText('6 hours')).toBeInTheDocument();
      expect(screen.getByText('24 hours')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();
      expect(screen.getByText('30 days')).toBeInTheDocument();
    });
  });

  // Auto Refresh Tests
  describe('Auto Refresh', () => {
    test('toggles auto refresh', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /auto refresh/i });
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  // Edge Cases Tests
  describe('Edge Cases', () => {
    test('handles empty participants list', async () => {
      webrtcService.getRoomStats.mockResolvedValue({
        participantCount: 0,
        speakingCount: 0,
        videoCount: 0,
        participants: []
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      expect(screen.getByText('Active Participants (0)')).toBeInTheDocument();
    });

    test('handles missing bandwidth data', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: null,
        video: { quality: 4 },
        audio: { quality: 5 },
        connection: { rtt: 50, jitter: 10, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });
    });

    test('handles missing quality data', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 1000, download: 2000 },
        video: null,
        audio: null,
        connection: { rtt: 50, jitter: 10, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });
    });

    test('handles missing participant name', async () => {
      webrtcService.getRoomStats.mockResolvedValue({
        participantCount: 1,
        speakingCount: 0,
        videoCount: 0,
        participants: [
          {
            id: 'user-1',
            name: null,
            avatar: null,
            isSpeaking: false,
            hasVideo: false,
            hasAudio: true,
            quality: 4,
            latency: 45
          }
        ]
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const participantsTab = screen.getByRole('button', { name: /participants/i });
      fireEvent.click(participantsTab);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument(); // Avatar placeholder
    });

    test('handles zero values in metrics', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 0, download: 0 },
        video: { quality: 0 },
        audio: { quality: 0 },
        connection: { rtt: 0, jitter: 0, packetLoss: 0, state: 'unknown' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });
    });

    test('handles missing historical data', async () => {
      webrtcService.getHistoricalAnalytics.mockResolvedValue({});

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      expect(screen.getByText('0')).toBeInTheDocument(); // Peak participants
    });
  });

  // Utility Functions Tests
  describe('Utility Functions', () => {
    test('formats duration correctly for hours', async () => {
      webrtcService.getHistoricalAnalytics.mockResolvedValue({
        sessionStart: Date.now() - 7200000, // 2 hours ago
        peakParticipants: 10,
        averageQuality: 4.2,
        dataTransferred: 150.5
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      });

      const historyTab = screen.getByRole('button', { name: /history/i });
      fireEvent.click(historyTab);

      await waitFor(() => {
        const durationText = screen.getByText(/h/);
        expect(durationText).toBeInTheDocument();
      });
    });

    test('formats packet loss as percentage', async () => {
      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        expect(screen.getByText('1.00%')).toBeInTheDocument();
      });
    });

    test('applies warning class for high packet loss', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 1000, download: 2000 },
        video: { quality: 4 },
        audio: { quality: 5 },
        connection: { rtt: 50, jitter: 10, packetLoss: 0.06, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        const packetLossElement = screen.getByText('6.00%');
        expect(packetLossElement).toHaveClass('warning');
      });
    });

    test('applies warning class for high jitter', async () => {
      webrtcService.getDetailedStats.mockResolvedValue({
        bandwidth: { upload: 1000, download: 2000 },
        video: { quality: 4 },
        audio: { quality: 5 },
        connection: { rtt: 50, jitter: 60, packetLoss: 0.01, state: 'connected' }
      });

      render(<AnalyticsDashboard roomId="test-room" />);

      await waitFor(() => {
        const jitterElement = screen.getByText('60ms');
        expect(jitterElement).toHaveClass('warning');
      });
    });
  });
});

export default mockCanvasContext
