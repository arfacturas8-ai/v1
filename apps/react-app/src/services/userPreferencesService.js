/**
 * User Preferences Service
 * Handles user settings and preferences
 */

import api from './api.js';

class UserPreferencesService {
  /**
   * Get all user preferences
   */
  async getPreferences() {
    try {
      const response = await api.get('/user-preferences');
      return response;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences) {
    try {
      const response = await api.put('/user-preferences', preferences);

      // Update local cache
      localStorage.setItem('cryb_user_preferences', JSON.stringify(preferences));

      return response;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Update specific preference category
   */
  async updatePreferenceCategory(category, settings) {
    try {
      const response = await api.patch(`/user-preferences/${category}`, settings);

      // Update local cache
      const cached = this.getCachedPreferences();
      if (cached) {
        cached[category] = { ...cached[category], ...settings };
        localStorage.setItem('cryb_user_preferences', JSON.stringify(cached));
      }

      return response;
    } catch (error) {
      console.error(`Error updating ${category} preferences:`, error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {
    try {
      const response = await api.get('/user-preferences/notifications');
      return response;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(settings) {
    return this.updatePreferenceCategory('notifications', settings);
  }

  /**
   * Get privacy preferences
   */
  async getPrivacyPreferences() {
    try {
      const response = await api.get('/user-preferences/privacy');
      return response;
    } catch (error) {
      console.error('Error fetching privacy preferences:', error);
      throw error;
    }
  }

  /**
   * Update privacy preferences
   */
  async updatePrivacyPreferences(settings) {
    return this.updatePreferenceCategory('privacy', settings);
  }

  /**
   * Get appearance preferences
   */
  async getAppearancePreferences() {
    try {
      const response = await api.get('/user-preferences/appearance');
      return response;
    } catch (error) {
      console.error('Error fetching appearance preferences:', error);
      throw error;
    }
  }

  /**
   * Update appearance preferences
   */
  async updateAppearancePreferences(settings) {
    return this.updatePreferenceCategory('appearance', settings);
  }

  /**
   * Get language preferences
   */
  async getLanguagePreferences() {
    try {
      const response = await api.get('/user-preferences/language');
      return response;
    } catch (error) {
      console.error('Error fetching language preferences:', error);
      throw error;
    }
  }

  /**
   * Update language preferences
   */
  async updateLanguagePreferences(language, timezone) {
    return this.updatePreferenceCategory('language', { language, timezone });
  }

  /**
   * Get content preferences (feed algorithm, filters, etc.)
   */
  async getContentPreferences() {
    try {
      const response = await api.get('/user-preferences/content');
      return response;
    } catch (error) {
      console.error('Error fetching content preferences:', error);
      throw error;
    }
  }

  /**
   * Update content preferences
   */
  async updateContentPreferences(settings) {
    return this.updatePreferenceCategory('content', settings);
  }

  /**
   * Get accessibility preferences
   */
  async getAccessibilityPreferences() {
    try {
      const response = await api.get('/user-preferences/accessibility');
      return response;
    } catch (error) {
      console.error('Error fetching accessibility preferences:', error);
      throw error;
    }
  }

  /**
   * Update accessibility preferences
   */
  async updateAccessibilityPreferences(settings) {
    return this.updatePreferenceCategory('accessibility', settings);
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(category = 'all') {
    try {
      const response = await api.post('/user-preferences/reset', {
        category
      });

      // Clear local cache
      localStorage.removeItem('cryb_user_preferences');

      return response;
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  }

  /**
   * Export preferences
   */
  async exportPreferences() {
    try {
      const preferences = await this.getPreferences();

      const dataStr = JSON.stringify(preferences, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cryb-preferences-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error exporting preferences:', error);
      throw error;
    }
  }

  /**
   * Import preferences
   */
  async importPreferences(preferencesFile) {
    try {
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const preferences = JSON.parse(e.target.result);
            const response = await this.updatePreferences(preferences);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsText(preferencesFile);
      });
    } catch (error) {
      console.error('Error importing preferences:', error);
      throw error;
    }
  }

  /**
   * Get cached preferences (local storage)
   */
  getCachedPreferences() {
    try {
      const cached = localStorage.getItem('cryb_user_preferences');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading cached preferences:', error);
      return null;
    }
  }

  /**
   * Sync preferences with server
   */
  async syncPreferences() {
    try {
      const serverPrefs = await this.getPreferences();
      localStorage.setItem('cryb_user_preferences', JSON.stringify(serverPrefs));
      return serverPrefs;
    } catch (error) {
      console.error('Error syncing preferences:', error);
      throw error;
    }
  }
}

export default new UserPreferencesService();
