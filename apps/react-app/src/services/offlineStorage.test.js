/**
 * Tests for offlineStorage
 */
import offlineStorage from './offlineStorage';

// Mock IndexedDB
const mockIndexedDB = {
  databases: {},
  open: jest.fn(),
  deleteDatabase: jest.fn()
};

const createMockDB = () => {
  const stores = {
    posts: [],
    communities: [],
    users: [],
    comments: [],
    metadata: []
  };

  return {
    objectStoreNames: {
      contains: (name) => ['posts', 'communities', 'users', 'comments', 'metadata'].includes(name)
    },
    transaction: jest.fn((storeNames, mode) => {
      const transaction = {
        objectStore: jest.fn((storeName) => {
          return {
            put: jest.fn((data) => {
              stores[storeName].push(data);
              return { onsuccess: null, onerror: null };
            }),
            get: jest.fn((id) => {
              const result = stores[storeName].find(item => item.id === id);
              return {
                onsuccess: null,
                onerror: null,
                result
              };
            }),
            getAll: jest.fn(() => {
              return {
                onsuccess: null,
                onerror: null,
                result: stores[storeName]
              };
            }),
            clear: jest.fn(() => {
              stores[storeName] = [];
              return { onsuccess: null, onerror: null };
            }),
            count: jest.fn(() => {
              return {
                onsuccess: null,
                onerror: null,
                result: stores[storeName].length
              };
            }),
            createIndex: jest.fn(),
            index: jest.fn((indexName) => ({
              getAll: jest.fn((value) => {
                const filtered = stores[storeName].filter(item => item[indexName] === value);
                return {
                  onsuccess: null,
                  onerror: null,
                  result: filtered
                };
              })
            }))
          };
        }),
        oncomplete: null,
        onerror: null
      };

      // Trigger transaction complete synchronously
      Promise.resolve().then(() => {
        if (transaction.oncomplete) transaction.oncomplete();
      });

      return transaction;
    }),
    createObjectStore: jest.fn((name, options) => {
      return {
        createIndex: jest.fn()
      };
    })
  };
};

global.indexedDB = mockIndexedDB;

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true
});

