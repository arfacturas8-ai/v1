/**
 * Search Service for CRYB Platform
 * Handles search functionality across posts, users, and communities
 */
import apiService from './api'

class SearchService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  // Unified search across all content types
  async search(query, options = {}) {
    if (!query.trim()) {
      return { results: [] }
    }

    const cacheKey = `${query}:${JSON.stringify(options)}`
    const cached = this.getCachedResult(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: options.limit || '10',
        offset: options.offset || '0',
        ...(options.type && { type: options.type }),
        ...(options.sort && { sort: options.sort })
      })

      const response = await apiService.get(`/search?${params.toString()}`)
      
      if (response.data) {
        const result = {
          results: response.data.results || [],
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false,
          suggestions: response.data.suggestions || []
        }
        
        this.setCachedResult(cacheKey, result)
        return result
      }

      return { results: [] }
    } catch (error) {
      console.error('Search error:', error)
      // Return empty results on error
      return { 
        results: [],
        total: 0,
        hasMore: false,
        suggestions: []
      }
    }
  }

  // Search specific content types
  async searchPosts(query, options = {}) {
    return this.search(query, { ...options, type: 'posts' })
  }

  async searchUsers(query, options = {}) {
    return this.search(query, { ...options, type: 'users' })
  }

  async searchCommunities(query, options = {}) {
    return this.search(query, { ...options, type: 'communities' })
  }

  async searchComments(query, options = {}) {
    return this.search(query, { ...options, type: 'comments' })
  }

  // Get trending searches
  async getTrendingSearches() {
    try {
      const response = await apiService.get('/search/trending')
      return response.data?.trends || []
    } catch (error) {
      console.error('Failed to get trending searches:', error)
      return []
    }
  }

  // Get search suggestions
  async getSuggestions(query) {
    if (!query.trim()) return []

    try {
      const response = await apiService.get(`/search/suggestions?q=${encodeURIComponent(query)}`)
      return response.data?.suggestions || []
    } catch (error) {
      console.error('Failed to get search suggestions:', error)
      return []
    }
  }

  // Advanced search with filters
  async advancedSearch(filters) {
    try {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v))
          } else {
            params.append(key, String(value))
          }
        }
      })

      const response = await apiService.post('/search/advanced', params)
      
      if (response.data) {
        return {
          results: response.data.results || [],
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false,
          facets: response.data.facets || {}
        }
      }

      return { results: [], total: 0, hasMore: false, facets: {} }
    } catch (error) {
      console.error('Advanced search error:', error)
      return { results: [], total: 0, hasMore: false, facets: {} }
    }
  }

  // Search history management
  async addToSearchHistory(query) {
    if (!query.trim()) return

    try {
      await apiService.post('/search/history', { query })
    } catch (error) {
      console.error('Failed to add to search history:', error)
    }
  }

  async getSearchHistory() {
    try {
      const response = await apiService.get('/search/history')
      return response.data?.history || []
    } catch (error) {
      console.error('Failed to get search history:', error)
      return []
    }
  }

  async clearSearchHistory() {
    try {
      await apiService.delete('/search/history')
      return true
    } catch (error) {
      console.error('Failed to clear search history:', error)
      return false
    }
  }

  // Cache management
  getCachedResult(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  setCachedResult(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    // Clean old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
  }

  clearCache() {
    this.cache.clear()
  }
}

export default new SearchService()