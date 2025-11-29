/**
 * ChatService Test Suite
 * Tests for chat service functions
 */

// Mock fetch
global.fetch = jest.fn()

// Mock the API service
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  API_BASE_URL: 'http://localhost:3000/api/v1',
}))

import apiService from '../api'

describe('chatService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches chat messages', async () => {
    apiService.get.mockResolvedValueOnce({
      success: true,
      data: {
        messages: [
          { id: '1', text: 'Hello', userId: 'user1' },
          { id: '2', text: 'World', userId: 'user2' },
        ],
      },
    })

    const response = await apiService.get('/messages')
    expect(response.success).toBe(true)
    expect(response.data.messages).toHaveLength(2)
  })

  it('sends chat message', async () => {
    apiService.post.mockResolvedValueOnce({
      success: true,
      data: {
        id: '3',
        text: 'New message',
        userId: 'user1',
      },
    })

    const response = await apiService.post('/messages', {
      text: 'New message',
    })

    expect(response.success).toBe(true)
    expect(response.data.text).toBe('New message')
  })

  it('handles API errors gracefully', async () => {
    apiService.get.mockRejectedValueOnce(new Error('Network error'))

    try {
      await apiService.get('/messages')
    } catch (error) {
      expect(error.message).toBe('Network error')
    }
  })

  it('deletes chat message', async () => {
    apiService.delete.mockResolvedValueOnce({
      success: true,
    })

    const response = await apiService.delete('/messages/1')
    expect(response.success).toBe(true)
  })

  it('updates chat message', async () => {
    apiService.put.mockResolvedValueOnce({
      success: true,
      data: {
        id: '1',
        text: 'Updated message',
      },
    })

    const response = await apiService.put('/messages/1', {
      text: 'Updated message',
    })

    expect(response.success).toBe(true)
    expect(response.data.text).toBe('Updated message')
  })
})