describe('offlineStorage', () => {
  let mockDB;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDB = createMockDB();

    mockIndexedDB.open.mockImplementation(() => {
      const request = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDB
      };

      Promise.resolve().then(() => {
        if (request.onsuccess) request.onsuccess({ target: { result: mockDB } });
      });

      return request;
    });

    // Reset the service
    offlineStorage.db = null;
  });

  describe('Initialization', () => {
    it('initializes successfully', async () => {
      const result = await offlineStorage.init();
      expect(result).toBe(true);
      expect(mockIndexedDB.open).toHaveBeenCalledWith('cryb_offline_db', 1);
    });

    it('checks if IndexedDB is supported', () => {
      expect(offlineStorage.isSupported).toBe(true);
    });

    it('returns false when IndexedDB not supported', async () => {
      offlineStorage.isSupported = false;
      const result = await offlineStorage.init();
      expect(result).toBe(false);
      offlineStorage.isSupported = true;
    });

    it('handles initialization errors', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = {
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
          error: new Error('IndexedDB error')
        };

        Promise.resolve().then(() => {
          if (request.onerror) request.onerror();
        });

        return request;
      });

      await expect(offlineStorage.init()).rejects.toThrow();
    });
  });

  describe('Posts Management', () => {
    beforeEach(async () => {
      await offlineStorage.init();
    });

    it('saves single post', async () => {
      const post = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        communityName: 'technology'
      };

      const result = await offlineStorage.savePost(post);
      expect(result).toBe(true);
    });

    it('saves multiple posts', async () => {
      const posts = [
        { id: 'post-1', title: 'Post 1', communityName: 'tech' },
        { id: 'post-2', title: 'Post 2', communityName: 'gaming' }
      ];

      const result = await offlineStorage.savePosts(posts);
      expect(result).toBe(true);
    });

    it('adds cache timestamp when saving posts', async () => {
      const post = { id: 'post-1', title: 'Test' };
      const beforeTime = Date.now();

      await offlineStorage.savePost(post);

      const afterTime = Date.now();
      const store = mockDB.transaction(['posts'], 'readwrite').objectStore('posts');
      expect(store.put).toHaveBeenCalled();
      const savedPost = store.put.mock.calls[0][0];
      expect(savedPost._cachedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(savedPost._cachedAt).toBeLessThanOrEqual(afterTime);
    });

    it('gets all posts', async () => {
      await offlineStorage.savePosts([
        { id: 'post-1', title: 'Post 1' },
        { id: 'post-2', title: 'Post 2' }
      ]);

      const posts = await offlineStorage.getPosts();
      expect(Array.isArray(posts)).toBe(true);
    });

    it('gets posts by community', async () => {
      await offlineStorage.savePosts([
        { id: 'post-1', communityName: 'tech' },
        { id: 'post-2', communityName: 'gaming' }
      ]);

      const posts = await offlineStorage.getPosts({ communityName: 'tech' });
      expect(Array.isArray(posts)).toBe(true);
    });

    it('limits number of posts returned', async () => {
      await offlineStorage.savePosts([
        { id: 'post-1' },
        { id: 'post-2' },
        { id: 'post-3' }
      ]);

      const posts = await offlineStorage.getPosts({ limit: 2 });
      expect(posts.length).toBeLessThanOrEqual(2);
    });

    it('gets single post by ID', async () => {
      const post = { id: 'post-1', title: 'Test Post' };
      await offlineStorage.savePost(post);

      const retrieved = await offlineStorage.getPost('post-1');
      expect(retrieved).toBeDefined();
    });

    it('returns null for non-existent post', async () => {
      const result = await offlineStorage.getPost('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Communities Management', () => {
    beforeEach(async () => {
      await offlineStorage.init();
    });

    it('saves communities', async () => {
      const communities = [
        { id: 'comm-1', name: 'technology', displayName: 'Technology' },
        { id: 'comm-2', name: 'gaming', displayName: 'Gaming' }
      ];

      const result = await offlineStorage.saveCommunities(communities);
      expect(result).toBe(true);
    });

    it('adds cache timestamp when saving communities', async () => {
      const community = { id: 'comm-1', name: 'tech' };
      const beforeTime = Date.now();

      await offlineStorage.saveCommunities([community]);

      const afterTime = Date.now();
      const store = mockDB.transaction(['communities'], 'readwrite').objectStore('communities');
      expect(store.put).toHaveBeenCalled();
      const savedComm = store.put.mock.calls[0][0];
      expect(savedComm._cachedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(savedComm._cachedAt).toBeLessThanOrEqual(afterTime);
    });

    it('gets all communities', async () => {
      await offlineStorage.saveCommunities([
        { id: 'comm-1', name: 'tech' },
        { id: 'comm-2', name: 'gaming' }
      ]);

      const communities = await offlineStorage.getCommunities();
      expect(Array.isArray(communities)).toBe(true);
    });

    it('returns empty array when no communities saved', async () => {
      const communities = await offlineStorage.getCommunities();
      expect(communities).toEqual([]);
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      await offlineStorage.init();
    });

    it('clears all offline data', async () => {
      await offlineStorage.savePosts([{ id: 'post-1' }]);
      await offlineStorage.saveCommunities([{ id: 'comm-1' }]);

      const result = await offlineStorage.clearAll();
      expect(result).toBe(true);
    });

    it('gets cache statistics', async () => {
      await offlineStorage.savePosts([
        { id: 'post-1' },
        { id: 'post-2' }
      ]);

      await offlineStorage.saveCommunities([
        { id: 'comm-1' }
      ]);

      const stats = await offlineStorage.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.posts).toBe('number');
      expect(typeof stats.communities).toBe('number');
      expect(typeof stats.users).toBe('number');
      expect(typeof stats.comments).toBe('number');
    });

    it('returns empty stats when not initialized', async () => {
      offlineStorage.db = null;
      const stats = await offlineStorage.getStats();
      expect(stats).toEqual({});
    });
  });

  describe('Offline Detection', () => {
    it('detects online status', () => {
      navigator.onLine = true;
      expect(offlineStorage.isOffline()).toBe(false);
    });

    it('detects offline status', () => {
      navigator.onLine = false;
      expect(offlineStorage.isOffline()).toBe(true);
    });

    it('returns correct online status', () => {
      navigator.onLine = true;
      expect(offlineStorage.isOffline()).toBe(false);

      navigator.onLine = false;
      expect(offlineStorage.isOffline()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles save errors gracefully', async () => {
      await offlineStorage.init();

      mockDB.transaction = jest.fn(() => {
        const transaction = {
          objectStore: jest.fn(() => ({
            put: jest.fn()
          })),
          oncomplete: null,
          onerror: null,
          error: new Error('Transaction failed')
        };

        Promise.resolve().then(() => {
          if (transaction.onerror) transaction.onerror();
        });

        return transaction;
      });

      await expect(offlineStorage.savePosts([{ id: 'post-1' }])).rejects.toThrow();
    });

    it('handles get errors gracefully', async () => {
      await offlineStorage.init();

      mockDB.transaction = jest.fn(() => {
        const transaction = {
          objectStore: jest.fn(() => ({
            getAll: jest.fn(() => ({
              onsuccess: null,
              onerror: null,
              error: new Error('Get failed')
            }))
          })),
          oncomplete: null,
          onerror: null
        };

        const request = transaction.objectStore().getAll();
        Promise.resolve().then(() => {
          if (request.onerror) request.onerror();
        });

        return transaction;
      });

      await expect(offlineStorage.getPosts()).rejects.toThrow();
    });

    it('returns false when saving without initialization', async () => {
      offlineStorage.db = null;
      offlineStorage.isSupported = false;

      const result = await offlineStorage.savePosts([{ id: 'post-1' }]);
      expect(result).toBe(false);

      offlineStorage.isSupported = true;
    });

    it('returns empty array when getting without initialization', async () => {
      offlineStorage.db = null;
      offlineStorage.isSupported = false;

      const result = await offlineStorage.getPosts();
      expect(result).toEqual([]);

      offlineStorage.isSupported = true;
    });
  });
});
