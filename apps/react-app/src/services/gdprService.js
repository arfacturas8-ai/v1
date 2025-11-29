/**
 * GDPR Compliance Service
 * Handles data export, deletion, consent management
 */

import api from './api.js';

class GDPRService {
  /**
   * Get user's GDPR consent status
   */
  async getConsentStatus() {
    try {
      const response = await api.get('/gdpr/consent');
      return response;
    } catch (error) {
      console.error('Error fetching consent status:', error);
      throw error;
    }
  }

  /**
   * Update user's GDPR consent
   */
  async updateConsent(consentData) {
    try {
      const response = await api.post('/gdpr/consent', consentData);
      return response;
    } catch (error) {
      console.error('Error updating consent:', error);
      throw error;
    }
  }

  /**
   * Request data export (GDPR Article 15 - Right to Access)
   */
  async requestDataExport(format = 'json') {
    try {
      const response = await api.post('/gdpr/export', { format });
      return response;
    } catch (error) {
      console.error('Error requesting data export:', error);
      throw error;
    }
  }

  /**
   * Download exported data
   */
  async downloadExportedData(exportId) {
    try {
      const response = await api.get(`/gdpr/export/${exportId}/download`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cryb-data-export-${exportId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (error) {
      console.error('Error downloading data export:', error);
      throw error;
    }
  }

  /**
   * Get list of data exports
   */
  async getDataExports() {
    try {
      const response = await api.get('/gdpr/exports');
      return response;
    } catch (error) {
      console.error('Error fetching data exports:', error);
      throw error;
    }
  }

  /**
   * Request account deletion (GDPR Article 17 - Right to Erasure)
   */
  async requestAccountDeletion(reason, password) {
    try {
      const response = await api.post('/gdpr/delete-account', {
        reason,
        password,
        confirmDeletion: true
      });
      return response;
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  }

  /**
   * Cancel pending account deletion
   */
  async cancelAccountDeletion() {
    try {
      const response = await api.post('/gdpr/cancel-deletion');
      return response;
    } catch (error) {
      console.error('Error canceling account deletion:', error);
      throw error;
    }
  }

  /**
   * Get account deletion status
   */
  async getDeletionStatus() {
    try {
      const response = await api.get('/gdpr/deletion-status');
      return response;
    } catch (error) {
      console.error('Error fetching deletion status:', error);
      throw error;
    }
  }

  /**
   * Request data portability (GDPR Article 20)
   */
  async requestDataPortability(destinationService) {
    try {
      const response = await api.post('/gdpr/portability', {
        destination: destinationService
      });
      return response;
    } catch (error) {
      console.error('Error requesting data portability:', error);
      throw error;
    }
  }

  /**
   * Get processing activities (transparency)
   */
  async getProcessingActivities() {
    try {
      const response = await api.get('/gdpr/processing-activities');
      return response;
    } catch (error) {
      console.error('Error fetching processing activities:', error);
      throw error;
    }
  }

  /**
   * Object to processing (GDPR Article 21)
   */
  async objectToProcessing(processingType, reason) {
    try {
      const response = await api.post('/gdpr/object-processing', {
        processingType,
        reason
      });
      return response;
    } catch (error) {
      console.error('Error objecting to processing:', error);
      throw error;
    }
  }

  /**
   * Request data rectification (GDPR Article 16)
   */
  async requestDataRectification(corrections) {
    try {
      const response = await api.post('/gdpr/rectification', {
        corrections
      });
      return response;
    } catch (error) {
      console.error('Error requesting data rectification:', error);
      throw error;
    }
  }

  /**
   * Withdraw consent for specific processing
   */
  async withdrawConsent(processingType) {
    try {
      const response = await api.post('/gdpr/withdraw-consent', {
        processingType
      });
      return response;
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      throw error;
    }
  }

  /**
   * Get privacy policy and terms
   */
  async getPrivacyPolicy() {
    try {
      const response = await api.get('/gdpr/privacy-policy');
      return response;
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
      throw error;
    }
  }

  /**
   * Get user's data processing history
   */
  async getDataProcessingHistory(page = 1, limit = 20) {
    try {
      const response = await api.get('/gdpr/processing-history', {
        params: { page, limit }
      });
      return response;
    } catch (error) {
      console.error('Error fetching processing history:', error);
      throw error;
    }
  }
}

export default new GDPRService();
