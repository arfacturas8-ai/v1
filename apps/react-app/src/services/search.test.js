/**
 * Tests for search service
 */
import searchService from './search';
import apiService from './api';

jest.mock('./api');

describe('searchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchService.clearCache();
  });

  describe('search', () => {
    it('returns empty results for empty query', async () => {
      const result = await searchService.search('');
      expect(result).toEqual({ results: [] });
      expect(apiService.get).not.toHaveBeenCalled();
    });

    it('returns empty results for whitespace query', async () => {
      const result = await searchService.search('   ');
      expect(result).toEqual({ results: [] });
      expect(apiService.get).not.toHaveBeenCalled();
    });

    it('performs basic search', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, type: 'post', title: 'Test Post' },
            { id: 2, type: 'user', username: 'testuser' }
          ],
          total: 2,
          hasMore: false,
          suggestions: []
        }
      };
      apiService.get.mockResolvedValue(mockResponse);

      const result = await searchService.search('test');

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/search'));
      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('q=test'));
      expect(result.results).toEqual(mockResponse.data.results);
      expect(result.total).toBe(2);
    });

    it('applies limit and offset options', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.search('test', { limit: 20, offset: 10 });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('limit=20');
      expect(callArg).toContain('offset=10');
    });

    it('applies type filter', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.search('test', { type: 'posts' });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('type=posts');
    });

    it('applies sort option', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.search('test', { sort: 'popular' });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('sort=popular');
    });

    it('uses cached results', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, title: 'Cached' }],
          total: 1,
          hasMore: false,
          suggestions: []
        }
      };
      apiService.get.mockResolvedValue(mockResponse);

      await searchService.search('test');
      await searchService.search('test');

      expect(apiService.get).toHaveBeenCalledTimes(1);
    });

    it('caches different queries separately', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.search('test1');
      await searchService.search('test2');

      expect(apiService.get).toHaveBeenCalledTimes(2);
    });

    it('caches different options separately', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.search('test', { type: 'posts' });
      await searchService.search('test', { type: 'users' });

      expect(apiService.get).toHaveBeenCalledTimes(2);
    });

    it('handles search errors gracefully', async () => {
      apiService.get.mockRejectedValue(new Error('Search failed'));

      const result = await searchService.search('test');

      expect(result).toEqual({
        results: [],
        total: 0,
        hasMore: false,
        suggestions: []
      });
    });

    it('handles missing data in response', async () => {
      apiService.get.mockResolvedValue({ data: null });

      const result = await searchService.search('test');

      expect(result).toEqual({ results: [] });
    });

    it('trims search query', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.search('  test  ');

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('q=test');
    });
  });

  describe('searchPosts', () => {
    it('searches for posts', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.searchPosts('test');

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('type=posts');
    });

    it('merges options with type', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.searchPosts('test', { limit: 15 });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('type=posts');
      expect(callArg).toContain('limit=15');
    });
  });

  describe('searchUsers', () => {
    it('searches for users', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.searchUsers('john');

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('type=users');
    });
  });

  describe('searchCommunities', () => {
    it('searches for communities', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.searchCommunities('tech');

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('type=communities');
    });
  });

  describe('searchComments', () => {
    it('searches for comments', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.searchComments('comment');

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('type=comments');
    });
  });

  describe('getTrendingSearches', () => {
    it('fetches trending searches', async () => {
      const mockTrends = ['javascript', 'react', 'nodejs'];
      apiService.get.mockResolvedValue({
        data: { trends: mockTrends }
      });

      const result = await searchService.getTrendingSearches();

      expect(apiService.get).toHaveBeenCalledWith('/search/trending');
      expect(result).toEqual(mockTrends);
    });

    it('handles errors gracefully', async () => {
      apiService.get.mockRejectedValue(new Error('Failed'));

      const result = await searchService.getTrendingSearches();

      expect(result).toEqual([]);
    });

    it('handles missing data', async () => {
      apiService.get.mockResolvedValue({ data: null });

      const result = await searchService.getTrendingSearches();

      expect(result).toEqual([]);
    });
  });

  describe('getSuggestions', () => {
    it('fetches search suggestions', async () => {
      const mockSuggestions = ['test1', 'test2', 'test3'];
      apiService.get.mockResolvedValue({
        data: { suggestions: mockSuggestions }
      });

      const result = await searchService.getSuggestions('tes');

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/search/suggestions'));
      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('q=tes'));
      expect(result).toEqual(mockSuggestions);
    });

    it('returns empty array for empty query', async () => {
      const result = await searchService.getSuggestions('');

      expect(apiService.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('returns empty array for whitespace query', async () => {
      const result = await searchService.getSuggestions('   ');

      expect(apiService.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('handles errors gracefully', async () => {
      apiService.get.mockRejectedValue(new Error('Failed'));

      const result = await searchService.getSuggestions('test');

      expect(result).toEqual([]);
    });

    it('encodes query parameter', async () => {
      apiService.get.mockResolvedValue({ data: { suggestions: [] } });

      await searchService.getSuggestions('test query');

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('q=test%20query');
    });
  });

  describe('advancedSearch', () => {
    it('performs advanced search with filters', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1 }],
          total: 1,
          hasMore: false,
          facets: { category: { tech: 5 } }
        }
      };
      apiService.post.mockResolvedValue(mockResponse);

      const filters = {
        query: 'test',
        category: 'tech',
        dateFrom: '2024-01-01'
      };
      const result = await searchService.advancedSearch(filters);

      expect(apiService.post).toHaveBeenCalledWith(
        '/search/advanced',
        expect.any(URLSearchParams)
      );
      expect(result.results).toEqual(mockResponse.data.results);
      expect(result.facets).toEqual(mockResponse.data.facets);
    });

    it('handles array filter values', async () => {
      apiService.post.mockResolvedValue({ data: { results: [] } });

      await searchService.advancedSearch({
        tags: ['tag1', 'tag2', 'tag3']
      });

      const params = apiService.post.mock.calls[0][1];
      expect(params.getAll('tags')).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('skips null and undefined values', async () => {
      apiService.post.mockResolvedValue({ data: { results: [] } });

      await searchService.advancedSearch({
        query: 'test',
        category: null,
        tags: undefined,
        author: ''
      });

      const params = apiService.post.mock.calls[0][1];
      expect(params.has('category')).toBe(false);
      expect(params.has('tags')).toBe(false);
      expect(params.has('author')).toBe(false);
    });

    it('converts values to strings', async () => {
      apiService.post.mockResolvedValue({ data: { results: [] } });

      await searchService.advancedSearch({
        limit: 20,
        verified: true
      });

      const params = apiService.post.mock.calls[0][1];
      expect(params.get('limit')).toBe('20');
      expect(params.get('verified')).toBe('true');
    });

    it('handles errors gracefully', async () => {
      apiService.post.mockRejectedValue(new Error('Search failed'));

      const result = await searchService.advancedSearch({ query: 'test' });

      expect(result).toEqual({
        results: [],
        total: 0,
        hasMore: false,
        facets: {}
      });
    });

    it('handles missing data in response', async () => {
      apiService.post.mockResolvedValue({ data: null });

      const result = await searchService.advancedSearch({ query: 'test' });

      expect(result).toEqual({
        results: [],
        total: 0,
        hasMore: false,
        facets: {}
      });
    });
  });

  describe('Search History', () => {
    describe('addToSearchHistory', () => {
      it('adds query to search history', async () => {
        apiService.post.mockResolvedValue({ success: true });

        await searchService.addToSearchHistory('test query');

        expect(apiService.post).toHaveBeenCalledWith(
          '/search/history',
          { query: 'test query' }
        );
      });

      it('ignores empty queries', async () => {
        await searchService.addToSearchHistory('');

        expect(apiService.post).not.toHaveBeenCalled();
      });

      it('ignores whitespace queries', async () => {
        await searchService.addToSearchHistory('   ');

        expect(apiService.post).not.toHaveBeenCalled();
      });

      it('handles errors silently', async () => {
        apiService.post.mockRejectedValue(new Error('Failed'));

        await expect(
          searchService.addToSearchHistory('test')
        ).resolves.not.toThrow();
      });
    });

    describe('getSearchHistory', () => {
      it('fetches search history', async () => {
        const mockHistory = [
          { query: 'test1', timestamp: '2024-01-01' },
          { query: 'test2', timestamp: '2024-01-02' }
        ];
        apiService.get.mockResolvedValue({
          data: { history: mockHistory }
        });

        const result = await searchService.getSearchHistory();

        expect(apiService.get).toHaveBeenCalledWith('/search/history');
        expect(result).toEqual(mockHistory);
      });

      it('handles errors gracefully', async () => {
        apiService.get.mockRejectedValue(new Error('Failed'));

        const result = await searchService.getSearchHistory();

        expect(result).toEqual([]);
      });

      it('handles missing data', async () => {
        apiService.get.mockResolvedValue({ data: null });

        const result = await searchService.getSearchHistory();

        expect(result).toEqual([]);
      });
    });

    describe('clearSearchHistory', () => {
      it('clears search history successfully', async () => {
        apiService.delete.mockResolvedValue({ success: true });

        const result = await searchService.clearSearchHistory();

        expect(apiService.delete).toHaveBeenCalledWith('/search/history');
        expect(result).toBe(true);
      });

      it('returns false on error', async () => {
        apiService.delete.mockRejectedValue(new Error('Failed'));

        const result = await searchService.clearSearchHistory();

        expect(result).toBe(false);
      });
    });
  });

  describe('Cache Management', () => {
    it('caches search results', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1 }],
          total: 1,
          hasMore: false,
          suggestions: []
        }
      };
      apiService.get.mockResolvedValue(mockResponse);

      await searchService.search('test');
      const cached = searchService.getCachedResult('test:{}');

      expect(cached).toBeTruthy();
      expect(cached.results).toEqual(mockResponse.data.results);
    });

    it('respects cache timeout', async () => {
      jest.useFakeTimers();
      apiService.get.mockResolvedValue({ data: { results: [] } });

      await searchService.search('test');

      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes

      await searchService.search('test');

      expect(apiService.get).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });

    it('cleans old cache entries when exceeding limit', async () => {
      apiService.get.mockResolvedValue({ data: { results: [] } });

      // Add 101 different searches to exceed 100 limit
      for (let i = 0; i < 101; i++) {
        await searchService.search(`query${i}`);
      }

      expect(searchService.cache.size).toBeLessThanOrEqual(100);
    });

    it('clears cache manually', () => {
      searchService.setCachedResult('test', { data: 'value' });
      expect(searchService.cache.size).toBeGreaterThan(0);

      searchService.clearCache();

      expect(searchService.cache.size).toBe(0);
    });

    it('returns null for expired cache', () => {
      jest.useFakeTimers();

      searchService.setCachedResult('test', { data: 'value' });

      jest.advanceTimersByTime(6 * 60 * 1000);

      const result = searchService.getCachedResult('test');
      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('returns null for non-existent cache key', () => {
      const result = searchService.getCachedResult('nonexistent');
      expect(result).toBeNull();
    });
  });
});
