/**
 * Mock API Service for testing
 */
export const mockApiService = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn()
};

/**
 * Reset all API mocks
 */
export const resetApiMocks = () => {
  Object.values(mockApiService).forEach(mock => mock.mockReset());
};

/**
 * Common mock responses
 */
export const mockResponses = {
  // User responses
  user: {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    avatar: '/avatars/default.png'
  },

  // Community responses
  community: {
    id: 'community-1',
    name: 'Test Community',
    slug: 'test-community',
    memberCount: 100
  },

  communities: {
    data: [
      { id: '1', name: 'Community 1', memberCount: 100 },
      { id: '2', name: 'Community 2', memberCount: 200 }
    ],
    total: 2
  },

  // Post responses
  post: {
    id: 'post-1',
    title: 'Test Post',
    content: 'Test content',
    author: { id: 'user-1', username: 'testuser' }
  },

  posts: {
    data: [
      { id: '1', title: 'Post 1', content: 'Content 1' },
      { id: '2', title: 'Post 2', content: 'Content 2' }
    ],
    total: 2
  },

  // Comment responses
  comments: {
    data: [
      { id: '1', content: 'Comment 1', author: { username: 'user1' } },
      { id: '2', content: 'Comment 2', author: { username: 'user2' } }
    ],
    total: 2
  },

  // Message responses
  messages: {
    data: [
      { id: '1', content: 'Message 1', author: { username: 'user1' } },
      { id: '2', content: 'Message 2', author: { username: 'user2' } }
    ],
    total: 2
  },

  // Error responses
  error: {
    message: 'API Error',
    status: 500,
    error: 'Internal Server Error'
  },

  unauthorized: {
    message: 'Unauthorized',
    status: 401,
    error: 'Authentication required'
  },

  notFound: {
    message: 'Not Found',
    status: 404,
    error: 'Resource not found'
  },

  // Success responses
  success: {
    success: true,
    message: 'Operation successful'
  }
};

/**
 * Setup mock API responses
 */
export const setupMockApi = (overrides = {}) => {
  const defaults = {
    'GET /api/users/me': mockResponses.user,
    'GET /api/communities': mockResponses.communities,
    'GET /api/posts': mockResponses.posts,
  };

  const responses = { ...defaults, ...overrides };

  mockApiService.get.mockImplementation((url) => {
    const key = `GET ${url}`;
    return Promise.resolve({
      data: responses[key] || mockResponses.success
    });
  });

  mockApiService.post.mockResolvedValue({ data: mockResponses.success });
  mockApiService.put.mockResolvedValue({ data: mockResponses.success });
  mockApiService.delete.mockResolvedValue({ data: mockResponses.success });
  mockApiService.patch.mockResolvedValue({ data: mockResponses.success });
};
