/**
 * NFT Service
 * Manages NFT marketplace operations
 */

import api from './api';

class NFTService {
  /**
   * Get NFT marketplace listings
   * @param {Object} filters - Filter options (category, priceMin, priceMax, etc.)
   */
  async getListings(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/nft-marketplace/listings?${params}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch NFT listings:', error);
      return { success: false, data: { items: [] } };
    }
  }

  /**
   * Get single NFT listing details
   * @param {String} listingId - Listing ID
   */
  async getListing(listingId) {
    try {
      const response = await api.get(`/nft-marketplace/listings/${listingId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch NFT listing:', error);
      throw error;
    }
  }

  /**
   * Create new NFT listing
   * @param {Object} listingData - Listing details
   */
  async createListing(listingData) {
    try {
      const response = await api.post('/nft-marketplace/listings', listingData);
      return response;
    } catch (error) {
      console.error('Failed to create NFT listing:', error);
      throw error;
    }
  }

  /**
   * Update NFT listing
   * @param {String} listingId - Listing ID
   * @param {Object} updates - Fields to update
   */
  async updateListing(listingId, updates) {
    try {
      const response = await api.patch(`/nft-marketplace/listings/${listingId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update NFT listing:', error);
      throw error;
    }
  }

  /**
   * Delete NFT listing
   * @param {String} listingId - Listing ID
   */
  async deleteListing(listingId) {
    try {
      const response = await api.delete(`/nft-marketplace/listings/${listingId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete NFT listing:', error);
      throw error;
    }
  }

  /**
   * Purchase an NFT
   * @param {String} listingId - Listing ID
   * @param {String} paymentToken - Payment token (ETH, USDC, etc.)
   * @param {String} txHash - Transaction hash from blockchain
   */
  async purchaseNFT(listingId, paymentToken, txHash) {
    try {
      const response = await api.post(`/nft-marketplace/listings/${listingId}/purchase`, {
        paymentToken,
        transactionHash: txHash
      });
      return response;
    } catch (error) {
      console.error('Failed to purchase NFT:', error);
      throw error;
    }
  }

  /**
   * Get user's NFT collection
   */
  async getMyNFTs() {
    try {
      const response = await api.get('/nft-marketplace/my-nfts');
      return response;
    } catch (error) {
      console.error('Failed to fetch my NFTs:', error);
      return { success: false, data: { items: [] } };
    }
  }

  /**
   * Get user's NFT sales history
   */
  async getSalesHistory() {
    try {
      const response = await api.get('/nft-marketplace/sales');
      return response;
    } catch (error) {
      console.error('Failed to fetch sales history:', error);
      return { success: false, data: { items: [] } };
    }
  }

  /**
   * Get NFT categories
   */
  getCategories() {
    return [
      { id: 'profile-pics', name: 'Profile Pictures', icon: '🖼️' },
      { id: 'art', name: 'Digital Art', icon: '🎨' },
      { id: 'collectibles', name: 'Collectibles', icon: '🏆' },
      { id: 'badges', name: 'Badges', icon: '🏅' },
      { id: 'memberships', name: 'Memberships', icon: '🎫' },
      { id: 'other', name: 'Other', icon: '📦' }
    ];
  }

  /**
   * Verify NFT ownership on blockchain
   * @param {String} contractAddress - NFT contract address
   * @param {String} tokenId - Token ID
   * @param {String} ownerAddress - Expected owner address
   */
  async verifyOwnership(contractAddress, tokenId, ownerAddress) {
    try {
      const response = await api.post('/nft-marketplace/verify-ownership', {
        contractAddress,
        tokenId,
        ownerAddress
      });
      return response;
    } catch (error) {
      console.error('Failed to verify NFT ownership:', error);
      throw error;
    }
  }
}

export default new NFTService();
