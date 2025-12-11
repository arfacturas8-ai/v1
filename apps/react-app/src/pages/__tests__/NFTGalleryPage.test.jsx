/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import NFTGalleryPage from '../NFTGalleryPage'

// Mock PageSkeleton
jest.mock('../../components/LoadingSkeleton', () => ({
  PageSkeleton: ({ type }) => <div data-testid="page-skeleton" data-type={type}></div>
}))

// Mock NFTCard component
const MockNFTCard = ({ nft }) => (
  <div data-testid="nft-card" data-nft-id={nft.id}>
    <img src={nft.image} alt={nft.name} />
    <h3>{nft.name}</h3>
    <p>{nft.collection}</p>
    <span>{nft.price}</span>
  </div>
)

const MockNFTListItem = ({ nft }) => (
  <div data-testid="nft-list-item" data-nft-id={nft.id}>
    <h3>{nft.name}</h3>
    <p>{nft.collection}</p>
  </div>
)

// Mock the components that might be used
jest.mock('../../components/NFTCard', () => MockNFTCard)
jest.mock('../../components/NFTListItem', () => MockNFTListItem)

const mockNFTData = [
  {
    id: '1',
    name: 'Cosmic Explorer #1',
    collection: 'Cosmic Collection',
    image: 'https://example.com/nft1.jpg',
    price: '2.5 ETH',
    category: 'art'
  },
  {
    id: '2',
    name: 'Digital Art #42',
    collection: 'Digital Gallery',
    image: 'https://example.com/nft2.jpg',
    price: '1.8 ETH',
    category: 'art'
  },
  {
    id: '3',
    name: 'Gaming Badge',
    collection: 'Game Items',
    image: 'https://example.com/nft3.jpg',
    price: '0.5 ETH',
    category: 'gaming'
  }
]

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('NFTGalleryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })
      const { container } = renderWithRouter(<NFTGalleryPage />)
      expect(container).toBeInTheDocument()
    })

    it('displays the page title', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })
      renderWithRouter(<NFTGalleryPage />)
      expect(screen.getByText('My NFT Gallery')).toBeInTheDocument()
    })

    it('displays the page description', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })
      renderWithRouter(<NFTGalleryPage />)
      expect(screen.getByText('View and manage your digital collectibles')).toBeInTheDocument()
    })

    it('has proper main role with aria-label', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })
      renderWithRouter(<NFTGalleryPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('aria-label', 'NFT gallery page')
    })

    it('renders Browse Marketplace link', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })
      renderWithRouter(<NFTGalleryPage />)
      const link = screen.getAllByText('Browse Marketplace')[0]
      expect(link.closest('a')).toHaveAttribute('href', '/nft-marketplace')
    })

    it('renders Browse Marketplace link with correct aria-label', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })
      renderWithRouter(<NFTGalleryPage />)
      const link = screen.getAllByLabelText('Browse marketplace')[0]
      expect(link).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton initially', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}))
      renderWithRouter(<NFTGalleryPage />)
      expect(screen.getByTestId('page-skeleton')).toBeInTheDocument()
    })

    it('shows loading skeleton with grid type', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}))
      renderWithRouter(<NFTGalleryPage />)
      const skeleton = screen.getByTestId('page-skeleton')
      expect(skeleton).toHaveAttribute('data-type', 'grid')
    })

    it('hides loading skeleton after data loads', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })
      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('sets loading state correctly', async () => {
      let resolvePromise
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      global.fetch.mockReturnValue(promise)
      renderWithRouter(<NFTGalleryPage />)

      expect(screen.getByTestId('page-skeleton')).toBeInTheDocument()

      resolvePromise({
        ok: true,
        json: async () => ({ nfts: [] })
      })

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Fetching', () => {
    it('fetches NFTs on mount', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/nfts/gallery?filter=all',
          expect.objectContaining({ credentials: 'include' })
        )
      })
    })

    it('includes credentials in fetch request', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: 'include' })
        )
      })
    })

    it('displays NFT data after successful fetch', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Cosmic Explorer #1')).toBeInTheDocument()
        expect(screen.getByText('Digital Art #42')).toBeInTheDocument()
      })
    })

    it('handles empty nfts array in response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles null nfts in response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: null })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('refetches data when filter changes', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      const filterSelect = screen.getByLabelText('Filter NFTs')
      fireEvent.change(filterSelect, { target: { value: 'art' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/nfts/gallery?filter=art',
          expect.any(Object)
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValue(new Error('Network error'))

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'NFT fetch error:',
          expect.any(Error)
        )
      })

      consoleError.mockRestore()
    })

    it('stops loading after fetch error', async () => {
      jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValue(new Error('Network error'))

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      console.error.mockRestore()
    })

    it('handles non-ok response status', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles JSON parse errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('JSON parse error') }
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      expect(searchInput).toBeInTheDocument()
    })

    it('search input has correct aria-label', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      expect(screen.getByLabelText('Search NFTs')).toBeInTheDocument()
    })

    it('updates search query on input change', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'Cosmic')

      expect(searchInput.value).toBe('Cosmic')
    })

    it('filters NFTs by name', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Cosmic Explorer #1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'Cosmic')

      expect(screen.getByText('Cosmic Explorer #1')).toBeInTheDocument()
      expect(screen.queryByText('Digital Art #42')).not.toBeInTheDocument()
    })

    it('filters NFTs by collection name', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Digital Art #42')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'Digital Gallery')

      expect(screen.getByText('Digital Art #42')).toBeInTheDocument()
      expect(screen.queryByText('Cosmic Explorer #1')).not.toBeInTheDocument()
    })

    it('search is case-insensitive', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Cosmic Explorer #1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'cosmic')

      expect(screen.getByText('Cosmic Explorer #1')).toBeInTheDocument()
    })

    it('shows all NFTs when search is cleared', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Cosmic Explorer #1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'Cosmic')

      expect(screen.queryByText('Digital Art #42')).not.toBeInTheDocument()

      await userEvent.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByText('Digital Art #42')).toBeInTheDocument()
      })
    })

    it('handles search with no results', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Cosmic Explorer #1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'NonexistentNFT')

      expect(screen.getByText('No NFTs Found')).toBeInTheDocument()
    })

    it('handles undefined name gracefully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          nfts: [{ id: '1', collection: 'Test', price: '1 ETH' }]
        })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'test')

      expect(screen.queryByTestId('nft-card')).toBeInTheDocument()
    })

    it('handles undefined collection gracefully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          nfts: [{ id: '1', name: 'Test NFT', price: '1 ETH' }]
        })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.queryByTestId('page-skeleton')).not.toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'test')

      expect(screen.getByText('Test NFT')).toBeInTheDocument()
    })
  })

  describe('Filter Functionality', () => {
    it('renders filter dropdown', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      expect(screen.getByLabelText('Filter NFTs')).toBeInTheDocument()
    })

    it('displays all filter options', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const select = screen.getByLabelText('Filter NFTs')
      expect(within(select).getByText('All NFTs')).toBeInTheDocument()
      expect(within(select).getByText('Art')).toBeInTheDocument()
      expect(within(select).getByText('Collectibles')).toBeInTheDocument()
      expect(within(select).getByText('Gaming')).toBeInTheDocument()
      expect(within(select).getByText('Music')).toBeInTheDocument()
      expect(within(select).getByText('Photography')).toBeInTheDocument()
    })

    it('defaults to "all" filter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const select = screen.getByLabelText('Filter NFTs')
      expect(select.value).toBe('all')
    })

    it('changes filter value on selection', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const select = screen.getByLabelText('Filter NFTs')
      fireEvent.change(select, { target: { value: 'art' } })

      expect(select.value).toBe('art')
    })

    it('fetches with art filter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      const select = screen.getByLabelText('Filter NFTs')
      fireEvent.change(select, { target: { value: 'art' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/nfts/gallery?filter=art',
          expect.any(Object)
        )
      })
    })

    it('fetches with collectibles filter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const select = screen.getByLabelText('Filter NFTs')
      fireEvent.change(select, { target: { value: 'collectibles' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/nfts/gallery?filter=collectibles',
          expect.any(Object)
        )
      })
    })

    it('fetches with gaming filter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const select = screen.getByLabelText('Filter NFTs')
      fireEvent.change(select, { target: { value: 'gaming' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/nfts/gallery?filter=gaming',
          expect.any(Object)
        )
      })
    })
  })

  describe('View Mode Toggle', () => {
    it('renders grid view button', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      expect(screen.getByLabelText('Grid view')).toBeInTheDocument()
    })

    it('renders list view button', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      expect(screen.getByLabelText('List view')).toBeInTheDocument()
    })

    it('defaults to grid view', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const gridButton = screen.getByLabelText('Grid view')
      expect(gridButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to list view when clicked', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const listButton = screen.getByLabelText('List view')
      fireEvent.click(listButton)

      expect(listButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to grid view from list view', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const listButton = screen.getByLabelText('List view')
      const gridButton = screen.getByLabelText('Grid view')

      fireEvent.click(listButton)
      fireEvent.click(gridButton)

      expect(gridButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('displays NFT cards in grid view', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        const cards = screen.getAllByTestId('nft-card')
        expect(cards.length).toBe(3)
      })
    })

    it('displays NFT list items in list view', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const listButton = screen.getByLabelText('List view')
      fireEvent.click(listButton)

      await waitFor(() => {
        const items = screen.getAllByTestId('nft-list-item')
        expect(items.length).toBe(3)
      })
    })
  })

  describe('Statistics Display', () => {
    it('displays Total NFTs stat', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Total NFTs')).toBeInTheDocument()
      })
    })

    it('displays correct NFT count', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        const totalNFTs = screen.getByText('Total NFTs')
        const parentDiv = totalNFTs.closest('div')
        expect(within(parentDiv).getByText('3')).toBeInTheDocument()
      })
    })

    it('displays Collections stat', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Collections')).toBeInTheDocument()
      })
    })

    it('displays correct collection count', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        const collections = screen.getByText('Collections')
        const parentDiv = collections.closest('div')
        expect(within(parentDiv).getByText('3')).toBeInTheDocument()
      })
    })

    it('displays Total Value stat', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Total Value')).toBeInTheDocument()
        expect(screen.getByText('$12,450')).toBeInTheDocument()
      })
    })

    it('updates stats when filtered', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        const totalNFTs = screen.getByText('Total NFTs')
        const parentDiv = totalNFTs.closest('div')
        expect(within(parentDiv).getByText('3')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'Cosmic')

      await waitFor(() => {
        const totalNFTs = screen.getByText('Total NFTs')
        const parentDiv = totalNFTs.closest('div')
        expect(within(parentDiv).getByText('1')).toBeInTheDocument()
      })
    })

    it('shows zero stats when no NFTs', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        const totalNFTs = screen.getByText('Total NFTs')
        const parentDiv = totalNFTs.closest('div')
        expect(within(parentDiv).getByText('0')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no NFTs', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('No NFTs Found')).toBeInTheDocument()
      })
    })

    it('displays correct message when no search results', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Cosmic Explorer #1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      await userEvent.type(searchInput, 'NonexistentNFT')

      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
    })

    it('displays correct message when no NFTs at all', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('Start collecting NFTs to see them here')).toBeInTheDocument()
      })
    })

    it('shows Browse Marketplace link in empty state', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [] })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        const links = screen.getAllByText('Browse Marketplace')
        expect(links.length).toBeGreaterThan(0)
      })
    })
  })

  describe('NFT Display', () => {
    it('renders all NFTs in grid', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        const cards = screen.getAllByTestId('nft-card')
        expect(cards).toHaveLength(3)
      })
    })

    it('passes correct props to NFT cards', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: [mockNFTData[0]] })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        const card = screen.getByTestId('nft-card')
        expect(card).toHaveAttribute('data-nft-id', '1')
      })
    })

    it('renders NFTs with correct keys', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        const cards = screen.getAllByTestId('nft-card')
        cards.forEach((card, index) => {
          expect(card).toHaveAttribute('data-nft-id', mockNFTData[index].id)
        })
      })
    })

    it('handles NFTs without id using index as key', async () => {
      const nftsWithoutIds = [
        { name: 'NFT 1', collection: 'Collection' },
        { name: 'NFT 2', collection: 'Collection' }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: nftsWithoutIds })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('NFT 1')).toBeInTheDocument()
        expect(screen.getByText('NFT 2')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper semantic HTML structure', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper heading hierarchy', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('My NFT Gallery')
    })

    it('search input is keyboard accessible', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const searchInput = screen.getByPlaceholderText('Search NFTs...')
      searchInput.focus()
      expect(searchInput).toHaveFocus()
    })

    it('filter select is keyboard accessible', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const select = screen.getByLabelText('Filter NFTs')
      select.focus()
      expect(select).toHaveFocus()
    })

    it('view toggle buttons are keyboard accessible', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const gridButton = screen.getByLabelText('Grid view')
      gridButton.focus()
      expect(gridButton).toHaveFocus()
    })

    it('Browse Marketplace link is keyboard accessible', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const link = screen.getAllByLabelText('Browse marketplace')[0]
      link.focus()
      expect(link).toHaveFocus()
    })

    it('has proper aria-pressed on view buttons', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const gridButton = screen.getByLabelText('Grid view')
      const listButton = screen.getByLabelText('List view')

      expect(gridButton).toHaveAttribute('aria-pressed', 'true')
      expect(listButton).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Responsive Design', () => {
    it('renders on mobile viewport', async () => {
      global.innerWidth = 375
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('My NFT Gallery')).toBeInTheDocument()
      })
    })

    it('renders on tablet viewport', async () => {
      global.innerWidth = 768
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('My NFT Gallery')).toBeInTheDocument()
      })
    })

    it('renders on desktop viewport', async () => {
      global.innerWidth = 1920
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(screen.getByText('My NFT Gallery')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('does not re-fetch on every render', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      const { rerender } = renderWithRouter(<NFTGalleryPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      rerender(
        <BrowserRouter>
          <NFTGalleryPage />
        </BrowserRouter>
      )

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('handles rapid filter changes', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ nfts: mockNFTData })
      })

      renderWithRouter(<NFTGalleryPage />)

      const select = screen.getByLabelText('Filter NFTs')

      fireEvent.change(select, { target: { value: 'art' } })
      fireEvent.change(select, { target: { value: 'gaming' } })
      fireEvent.change(select, { target: { value: 'music' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })
})

export default MockNFTCard
