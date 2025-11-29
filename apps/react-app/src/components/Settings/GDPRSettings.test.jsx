/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GDPRSettings from './GDPRSettings';
import gdprService from '../../services/gdprService';

jest.mock('../../services/gdprService');

global.alert = jest.fn();

describe('GDPRSettings', () => {
  const mockConsentStatus = {
    analytics: true,
    marketing: false,
    essential: true,
    lastUpdated: '2023-01-01T00:00:00.000Z'
  };

  const mockDataExports = [
    {
      id: 'export-1',
      createdAt: '2023-01-01T00:00:00.000Z',
      status: 'ready',
      format: 'json'
    },
    {
      id: 'export-2',
      createdAt: '2023-01-02T00:00:00.000Z',
      status: 'processing',
      format: 'json'
    }
  ];

  const mockDeletionStatus = {
    pending: true,
    scheduledFor: '2023-02-01T00:00:00.000Z',
    daysRemaining: 25
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert.mockClear();

    gdprService.getConsentStatus.mockResolvedValue(mockConsentStatus);
    gdprService.getDataExports.mockResolvedValue([]);
    gdprService.getDeletionStatus.mockResolvedValue(null);
  });

  describe('Initial Rendering', () => {
    it('renders without crashing', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('GDPR & Privacy Rights')).toBeInTheDocument();
      });
    });

    it('displays main heading and description', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('GDPR & Privacy Rights')).toBeInTheDocument();
        expect(screen.getByText(/Manage your data and privacy rights/i)).toBeInTheDocument();
      });
    });

    it('shows loading state on initial render', () => {
      render(<GDPRSettings />);
      expect(screen.getByText('Loading GDPR settings...')).toBeInTheDocument();
    });

    it('hides loading state after data loads', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.queryByText('Loading GDPR settings...')).not.toBeInTheDocument();
      });
    });

    it('renders all main sections', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Right to Access (Article 15)')).toBeInTheDocument();
        expect(screen.getByText('Transparency & Processing Activities')).toBeInTheDocument();
        expect(screen.getByText('Right to Erasure (Article 17)')).toBeInTheDocument();
      });
    });

    it('loads GDPR data on mount', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(gdprService.getConsentStatus).toHaveBeenCalledTimes(1);
        expect(gdprService.getDataExports).toHaveBeenCalledTimes(1);
        expect(gdprService.getDeletionStatus).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Data Export Section', () => {
    it('displays data export section with correct title', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Right to Access (Article 15)')).toBeInTheDocument();
      });
    });

    it('shows data export description', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText(/Download a copy of all your personal data/i)).toBeInTheDocument();
      });
    });

    it('renders request data export button', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Request Data Export')).toBeInTheDocument();
      });
    });

    it('handles data export request successfully', async () => {
      gdprService.requestDataExport.mockResolvedValue({ success: true });

      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Request Data Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Request Data Export');
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(gdprService.requestDataExport).toHaveBeenCalledWith('json');
        expect(global.alert).toHaveBeenCalledWith(
          'Data export requested! You will receive an email when your data is ready for download.'
        );
      });
    });

    it('handles data export request failure', async () => {
      gdprService.requestDataExport.mockRejectedValue(new Error('Export failed'));

      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Request Data Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Request Data Export');
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to request data export. Please try again.'
        );
      });
    });

    it('disables export button during request', async () => {
      gdprService.requestDataExport.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Request Data Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Request Data Export');
      await userEvent.click(exportButton);

      expect(exportButton).toBeDisabled();
    });

    it('displays list of existing data exports', async () => {
      gdprService.getDataExports.mockResolvedValue(mockDataExports);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Your Exports')).toBeInTheDocument();
      });
    });

    it('shows export status correctly for ready exports', async () => {
      gdprService.getDataExports.mockResolvedValue(mockDataExports);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Ready for download')).toBeInTheDocument();
      });
    });

    it('shows export status correctly for processing exports', async () => {
      gdprService.getDataExports.mockResolvedValue(mockDataExports);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });

    it('displays download button only for ready exports', async () => {
      gdprService.getDataExports.mockResolvedValue(mockDataExports);

      render(<GDPRSettings />);

      await waitFor(() => {
        const downloadButtons = screen.getAllByText('Download');
        expect(downloadButtons).toHaveLength(1);
      });
    });

    it('handles download export successfully', async () => {
      gdprService.getDataExports.mockResolvedValue(mockDataExports);
      gdprService.downloadExportedData.mockResolvedValue(true);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Download')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(gdprService.downloadExportedData).toHaveBeenCalledWith('export-1');
      });
    });

    it('handles download export failure', async () => {
      gdprService.getDataExports.mockResolvedValue(mockDataExports);
      gdprService.downloadExportedData.mockRejectedValue(new Error('Download failed'));

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Download')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to download data export. Please try again.'
        );
      });
    });

    it('does not display export list when no exports exist', async () => {
      gdprService.getDataExports.mockResolvedValue([]);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.queryByText('Your Exports')).not.toBeInTheDocument();
      });
    });
  });

  describe('Privacy Policy Section', () => {
    it('displays transparency section', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Transparency & Processing Activities')).toBeInTheDocument();
      });
    });

    it('shows privacy policy description', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText(/View how your data is being processed/i)).toBeInTheDocument();
      });
    });

    it('renders privacy policy link with correct href', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        const privacyLink = screen.getByText('View Privacy Policy');
        expect(privacyLink).toHaveAttribute('href', '/privacy');
      });
    });
  });

  describe('Account Deletion Section', () => {
    it('displays account deletion section', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Right to Erasure (Article 17)')).toBeInTheDocument();
      });
    });

    it('shows account deletion description', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText(/Request permanent deletion of your account/i)).toBeInTheDocument();
      });
    });

    it('renders delete account button', async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      });
    });

    it('hides delete button when deletion is pending', async () => {
      gdprService.getDeletionStatus.mockResolvedValue(mockDeletionStatus);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.queryByText('Delete My Account')).not.toBeInTheDocument();
      });
    });

    it('opens confirmation modal when delete button clicked', async () => {
      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete My Account');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
      });
    });
  });

  describe('Deletion Confirmation Modal', () => {
    beforeEach(async () => {
      render(<GDPRSettings />);
      await waitFor(() => {
        expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      });
      const deleteButton = screen.getByText('Delete My Account');
      await userEvent.click(deleteButton);
    });

    it('displays modal with correct title', async () => {
      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeInTheDocument();
      });
    });

    it('shows deletion warning message', async () => {
      await waitFor(() => {
        expect(screen.getByText(/This will permanently delete your account after 30 days/i)).toBeInTheDocument();
      });
    });

    it('renders reason textarea', async () => {
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Optional - help us improve')).toBeInTheDocument();
      });
    });

    it('renders password input field', async () => {
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
      });
    });

    it('closes modal when cancel button clicked', async () => {
      const cancelButtons = screen.getAllByText('Cancel');
      await userEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
      });
    });

    it('closes modal when X button clicked', async () => {
      const closeButton = screen.getByRole('button', { name: '' });
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
      });
    });

    it('updates reason field on user input', async () => {
      const reasonField = screen.getByPlaceholderText('Optional - help us improve');
      await userEvent.type(reasonField, 'Test reason');

      expect(reasonField).toHaveValue('Test reason');
    });

    it('updates password field on user input', async () => {
      const passwordField = screen.getByPlaceholderText('Enter password');
      await userEvent.type(passwordField, 'testpassword');

      expect(passwordField).toHaveValue('testpassword');
    });

    it('disables delete button when password is empty', async () => {
      const deleteButtons = screen.getAllByText('Delete Account');
      const modalDeleteButton = deleteButtons[deleteButtons.length - 1];

      expect(modalDeleteButton).toBeDisabled();
    });

    it('enables delete button when password is provided', async () => {
      const passwordField = screen.getByPlaceholderText('Enter password');
      await userEvent.type(passwordField, 'testpassword');

      const deleteButtons = screen.getAllByText('Delete Account');
      const modalDeleteButton = deleteButtons[deleteButtons.length - 1];

      expect(modalDeleteButton).not.toBeDisabled();
    });

    it('shows validation alert when password is missing', async () => {
      const deleteButtons = screen.getAllByText('Delete Account');
      const modalDeleteButton = deleteButtons[deleteButtons.length - 1];

      await userEvent.click(modalDeleteButton);

      expect(global.alert).toHaveBeenCalledWith(
        'Please provide your password and a reason for deletion.'
      );
    });

    it('shows validation alert when reason is missing', async () => {
      const passwordField = screen.getByPlaceholderText('Enter password');
      await userEvent.type(passwordField, 'testpassword');

      const deleteButtons = screen.getAllByText('Delete Account');
      const modalDeleteButton = deleteButtons[deleteButtons.length - 1];

      await userEvent.click(modalDeleteButton);

      expect(global.alert).toHaveBeenCalledWith(
        'Please provide your password and a reason for deletion.'
      );
    });

    it('handles successful deletion request', async () => {
      gdprService.requestAccountDeletion.mockResolvedValue({ success: true });

      const passwordField = screen.getByPlaceholderText('Enter password');
      const reasonField = screen.getByPlaceholderText('Optional - help us improve');

      await userEvent.type(passwordField, 'testpassword');
      await userEvent.type(reasonField, 'Test reason');

      const deleteButtons = screen.getAllByText('Delete Account');
      const modalDeleteButton = deleteButtons[deleteButtons.length - 1];
      await userEvent.click(modalDeleteButton);

      await waitFor(() => {
        expect(gdprService.requestAccountDeletion).toHaveBeenCalledWith(
          'Test reason',
          'testpassword'
        );
        expect(global.alert).toHaveBeenCalledWith(
          'Account deletion requested. You have 30 days to cancel before permanent deletion.'
        );
      });
    });

    it('closes modal after successful deletion request', async () => {
      gdprService.requestAccountDeletion.mockResolvedValue({ success: true });

      const passwordField = screen.getByPlaceholderText('Enter password');
      const reasonField = screen.getByPlaceholderText('Optional - help us improve');

      await userEvent.type(passwordField, 'testpassword');
      await userEvent.type(reasonField, 'Test reason');

      const deleteButtons = screen.getAllByText('Delete Account');
      const modalDeleteButton = deleteButtons[deleteButtons.length - 1];
      await userEvent.click(modalDeleteButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
      });
    });

    it('clears form fields after successful deletion', async () => {
      gdprService.requestAccountDeletion.mockResolvedValue({ success: true });

      const passwordField = screen.getByPlaceholderText('Enter password');
      const reasonField = screen.getByPlaceholderText('Optional - help us improve');

      await userEvent.type(passwordField, 'testpassword');
      await userEvent.type(reasonField, 'Test reason');

      const deleteButtons = screen.getAllByText('Delete Account');
      const modalDeleteButton = deleteButtons[deleteButtons.length - 1];
      await userEvent.click(modalDeleteButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
      });

      const mainDeleteButton = screen.getByText('Delete My Account');
      await userEvent.click(mainDeleteButton);

      await waitFor(() => {
        const newPasswordField = screen.getByPlaceholderText('Enter password');
        const newReasonField = screen.getByPlaceholderText('Optional - help us improve');
        expect(newPasswordField).toHaveValue('');
        expect(newReasonField).toHaveValue('');
      });
    });

    it('handles deletion request failure', async () => {
      gdprService.requestAccountDeletion.mockRejectedValue(new Error('Deletion failed'));

      const passwordField = screen.getByPlaceholderText('Enter password');
      const reasonField = screen.getByPlaceholderText('Optional - help us improve');

      await userEvent.type(passwordField, 'testpassword');
      await userEvent.type(reasonField, 'Test reason');

      const deleteButtons = screen.getAllByText('Delete Account');
      const modalDeleteButton = deleteButtons[deleteButtons.length - 1];
      await userEvent.click(modalDeleteButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to request account deletion. Please check your password and try again.'
        );
      });
    });
  });

  describe('Deletion Pending Status', () => {
    beforeEach(() => {
      gdprService.getDeletionStatus.mockResolvedValue(mockDeletionStatus);
    });

    it('displays deletion warning banner when deletion is pending', async () => {
      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Account Deletion Pending')).toBeInTheDocument();
      });
    });

    it('shows scheduled deletion date', async () => {
      render(<GDPRSettings />);

      await waitFor(() => {
        const scheduledDate = new Date(mockDeletionStatus.scheduledFor).toLocaleDateString();
        expect(screen.getByText(new RegExp(scheduledDate))).toBeInTheDocument();
      });
    });

    it('shows days remaining until deletion', async () => {
      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText(/25 days/i)).toBeInTheDocument();
      });
    });

    it('renders cancel deletion button', async () => {
      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Cancel Deletion')).toBeInTheDocument();
      });
    });

    it('handles cancel deletion successfully', async () => {
      gdprService.cancelAccountDeletion.mockResolvedValue({ success: true });

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Cancel Deletion')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Deletion');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(gdprService.cancelAccountDeletion).toHaveBeenCalledTimes(1);
        expect(global.alert).toHaveBeenCalledWith(
          'Account deletion cancelled successfully!'
        );
      });
    });

    it('handles cancel deletion failure', async () => {
      gdprService.cancelAccountDeletion.mockRejectedValue(new Error('Cancel failed'));

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Cancel Deletion')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Deletion');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to cancel account deletion. Please contact support.'
        );
      });
    });

    it('reloads GDPR data after canceling deletion', async () => {
      gdprService.cancelAccountDeletion.mockResolvedValue({ success: true });

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Cancel Deletion')).toBeInTheDocument();
      });

      const initialCalls = gdprService.getDeletionStatus.mock.calls.length;

      const cancelButton = screen.getByText('Cancel Deletion');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(gdprService.getDeletionStatus).toHaveBeenCalledTimes(initialCalls + 1);
      });
    });
  });

  describe('Loading States', () => {
    it('disables export button during loading', async () => {
      gdprService.requestDataExport.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Request Data Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Request Data Export');
      await userEvent.click(exportButton);

      expect(exportButton).toBeDisabled();
    });

    it('disables cancel deletion button during loading', async () => {
      gdprService.getDeletionStatus.mockResolvedValue(mockDeletionStatus);
      gdprService.cancelAccountDeletion.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Cancel Deletion')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Deletion');
      await userEvent.click(cancelButton);

      expect(cancelButton).toBeDisabled();
    });

    it('reloads data after successful export request', async () => {
      gdprService.requestDataExport.mockResolvedValue({ success: true });

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Request Data Export')).toBeInTheDocument();
      });

      const initialCalls = gdprService.getDataExports.mock.calls.length;

      const exportButton = screen.getByText('Request Data Export');
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(gdprService.getDataExports).toHaveBeenCalledTimes(initialCalls + 1);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles consent status fetch error gracefully', async () => {
      gdprService.getConsentStatus.mockRejectedValue(new Error('Fetch failed'));

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('GDPR & Privacy Rights')).toBeInTheDocument();
      });
    });

    it('handles data exports fetch error gracefully', async () => {
      gdprService.getDataExports.mockRejectedValue(new Error('Fetch failed'));

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('GDPR & Privacy Rights')).toBeInTheDocument();
      });
    });

    it('handles deletion status fetch error gracefully', async () => {
      gdprService.getDeletionStatus.mockRejectedValue(new Error('Fetch failed'));

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('GDPR & Privacy Rights')).toBeInTheDocument();
      });
    });

    it('continues loading when individual fetch fails', async () => {
      gdprService.getConsentStatus.mockRejectedValue(new Error('Failed'));
      gdprService.getDataExports.mockResolvedValue([]);
      gdprService.getDeletionStatus.mockResolvedValue(null);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('GDPR & Privacy Rights')).toBeInTheDocument();
        expect(screen.queryByText('Loading GDPR settings...')).not.toBeInTheDocument();
      });
    });

    it('logs error to console on load failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      gdprService.getConsentStatus.mockRejectedValue(new Error('Test error'));
      gdprService.getDataExports.mockRejectedValue(new Error('Test error'));
      gdprService.getDeletionStatus.mockRejectedValue(new Error('Test error'));

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('API Integration', () => {
    it('calls getConsentStatus API on mount', async () => {
      render(<GDPRSettings />);

      await waitFor(() => {
        expect(gdprService.getConsentStatus).toHaveBeenCalledTimes(1);
      });
    });

    it('calls getDataExports API on mount', async () => {
      render(<GDPRSettings />);

      await waitFor(() => {
        expect(gdprService.getDataExports).toHaveBeenCalledTimes(1);
      });
    });

    it('calls getDeletionStatus API on mount', async () => {
      render(<GDPRSettings />);

      await waitFor(() => {
        expect(gdprService.getDeletionStatus).toHaveBeenCalledTimes(1);
      });
    });

    it('passes correct format to requestDataExport', async () => {
      gdprService.requestDataExport.mockResolvedValue({ success: true });

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Request Data Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Request Data Export');
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(gdprService.requestDataExport).toHaveBeenCalledWith('json');
      });
    });

    it('passes correct export ID to downloadExportedData', async () => {
      gdprService.getDataExports.mockResolvedValue(mockDataExports);
      gdprService.downloadExportedData.mockResolvedValue(true);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Download')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download');
      await userEvent.click(downloadButton);

      await waitFor(() => {
        expect(gdprService.downloadExportedData).toHaveBeenCalledWith('export-1');
      });
    });

    it('passes correct parameters to requestAccountDeletion', async () => {
      gdprService.requestAccountDeletion.mockResolvedValue({ success: true });

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete My Account');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
      });

      const passwordField = screen.getByPlaceholderText('Enter password');
      const reasonField = screen.getByPlaceholderText('Optional - help us improve');

      await userEvent.type(passwordField, 'mypassword');
      await userEvent.type(reasonField, 'My reason');

      const deleteButtons = screen.getAllByText('Delete Account');
      const modalDeleteButton = deleteButtons[deleteButtons.length - 1];
      await userEvent.click(modalDeleteButton);

      await waitFor(() => {
        expect(gdprService.requestAccountDeletion).toHaveBeenCalledWith(
          'My reason',
          'mypassword'
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty data exports array', async () => {
      gdprService.getDataExports.mockResolvedValue([]);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.queryByText('Your Exports')).not.toBeInTheDocument();
      });
    });

    it('handles null consent status', async () => {
      gdprService.getConsentStatus.mockResolvedValue(null);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('GDPR & Privacy Rights')).toBeInTheDocument();
      });
    });

    it('handles null deletion status', async () => {
      gdprService.getDeletionStatus.mockResolvedValue(null);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      });
    });

    it('handles undefined data exports', async () => {
      gdprService.getDataExports.mockResolvedValue(undefined);

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('GDPR & Privacy Rights')).toBeInTheDocument();
      });
    });

    it('renders correctly with all API calls failing', async () => {
      gdprService.getConsentStatus.mockRejectedValue(new Error('Failed'));
      gdprService.getDataExports.mockRejectedValue(new Error('Failed'));
      gdprService.getDeletionStatus.mockRejectedValue(new Error('Failed'));

      render(<GDPRSettings />);

      await waitFor(() => {
        expect(screen.getByText('GDPR & Privacy Rights')).toBeInTheDocument();
      });
    });
  });
});

export default mockConsentStatus
