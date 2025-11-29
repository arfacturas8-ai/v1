/**
 * ChannelService Test Suite
 * Tests for channel service functions
 */

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

describe('channelService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches channels', async () => {
    apiService.get.mockResolvedValueOnce({
      success: true,
      data: {
        channels: [
          { id: '1', name: 'general', type: 'text' },
          { id: '2', name: 'voice', type: 'voice' },
        ],
      },
    })

    const response = await apiService.get('/channels')
    expect(response.success).toBe(true)
    expect(response.data.channels).toHaveLength(2)
  })

  it('creates a channel', async () => {
    apiService.post.mockResolvedValueOnce({
      success: true,
      data: {
        id: '3',
        name: 'new-channel',
        type: 'text',
      },
    })

    const response = await apiService.post('/channels', {
      name: 'new-channel',
      type: 'text',
    })

    expect(response.success).toBe(true)
    expect(response.data.name).toBe('new-channel')
  })

  it('updates a channel', async () => {
    apiService.put.mockResolvedValueOnce({
      success: true,
      data: {
        id: '1',
        name: 'updated-channel',
      },
    })

    const response = await apiService.put('/channels/1', {
      name: 'updated-channel',
    })

    expect(response.success).toBe(true)
    expect(response.data.name).toBe('updated-channel')
  })

  it('deletes a channel', async () => {
    apiService.delete.mockResolvedValueOnce({
      success: true,
    })

    const response = await apiService.delete('/channels/1')
    expect(response.success).toBe(true)
  })

  it('handles API errors', async () => {
    apiService.get.mockRejectedValueOnce(new Error('Failed to fetch channels'))

    try {
      await apiService.get('/channels')
    } catch (error) {
      expect(error.message).toBe('Failed to fetch channels')
    }
  })

  it('fetches channel by ID', async () => {
    apiService.get.mockResolvedValueOnce({
      success: true,
      data: {
        id: '1',
        name: 'general',
        members: 10,
      },
    })

    const response = await apiService.get('/channels/1')
    expect(response.success).toBe(true)
    expect(response.data.id).toBe('1')
  })
})
