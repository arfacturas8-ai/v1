import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AnalyticsPanel from './AnalyticsPanel';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    VITE_API_URL: 'http://localhost:3000',
  },
});

describe('AnalyticsPanel', () => {
  const mockAnalyticsData = {
    data: {
      summary: {
        total_reports: 1234,
        new_reports: 45,
        total_actions: 567,
        auto_action_rate: 0.65,
        avg_response_time: 12,
        resolved_reports: 800,
        pending_reports: 234,
        escalated_reports: 200,
        valid_report_rate: 0.85,
        false_report_rate: 0.10,
        duplicate_report_rate: 0.05,
        bans: 50,
        warnings: 150,
        content_removed: 300,
        quarantined: 67,
        appeal_rate: 0.15,
        overturned_rate: 0.08,
        repeat_offender_rate: 0.22,
        action_distribution: {
          ban: 50,
          warning: 150,
          remove: 300,
          quarantine: 67,
        },
      },
      ai_accuracy: {
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.87,
        avg_processing_time: 150,
        total_analyzed: 5000,
        auto_actions: 3250,
        category_performance: {
          'Hate Speech': { accuracy: 0.95 },
          'Spam': { accuracy: 0.88 },
          'Harassment': { accuracy: 0.90 },
          'Violence': { accuracy: 0.93 },
        },
      },
      top_violations: [
        { category: 'Spam', count: 450 },
        { category: 'Harassment', count: 350 },
        { category: 'Hate Speech', count: 200 },
        { category: 'Violence', count: 150 },
      ],
      trends: {
        daily_reports: [
          { date: '2025-01-01', value: 100 },
          { date: '2025-01-02', value: 120 },
          { date: '2025-01-03', value: 90 },
          { date: '2025-01-04', value: 150 },
          { date: '2025-01-05', value: 130 },
        ],
      },
      moderator_performance: [
        {
          username: 'john_doe',
          role: 'Senior Moderator',
          actions_taken: 250,
          reports_resolved: 200,
          avg_response_time: 8,
          appeal_rate: 0.10,
        },
        {
          username: 'jane_smith',
          role: 'Moderator',
          actions_taken: 180,
          reports_resolved: 150,
          avg_response_time: 10,
          appeal_rate: 0.12,
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockAnalyticsData,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial Rendering and Loading States', () => {
    it('should display loading state initially', () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<AnalyticsPanel />);

      expect(screen.getByText('Loading moderation analytics...')).toBeInTheDocument();
      expect(screen.getByClassName('loading-spinner')).toBeInTheDocument();
    });

    it('should fetch analytics on mount', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/moderation/analytics?time_range=7d',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer mock-token',
            },
          })
        );
      });
    });

    it('should display analytics data after successful fetch', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });
    });

    it('should use correct authorization header from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('custom-token-123');
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer custom-token-123',
            },
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error state when fetch fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching analytics:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle missing analytics data gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      });
    });
  });

  describe('Time Range Filter', () => {
    it('should default to 7 days time range', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        const select = screen.getByClassName('time-range-select');
        expect(select.value).toBe('7d');
      });
    });

    it('should fetch analytics when time range changes', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const select = screen.getByClassName('time-range-select');
      fireEvent.change(select, { target: { value: '30d' } });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/moderation/analytics?time_range=30d',
          expect.any(Object)
        );
      });
    });

    it('should update time range to 24h', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const select = screen.getByClassName('time-range-select');
      fireEvent.change(select, { target: { value: '24h' } });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/moderation/analytics?time_range=24h',
          expect.any(Object)
        );
      });
    });

    it('should update time range to 90d', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const select = screen.getByClassName('time-range-select');
      fireEvent.change(select, { target: { value: '90d' } });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/moderation/analytics?time_range=90d',
          expect.any(Object)
        );
      });
    });

    it('should display all time range options', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const select = screen.getByClassName('time-range-select');
      const options = within(select).getAllByRole('option');

      expect(options).toHaveLength(4);
      expect(options[0]).toHaveTextContent('Last 24 Hours');
      expect(options[1]).toHaveTextContent('Last 7 Days');
      expect(options[2]).toHaveTextContent('Last 30 Days');
      expect(options[3]).toHaveTextContent('Last 90 Days');
    });
  });

  describe('Refresh Functionality', () => {
    it('should display refresh button', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });

    it('should refetch analytics when refresh button is clicked', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const initialCallCount = fetch.mock.calls.length;
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(fetch.mock.calls.length).toBe(initialCallCount + 1);
      });
    });
  });

  describe('Overview Metric Navigation', () => {
    it('should display all metric navigation buttons', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reports' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'AI Performance' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Moderator Performance' })).toBeInTheDocument();
      });
    });

    it('should set overview as active metric by default', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        const overviewButton = screen.getByRole('button', { name: 'Overview' });
        expect(overviewButton).toHaveClass('active');
      });
    });

    it('should switch to reports metric', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const reportsButton = screen.getByRole('button', { name: 'Reports' });
      fireEvent.click(reportsButton);

      await waitFor(() => {
        expect(reportsButton).toHaveClass('active');
        expect(screen.getByText(/Report Analytics/i)).toBeInTheDocument();
      });
    });

    it('should switch to actions metric', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const actionsButton = screen.getByRole('button', { name: 'Actions' });
      fireEvent.click(actionsButton);

      await waitFor(() => {
        expect(actionsButton).toHaveClass('active');
        expect(screen.getByText(/Moderation Actions/i)).toBeInTheDocument();
      });
    });

    it('should switch to AI Performance metric', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const aiButton = screen.getByRole('button', { name: 'AI Performance' });
      fireEvent.click(aiButton);

      await waitFor(() => {
        expect(aiButton).toHaveClass('active');
        expect(screen.getByText(/AI Performance Metrics/i)).toBeInTheDocument();
      });
    });

    it('should switch to Moderator Performance metric', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const moderatorButton = screen.getByRole('button', { name: 'Moderator Performance' });
      fireEvent.click(moderatorButton);

      await waitFor(() => {
        expect(moderatorButton).toHaveClass('active');
        expect(screen.getByText(/Moderator Performance/i)).toBeInTheDocument();
      });
    });
  });

  describe('Overview Section - Summary Stats', () => {
    it('should display total reports stat', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('1.2K')).toBeInTheDocument();
        expect(screen.getByText('Total Reports')).toBeInTheDocument();
      });
    });

    it('should display new reports count', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('+45 new')).toBeInTheDocument();
      });
    });

    it('should display total moderation actions', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('567')).toBeInTheDocument();
        expect(screen.getByText('Moderation Actions')).toBeInTheDocument();
      });
    });

    it('should display auto action rate', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('65.0% automated')).toBeInTheDocument();
      });
    });

    it('should display AI accuracy', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('92.0%')).toBeInTheDocument();
        expect(screen.getByText('AI Accuracy')).toBeInTheDocument();
      });
    });

    it('should display AI precision', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('89.0% precision')).toBeInTheDocument();
      });
    });

    it('should display average response time', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('12m')).toBeInTheDocument();
        expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
      });
    });

    it('should handle missing summary data gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            summary: {},
            ai_accuracy: {},
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });

  describe('Overview Section - Charts', () => {
    it('should display reports over time chart', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Reports Over Time')).toBeInTheDocument();
      });
    });

    it('should render chart bars for daily reports', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        const chartBars = screen.getAllByClassName('chart-bar');
        expect(chartBars).toHaveLength(5);
      });
    });

    it('should display action distribution chart', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Action Distribution')).toBeInTheDocument();
      });
    });

    it('should display action distribution items', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('ban: 50')).toBeInTheDocument();
        expect(screen.getByText('warning: 150')).toBeInTheDocument();
        expect(screen.getByText('remove: 300')).toBeInTheDocument();
        expect(screen.getByText('quarantine: 67')).toBeInTheDocument();
      });
    });

    it('should handle missing trends data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            summary: mockAnalyticsData.data.summary,
            ai_accuracy: mockAnalyticsData.data.ai_accuracy,
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Reports Over Time')).toBeInTheDocument();
      });
    });
  });

  describe('Reports Section', () => {
    beforeEach(async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const reportsButton = screen.getByRole('button', { name: 'Reports' });
      fireEvent.click(reportsButton);
    });

    it('should display report categories', async () => {
      await waitFor(() => {
        expect(screen.getByText('Report Categories')).toBeInTheDocument();
      });
    });

    it('should display top violations', async () => {
      await waitFor(() => {
        expect(screen.getByText('Spam')).toBeInTheDocument();
        expect(screen.getByText('Harassment')).toBeInTheDocument();
        expect(screen.getByText('Hate Speech')).toBeInTheDocument();
        expect(screen.getByText('Violence')).toBeInTheDocument();
      });
    });

    it('should display violation counts', async () => {
      await waitFor(() => {
        expect(screen.getByText('450')).toBeInTheDocument();
        expect(screen.getByText('350')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });

    it('should display resolution status section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Resolution Status')).toBeInTheDocument();
      });
    });

    it('should display resolved reports count', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Resolved: 800/i)).toBeInTheDocument();
      });
    });

    it('should display pending reports count', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Pending: 234/i)).toBeInTheDocument();
      });
    });

    it('should display escalated reports count', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Escalated: 200/i)).toBeInTheDocument();
      });
    });

    it('should display report quality metrics', async () => {
      await waitFor(() => {
        expect(screen.getByText('Report Quality')).toBeInTheDocument();
      });
    });

    it('should display valid report rate', async () => {
      await waitFor(() => {
        expect(screen.getByText('Valid Reports')).toBeInTheDocument();
        expect(screen.getByText('85.0%')).toBeInTheDocument();
      });
    });

    it('should display false report rate', async () => {
      await waitFor(() => {
        expect(screen.getByText('False Reports')).toBeInTheDocument();
        expect(screen.getByText('10.0%')).toBeInTheDocument();
      });
    });

    it('should display duplicate report rate', async () => {
      await waitFor(() => {
        expect(screen.getByText('Duplicate Reports')).toBeInTheDocument();
        expect(screen.getByText('5.0%')).toBeInTheDocument();
      });
    });
  });

  describe('Actions Section', () => {
    beforeEach(async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const actionsButton = screen.getByRole('button', { name: 'Actions' });
      fireEvent.click(actionsButton);
    });

    it('should display user bans count', async () => {
      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('User Bans')).toBeInTheDocument();
      });
    });

    it('should display warnings count', async () => {
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('Warnings')).toBeInTheDocument();
      });
    });

    it('should display content removed count', async () => {
      await waitFor(() => {
        expect(screen.getByText('300')).toBeInTheDocument();
        expect(screen.getByText('Content Removed')).toBeInTheDocument();
      });
    });

    it('should display quarantined count', async () => {
      await waitFor(() => {
        expect(screen.getByText('67')).toBeInTheDocument();
        expect(screen.getByText('Quarantined')).toBeInTheDocument();
      });
    });

    it('should display action effectiveness section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Action Effectiveness')).toBeInTheDocument();
      });
    });

    it('should display appeal rate', async () => {
      await waitFor(() => {
        expect(screen.getByText('Appeal Rate')).toBeInTheDocument();
        expect(screen.getByText('15.0%')).toBeInTheDocument();
      });
    });

    it('should display overturned appeals rate', async () => {
      await waitFor(() => {
        expect(screen.getByText('Overturned Appeals')).toBeInTheDocument();
        expect(screen.getByText('8.0%')).toBeInTheDocument();
      });
    });

    it('should display repeat offender rate', async () => {
      await waitFor(() => {
        expect(screen.getByText('Repeat Offenders')).toBeInTheDocument();
        expect(screen.getByText('22.0%')).toBeInTheDocument();
      });
    });
  });

  describe('AI Performance Section', () => {
    beforeEach(async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const aiButton = screen.getByRole('button', { name: 'AI Performance' });
      fireEvent.click(aiButton);
    });

    it('should display overall performance section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Overall Performance')).toBeInTheDocument();
      });
    });

    it('should display accuracy metric with bar', async () => {
      await waitFor(() => {
        const labels = screen.getAllByText('Accuracy');
        expect(labels.length).toBeGreaterThan(0);
        expect(screen.getByText('92.0%')).toBeInTheDocument();
      });
    });

    it('should display precision metric with bar', async () => {
      await waitFor(() => {
        const labels = screen.getAllByText('Precision');
        expect(labels.length).toBeGreaterThan(0);
        expect(screen.getByText('89.0%')).toBeInTheDocument();
      });
    });

    it('should display recall metric with bar', async () => {
      await waitFor(() => {
        expect(screen.getByText('Recall')).toBeInTheDocument();
        expect(screen.getByText('87.0%')).toBeInTheDocument();
      });
    });

    it('should display detection categories section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Detection Categories')).toBeInTheDocument();
      });
    });

    it('should display category performance metrics', async () => {
      await waitFor(() => {
        expect(screen.getByText('Hate Speech')).toBeInTheDocument();
        expect(screen.getByText('Spam')).toBeInTheDocument();
        expect(screen.getByText('Harassment')).toBeInTheDocument();
        expect(screen.getByText('Violence')).toBeInTheDocument();
      });
    });

    it('should display category accuracy percentages', async () => {
      await waitFor(() => {
        expect(screen.getByText('95.0%')).toBeInTheDocument();
        expect(screen.getByText('88.0%')).toBeInTheDocument();
        expect(screen.getByText('90.0%')).toBeInTheDocument();
        expect(screen.getByText('93.0%')).toBeInTheDocument();
      });
    });

    it('should display processing stats section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Processing Stats')).toBeInTheDocument();
      });
    });

    it('should display average processing time', async () => {
      await waitFor(() => {
        expect(screen.getByText('Average Processing Time')).toBeInTheDocument();
        expect(screen.getByText('150ms')).toBeInTheDocument();
      });
    });

    it('should display content analyzed count', async () => {
      await waitFor(() => {
        expect(screen.getByText('Content Analyzed')).toBeInTheDocument();
        expect(screen.getByText('5.0K')).toBeInTheDocument();
      });
    });

    it('should display auto-actions taken count', async () => {
      await waitFor(() => {
        expect(screen.getByText('Auto-Actions Taken')).toBeInTheDocument();
        expect(screen.getByText('3.3K')).toBeInTheDocument();
      });
    });
  });

  describe('Moderator Performance Section', () => {
    beforeEach(async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const moderatorButton = screen.getByRole('button', { name: 'Moderator Performance' });
      fireEvent.click(moderatorButton);
    });

    it('should display moderator cards', async () => {
      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
      });
    });

    it('should display moderator roles', async () => {
      await waitFor(() => {
        expect(screen.getByText('Senior Moderator')).toBeInTheDocument();
        expect(screen.getByText('Moderator')).toBeInTheDocument();
      });
    });

    it('should display moderator avatars with first letter', async () => {
      await waitFor(() => {
        const avatars = screen.getAllByClassName('moderator-avatar');
        expect(avatars[0]).toHaveTextContent('J');
        expect(avatars[1]).toHaveTextContent('J');
      });
    });

    it('should display actions taken for moderators', async () => {
      await waitFor(() => {
        const actionLabels = screen.getAllByText('Actions Taken');
        expect(actionLabels).toHaveLength(2);
        expect(screen.getByText('250')).toBeInTheDocument();
        expect(screen.getByText('180')).toBeInTheDocument();
      });
    });

    it('should display reports resolved for moderators', async () => {
      await waitFor(() => {
        const resolvedLabels = screen.getAllByText('Reports Resolved');
        expect(resolvedLabels).toHaveLength(2);
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });

    it('should display avg response time for moderators', async () => {
      await waitFor(() => {
        const timeLabels = screen.getAllByText('Avg Response Time');
        expect(timeLabels).toHaveLength(2);
        expect(screen.getByText('8m')).toBeInTheDocument();
        expect(screen.getByText('10m')).toBeInTheDocument();
      });
    });

    it('should display appeal rates for moderators', async () => {
      await waitFor(() => {
        const appealLabels = screen.getAllByText('Appeal Rate');
        expect(appealLabels).toHaveLength(2);
        expect(screen.getByText('10.0%')).toBeInTheDocument();
        expect(screen.getByText('12.0%')).toBeInTheDocument();
      });
    });

    it('should handle moderator with missing username', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockAnalyticsData.data,
            moderator_performance: [
              { username: null, role: 'Moderator', actions_taken: 100 },
            ],
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const moderatorButton = screen.getByRole('button', { name: 'Moderator Performance' });
      fireEvent.click(moderatorButton);

      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
        const avatar = screen.getByClassName('moderator-avatar');
        expect(avatar).toHaveTextContent('M');
      });
    });
  });

  describe('Number Formatting', () => {
    it('should format numbers in thousands with K suffix', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockAnalyticsData.data,
            summary: {
              ...mockAnalyticsData.data.summary,
              total_reports: 5500,
            },
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('5.5K')).toBeInTheDocument();
      });
    });

    it('should format numbers in millions with M suffix', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockAnalyticsData.data,
            summary: {
              ...mockAnalyticsData.data.summary,
              total_reports: 2500000,
            },
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('2.5M')).toBeInTheDocument();
      });
    });

    it('should format small numbers without suffix', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockAnalyticsData.data,
            summary: {
              ...mockAnalyticsData.data.summary,
              total_reports: 123,
            },
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('123')).toBeInTheDocument();
      });
    });

    it('should handle null or undefined numbers', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            summary: {
              total_reports: null,
            },
            ai_accuracy: {},
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });

  describe('Time Range Labels', () => {
    it('should display correct label for 24h range in reports section', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const select = screen.getByClassName('time-range-select');
      fireEvent.change(select, { target: { value: '24h' } });

      const reportsButton = screen.getByRole('button', { name: 'Reports' });
      fireEvent.click(reportsButton);

      await waitFor(() => {
        expect(screen.getByText('Report Analytics - Last 24 Hours')).toBeInTheDocument();
      });
    });

    it('should display correct label for 30d range in actions section', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const select = screen.getByClassName('time-range-select');
      fireEvent.change(select, { target: { value: '30d' } });

      const actionsButton = screen.getByRole('button', { name: 'Actions' });
      fireEvent.click(actionsButton);

      await waitFor(() => {
        expect(screen.getByText('Moderation Actions - Last 30 Days')).toBeInTheDocument();
      });
    });

    it('should display correct label for 90d range in AI section', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const select = screen.getByClassName('time-range-select');
      fireEvent.change(select, { target: { value: '90d' } });

      const aiButton = screen.getByRole('button', { name: 'AI Performance' });
      fireEvent.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('AI Performance Metrics - Last 90 Days')).toBeInTheDocument();
      });
    });
  });

  describe('CSS Classes and Structure', () => {
    it('should render with correct panel structure', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByClassName('content-panel')).toBeInTheDocument();
      });
    });

    it('should render panel header with correct structure', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByClassName('panel-header')).toBeInTheDocument();
        expect(screen.getByClassName('panel-title')).toBeInTheDocument();
        expect(screen.getByClassName('analytics-controls')).toBeInTheDocument();
      });
    });

    it('should render analytics navigation with correct structure', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByClassName('analytics-navigation')).toBeInTheDocument();
        const navButtons = screen.getAllByClassName('nav-button');
        expect(navButtons).toHaveLength(5);
      });
    });

    it('should render stats grid with correct structure', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByClassName('stats-grid')).toBeInTheDocument();
        const statCards = screen.getAllByClassName('stat-card');
        expect(statCards).toHaveLength(4);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty trends data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockAnalyticsData.data,
            trends: {
              daily_reports: [],
            },
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Reports Over Time')).toBeInTheDocument();
      });
    });

    it('should handle empty action distribution', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockAnalyticsData.data,
            summary: {
              ...mockAnalyticsData.data.summary,
              action_distribution: {},
            },
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Action Distribution')).toBeInTheDocument();
      });
    });

    it('should handle empty top violations', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockAnalyticsData.data,
            top_violations: [],
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const reportsButton = screen.getByRole('button', { name: 'Reports' });
      fireEvent.click(reportsButton);

      await waitFor(() => {
        expect(screen.getByText('Report Categories')).toBeInTheDocument();
      });
    });

    it('should handle empty moderator performance', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockAnalyticsData.data,
            moderator_performance: [],
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const moderatorButton = screen.getByRole('button', { name: 'Moderator Performance' });
      fireEvent.click(moderatorButton);

      await waitFor(() => {
        expect(screen.getByText('Moderator Performance - Last 7 Days')).toBeInTheDocument();
      });
    });

    it('should handle empty category performance', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockAnalyticsData.data,
            ai_accuracy: {
              ...mockAnalyticsData.data.ai_accuracy,
              category_performance: {},
            },
          },
        }),
      });

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Moderation Analytics')).toBeInTheDocument();
      });

      const aiButton = screen.getByRole('button', { name: 'AI Performance' });
      fireEvent.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Detection Categories')).toBeInTheDocument();
      });
    });
  });
});

export default localStorageMock
