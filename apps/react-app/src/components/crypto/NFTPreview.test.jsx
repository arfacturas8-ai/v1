import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import NFTPreview from './NFTPreview'

describe('NFTPreview Component', () => {
  describe('Initial Rendering', () => {
    test('renders the component without crashing', () => {
      render(<NFTPreview />)
      expect(screen.getByText('Your NFT Collection')).toBeInTheDocument()
    })

    test('displays the header title correctly', () => {
      render(<NFTPreview />)
      expect(screen.getByText('Your NFT Collection')).toBeInTheDocument()
      expect(screen.getByText('Manage and showcase your digital assets')).toBeInTheDocument()
    })

    test('displays the NFT count badge', () => {
      render(<NFTPreview />)
      expect(screen.getByText('4 NFTs')).toBeInTheDocument()
    })

    test('displays the total value badge', () => {
      render(<NFTPreview />)
      expect(screen.getByText('$190K Total')).toBeInTheDocument()
    })

    test('renders all tab navigation buttons', () => {
      render(<NFTPreview />)
      expect(screen.getByRole('button', { name: 'Collection' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'By Collection' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Activity' })).toBeInTheDocument()
    })

    test('Collection tab is active by default', () => {
      render(<NFTPreview />)
      const collectionTab = screen.getByRole('button', { name: 'Collection' })
      expect(collectionTab).toHaveClass('text-accent-light', 'border-b-2', 'border-accent-primary')
    })
  })

  describe('Tab Navigation', () => {
    test('switches to Collections tab when clicked', () => {
      render(<NFTPreview />)
      const collectionsTab = screen.getByRole('button', { name: 'By Collection' })
      fireEvent.click(collectionsTab)
      expect(collectionsTab).toHaveClass('text-accent-light', 'border-b-2', 'border-accent-primary')
    })

    test('switches to Activity tab when clicked', () => {
      render(<NFTPreview />)
      const activityTab = screen.getByRole('button', { name: 'Activity' })
      fireEvent.click(activityTab)
      expect(activityTab).toHaveClass('text-accent-light', 'border-b-2', 'border-accent-primary')
    })

    test('displays collections view content when Collections tab is active', () => {
      render(<NFTPreview />)
      const collectionsTab = screen.getByRole('button', { name: 'By Collection' })
      fireEvent.click(collectionsTab)
      expect(screen.getByText('Bored Ape Yacht Club')).toBeInTheDocument()
      expect(screen.getByText('Floor Price')).toBeInTheDocument()
    })

    test('displays activity view content when Activity tab is active', () => {
      render(<NFTPreview />)
      const activityTab = screen.getByRole('button', { name: 'Activity' })
      fireEvent.click(activityTab)
      expect(screen.getByText('Set as Profile Picture')).toBeInTheDocument()
      expect(screen.getByText('NFT Received')).toBeInTheDocument()
    })
  })

  describe('NFT Display - Grid View', () => {
    test('renders all NFTs in grid view by default', () => {
      render(<NFTPreview />)
      expect(screen.getByText('Bored Ape #1234')).toBeInTheDocument()
      expect(screen.getByText('CryptoPunk #5678')).toBeInTheDocument()
      expect(screen.getByText('Azuki #9012')).toBeInTheDocument()
      expect(screen.getByText('Doodle #3456')).toBeInTheDocument()
    })

    test('displays NFT images', () => {
      render(<NFTPreview />)
      expect(screen.getByText('🐵')).toBeInTheDocument()
      expect(screen.getByText('👾')).toBeInTheDocument()
      expect(screen.getByText('🌸')).toBeInTheDocument()
      expect(screen.getByText('🎨')).toBeInTheDocument()
    })

    test('displays NFT collection names', () => {
      render(<NFTPreview />)
      expect(screen.getByText('Bored Ape Yacht Club')).toBeInTheDocument()
      expect(screen.getByText('CryptoPunks')).toBeInTheDocument()
      expect(screen.getByText('Azuki')).toBeInTheDocument()
      expect(screen.getByText('Doodles')).toBeInTheDocument()
    })

    test('displays NFT prices in ETH', () => {
      render(<NFTPreview />)
      expect(screen.getByText('15.2 ETH')).toBeInTheDocument()
      expect(screen.getByText('89.5 ETH')).toBeInTheDocument()
      expect(screen.getByText('8.7 ETH')).toBeInTheDocument()
      expect(screen.getByText('5.3 ETH')).toBeInTheDocument()
    })

    test('displays NFT prices in USD', () => {
      render(<NFTPreview />)
      expect(screen.getByText('$24,320')).toBeInTheDocument()
      expect(screen.getByText('$143,200')).toBeInTheDocument()
      expect(screen.getByText('$13,920')).toBeInTheDocument()
      expect(screen.getByText('$8,480')).toBeInTheDocument()
    })

    test('displays rarity badges correctly', () => {
      render(<NFTPreview />)
      const rarityBadges = screen.getAllByText('Rare')
      expect(rarityBadges.length).toBeGreaterThan(0)
      expect(screen.getByText('Ultra Rare')).toBeInTheDocument()
      expect(screen.getByText('Common')).toBeInTheDocument()
    })

    test('displays verified badges for verified NFTs', () => {
      render(<NFTPreview />)
      const verifiedBadges = screen.getAllByText('✓ Verified')
      expect(verifiedBadges.length).toBe(4)
    })

    test('displays profile pic badge for NFT set as profile picture', () => {
      render(<NFTPreview />)
      const profilePicBadges = screen.getAllByText('Profile Pic')
      expect(profilePicBadges.length).toBeGreaterThan(0)
    })

    test('applies special styling to NFT set as profile picture', () => {
      render(<NFTPreview />)
      const nftCards = screen.getAllByText('Bored Ape #1234')
      const nftCard = nftCards[0].closest('.card')
      expect(nftCard).toHaveClass('border-accent-primary/50', 'bg-accent-primary/5')
    })
  })

  describe('View Mode Toggle', () => {
    test('renders grid view button', () => {
      render(<NFTPreview />)
      const gridButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-grid-3x3')
      )
      expect(gridButton).toBeInTheDocument()
    })

    test('renders list view button', () => {
      render(<NFTPreview />)
      const listButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-list')
      )
      expect(listButton).toBeInTheDocument()
    })

    test('switches to list view when list button is clicked', () => {
      render(<NFTPreview />)
      const listButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-list')
      )
      fireEvent.click(listButton)
      expect(listButton).toHaveClass('bg-accent-primary/20', 'text-accent-light')
    })

    test('displays NFTs in list layout when list view is active', () => {
      render(<NFTPreview />)
      const listButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-list')
      )
      fireEvent.click(listButton)
      const nftCards = screen.getAllByText('Bored Ape #1234')
      const nftCard = nftCards[0].closest('.card')
      expect(nftCard).toHaveClass('flex', 'items-center', 'gap-lg')
    })

    test('switches back to grid view when grid button is clicked', () => {
      render(<NFTPreview />)
      const listButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-list')
      )
      const gridButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-grid-3x3')
      )

      fireEvent.click(listButton)
      fireEvent.click(gridButton)
      expect(gridButton).toHaveClass('bg-accent-primary/20', 'text-accent-light')
    })
  })

  describe('Filter Functionality', () => {
    test('renders filter dropdown', () => {
      render(<NFTPreview />)
      const filterSelect = screen.getByRole('combobox')
      expect(filterSelect).toBeInTheDocument()
    })

    test('displays all filter options', () => {
      render(<NFTPreview />)
      expect(screen.getByRole('option', { name: 'All NFTs' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Profile Pic' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Rare Only' })).toBeInTheDocument()
    })

    test('filters to show only profile pic NFT', () => {
      render(<NFTPreview />)
      const filterSelect = screen.getByRole('combobox')
      fireEvent.change(filterSelect, { target: { value: 'profile' } })
      expect(screen.getByText('1 of 4 NFTs')).toBeInTheDocument()
    })

    test('filters to show only rare NFTs', () => {
      render(<NFTPreview />)
      const filterSelect = screen.getByRole('combobox')
      fireEvent.change(filterSelect, { target: { value: 'rare' } })
      expect(screen.getByText('3 of 4 NFTs')).toBeInTheDocument()
    })

    test('shows all NFTs when all filter is selected', () => {
      render(<NFTPreview />)
      const filterSelect = screen.getByRole('combobox')
      fireEvent.change(filterSelect, { target: { value: 'profile' } })
      fireEvent.change(filterSelect, { target: { value: 'all' } })
      expect(screen.getByText('4 of 4 NFTs')).toBeInTheDocument()
    })

    test('displays correct NFT count after filtering', () => {
      render(<NFTPreview />)
      const filterSelect = screen.getByRole('combobox')
      fireEvent.change(filterSelect, { target: { value: 'rare' } })

      expect(screen.queryByText('Azuki #9012')).not.toBeInTheDocument()
      expect(screen.getByText('Bored Ape #1234')).toBeInTheDocument()
      expect(screen.getByText('CryptoPunk #5678')).toBeInTheDocument()
    })
  })

  describe('NFT Detail Modal', () => {
    test('opens modal when NFT is clicked', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)
      expect(screen.getByText('NFT Details')).toBeInTheDocument()
    })

    test('displays NFT image in modal', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)
      const modal = screen.getByText('NFT Details').closest('.card')
      expect(within(modal).getByText('🐵')).toBeInTheDocument()
    })

    test('displays NFT name in modal', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('CryptoPunk #5678').closest('.card')
      fireEvent.click(nftCard)
      const modal = screen.getByText('NFT Details').closest('.card')
      expect(within(modal).getByText('CryptoPunk #5678')).toBeInTheDocument()
    })

    test('displays NFT collection in modal', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)
      const modal = screen.getByText('NFT Details').closest('.card')
      expect(within(modal).getByText('Bored Ape Yacht Club')).toBeInTheDocument()
    })

    test('displays NFT price in modal', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)
      expect(screen.getByText('Price:')).toBeInTheDocument()
    })

    test('displays NFT USD value in modal', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)
      expect(screen.getByText('USD Value:')).toBeInTheDocument()
    })

    test('displays NFT rarity in modal', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)
      expect(screen.getByText('Rarity:')).toBeInTheDocument()
    })

    test('displays NFT traits in modal', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)
      expect(screen.getByText('Traits:')).toBeInTheDocument()
      expect(screen.getByText('Golden Fur')).toBeInTheDocument()
      expect(screen.getByText('Laser Eyes')).toBeInTheDocument()
      expect(screen.getByText('Crown')).toBeInTheDocument()
    })

    test('displays all traits for selected NFT', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('CryptoPunk #5678').closest('.card')
      fireEvent.click(nftCard)
      expect(screen.getByText('Alien')).toBeInTheDocument()
      expect(screen.getByText('Cap Forward')).toBeInTheDocument()
      expect(screen.getByText('Pipe')).toBeInTheDocument()
    })

    test('displays Set as Profile Pic button for non-profile NFTs', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('CryptoPunk #5678').closest('.card')
      fireEvent.click(nftCard)
      expect(screen.getByRole('button', { name: /Set as Profile Pic/i })).toBeInTheDocument()
    })

    test('displays Current Profile Pic indicator for profile NFT', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)
      expect(screen.getByText('Current Profile Pic')).toBeInTheDocument()
    })

    test('displays View on OpenSea button', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)
      expect(screen.getByRole('button', { name: /View on OpenSea/i })).toBeInTheDocument()
    })

    test('closes modal when close button is clicked', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)

      const closeButton = screen.getByRole('button', { name: '✕' })
      fireEvent.click(closeButton)

      expect(screen.queryByText('NFT Details')).not.toBeInTheDocument()
    })

    test('modal displays correct rarity color for Ultra Rare', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('CryptoPunk #5678').closest('.card')
      fireEvent.click(nftCard)

      const modal = screen.getByText('NFT Details').closest('.card')
      const rarityText = within(modal).getAllByText('Ultra Rare').find(el =>
        el.classList.contains('text-error')
      )
      expect(rarityText).toBeInTheDocument()
    })

    test('modal displays correct rarity color for Rare', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)

      const modal = screen.getByText('NFT Details').closest('.card')
      const rarityText = within(modal).getAllByText('Rare').find(el =>
        el.classList.contains('text-warning')
      )
      expect(rarityText).toBeInTheDocument()
    })

    test('modal displays correct rarity color for Common', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Azuki #9012').closest('.card')
      fireEvent.click(nftCard)

      const modal = screen.getByText('NFT Details').closest('.card')
      const rarityText = within(modal).getByText('Common')
      expect(rarityText).toHaveClass('text-info')
    })
  })

  describe('Set as Profile Picture Functionality', () => {
    test('sets NFT as profile picture when button is clicked', () => {
      render(<NFTPreview />)

      const nftCard = screen.getByText('CryptoPunk #5678').closest('.card')
      fireEvent.click(nftCard)

      const setAsProfileButton = screen.getByRole('button', { name: /Set as Profile Pic/i })
      fireEvent.click(setAsProfileButton)

      expect(screen.queryByText('NFT Details')).not.toBeInTheDocument()
    })

    test('only one NFT can be set as profile picture at a time', () => {
      render(<NFTPreview />)

      let nftCard = screen.getByText('CryptoPunk #5678').closest('.card')
      fireEvent.click(nftCard)

      const setAsProfileButton = screen.getByRole('button', { name: /Set as Profile Pic/i })
      fireEvent.click(setAsProfileButton)

      const profilePicBadges = screen.getAllByText('Profile Pic')
      expect(profilePicBadges).toHaveLength(1)
    })
  })

  describe('Collections View', () => {
    test('displays all collections', () => {
      render(<NFTPreview />)
      const collectionsTab = screen.getByRole('button', { name: 'By Collection' })
      fireEvent.click(collectionsTab)

      expect(screen.getByText('Bored Ape Yacht Club')).toBeInTheDocument()
      expect(screen.getByText('CryptoPunks')).toBeInTheDocument()
      expect(screen.getByText('Azuki')).toBeInTheDocument()
      expect(screen.getByText('Doodles')).toBeInTheDocument()
    })

    test('displays collection count correctly', () => {
      render(<NFTPreview />)
      const collectionsTab = screen.getByRole('button', { name: 'By Collection' })
      fireEvent.click(collectionsTab)

      const nftCounts = screen.getAllByText('1 NFT')
      expect(nftCounts.length).toBe(4)
    })

    test('displays floor prices for collections', () => {
      render(<NFTPreview />)
      const collectionsTab = screen.getByRole('button', { name: 'By Collection' })
      fireEvent.click(collectionsTab)

      const floorPriceLabels = screen.getAllByText('Floor Price')
      expect(floorPriceLabels.length).toBeGreaterThan(0)
    })

    test('displays external link buttons for collections', () => {
      render(<NFTPreview />)
      const collectionsTab = screen.getByRole('button', { name: 'By Collection' })
      fireEvent.click(collectionsTab)

      const externalLinkButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('.lucide-external-link')
      )
      expect(externalLinkButtons.length).toBe(4)
    })

    test('displays collection icons', () => {
      render(<NFTPreview />)
      const collectionsTab = screen.getByRole('button', { name: 'By Collection' })
      fireEvent.click(collectionsTab)

      expect(screen.getByText('🐵')).toBeInTheDocument()
      expect(screen.getByText('👾')).toBeInTheDocument()
      expect(screen.getByText('🌸')).toBeInTheDocument()
      expect(screen.getByText('🎨')).toBeInTheDocument()
    })
  })

  describe('Activity View', () => {
    test('displays activity items', () => {
      render(<NFTPreview />)
      const activityTab = screen.getByRole('button', { name: 'Activity' })
      fireEvent.click(activityTab)

      expect(screen.getByText('Set as Profile Picture')).toBeInTheDocument()
      expect(screen.getByText('NFT Received')).toBeInTheDocument()
      expect(screen.getByText('Collection Updated')).toBeInTheDocument()
    })

    test('displays activity descriptions', () => {
      render(<NFTPreview />)
      const activityTab = screen.getByRole('button', { name: 'Activity' })
      fireEvent.click(activityTab)

      expect(screen.getByText(/Bored Ape #1234 • 2 hours ago/i)).toBeInTheDocument()
      expect(screen.getByText(/Doodle #3456 • 1 day ago/i)).toBeInTheDocument()
      expect(screen.getByText(/Azuki #9012 metadata refreshed • 3 days ago/i)).toBeInTheDocument()
    })

    test('displays activity status indicators', () => {
      render(<NFTPreview />)
      const activityTab = screen.getByRole('button', { name: 'Activity' })
      fireEvent.click(activityTab)

      const activityCards = screen.getAllByRole('generic').filter(el =>
        el.classList.contains('card')
      )
      expect(activityCards.length).toBeGreaterThan(2)
    })
  })

  describe('Rarity Styling', () => {
    test('applies correct styling for Ultra Rare rarity', () => {
      render(<NFTPreview />)
      const rarityBadges = screen.getAllByText('Ultra Rare')
      const badgeInGrid = rarityBadges.find(badge =>
        badge.classList.contains('bg-error/20') && badge.classList.contains('text-error')
      )
      expect(badgeInGrid).toBeInTheDocument()
    })

    test('applies correct styling for Rare rarity', () => {
      render(<NFTPreview />)
      const rarityBadges = screen.getAllByText('Rare')
      const badgeInGrid = rarityBadges.find(badge =>
        badge.classList.contains('bg-warning/20') && badge.classList.contains('text-warning')
      )
      expect(badgeInGrid).toBeInTheDocument()
    })

    test('applies correct styling for Common rarity', () => {
      render(<NFTPreview />)
      const rarityBadge = screen.getByText('Common')
      expect(rarityBadge).toHaveClass('bg-info/20', 'text-info')
    })
  })

  describe('List View Display', () => {
    test('displays NFT images in list view', () => {
      render(<NFTPreview />)
      const listButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-list')
      )
      fireEvent.click(listButton)

      expect(screen.getByText('🐵')).toBeInTheDocument()
      expect(screen.getByText('👾')).toBeInTheDocument()
    })

    test('displays verified checkmark in list view', () => {
      render(<NFTPreview />)
      const listButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-list')
      )
      fireEvent.click(listButton)

      const verifiedMarks = screen.getAllByText('✓')
      expect(verifiedMarks.length).toBeGreaterThan(0)
    })

    test('displays prices in list view', () => {
      render(<NFTPreview />)
      const listButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-list')
      )
      fireEvent.click(listButton)

      expect(screen.getByText('15.2 ETH')).toBeInTheDocument()
      expect(screen.getByText('$24,320')).toBeInTheDocument()
    })

    test('displays rarity badges in list view', () => {
      render(<NFTPreview />)
      const listButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-list')
      )
      fireEvent.click(listButton)

      expect(screen.getByText('Ultra Rare')).toBeInTheDocument()
      const rarityBadges = screen.getAllByText('Rare')
      expect(rarityBadges.length).toBeGreaterThan(0)
    })

    test('opens modal when clicking NFT in list view', () => {
      render(<NFTPreview />)
      const listButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.lucide-list')
      )
      fireEvent.click(listButton)

      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)

      expect(screen.getByText('NFT Details')).toBeInTheDocument()
    })
  })

  describe('Modal Backdrop', () => {
    test('displays backdrop when modal is open', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50')
      expect(backdrop).toBeInTheDocument()
    })

    test('backdrop has blur effect', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)

      const backdrop = document.querySelector('.backdrop-blur-sm')
      expect(backdrop).toBeInTheDocument()
    })

    test('modal has correct z-index', () => {
      render(<NFTPreview />)
      const nftCard = screen.getByText('Bored Ape #1234').closest('.card')
      fireEvent.click(nftCard)

      const modal = document.querySelector('.z-50')
      expect(modal).toBeInTheDocument()
    })
  })
})

export default collectionTab
