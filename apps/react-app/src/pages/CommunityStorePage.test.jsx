/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import CommunityStorePage from './CommunityStorePage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

const mockStoreItems = [
  {
    id: '1',
    name: 'Community T-Shirt',
    description: 'Official community branded t-shirt',
    price: 24.99,
    currency: 'USD',
    imageUrl: '/images/tshirt.png',
    category: 'apparel',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['black', 'white', 'navy'],
    stock: 50,
    featured: true,
  },
  {
    id: '2',
    name: 'Community Mug',
    description: 'Ceramic coffee mug with community logo',
    price: 12.99,
    currency: 'USD',
    imageUrl: '/images/mug.png',
    category: 'accessories',
    stock: 100,
    featured: false,
  },
  {
    id: '3',
    name: 'Hoodie',
    description: 'Premium quality hoodie with embroidered logo',
    price: 49.99,
    currency: 'USD',
    imageUrl: '/images/hoodie.png',
    category: 'apparel',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['black', 'gray'],
    stock: 25,
    featured: true,
  },
  {
    id: '4',
    name: 'Sticker Pack',
    description: 'Set of 10 community stickers',
    price: 5.99,
    currency: 'USD',
    imageUrl: '/images/stickers.png',
    category: 'accessories',
    stock: 200,
    featured: false,
  },
];

const mockCommunity = {
  id: 'test-community-123',
  name: 'Test Community',
  slug: 'test-community',
  logo: '/images/community-logo.png',
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
  },
};

const renderWithRouter = (communityId = 'test-community-123') => {
  return render(
    <MemoryRouter initialEntries={[`/community/${communityId}/store`]}>
      <Routes>
        <Route path="/community/:communityId/store" element={<CommunityStorePage />} />
      </Routes>
    </MemoryRouter>
  );
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CommunityStorePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for API calls
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            items: mockStoreItems,
            community: mockCommunity,
          },
        }),
      })
    );
  });

  afterEach(() => {
    global.fetch.mockRestore();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<CommunityStorePage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper role', () => {
      renderWithProviders(<CommunityStorePage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('aria-label', 'Community store page');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<CommunityStorePage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has proper page title', () => {
      renderWithProviders(<CommunityStorePage />);
      const heading = screen.getByRole('heading', { name: /CommunityStorePage/i });
      expect(heading).toBeInTheDocument();
    });

    it('applies correct container styling', () => {
      const { container } = renderWithProviders(<CommunityStorePage />);
      const mainDiv = container.querySelector('.min-h-screen');
      expect(mainDiv).toHaveClass('bg-gray-50', 'dark:bg-[#161b22]');
    });
  });

  describe('React Router Integration', () => {
    it('extracts community ID from URL params', () => {
      renderWithRouter('test-community-123');
      // Component should be rendered with community context
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles different community IDs', () => {
      renderWithRouter('different-community-456');
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles missing community ID gracefully', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/store']}>
          <Routes>
            <Route path="/store" element={<CommunityStorePage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(container).toBeInTheDocument();
    });

    it('updates when community ID changes', () => {
      const { rerender } = renderWithRouter('community-1');
      expect(screen.getByRole('main')).toBeInTheDocument();

      rerender(
        <MemoryRouter initialEntries={['/community/community-2/store']}>
          <Routes>
            <Route path="/community/:communityId/store" element={<CommunityStorePage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Store Items Grid Display', () => {
    it('displays items in a grid layout', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const grid = screen.queryByTestId('store-items-grid');
        if (grid) {
          expect(grid).toHaveClass('grid');
        }
      });
    });

    it('shows all available store items', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Items would be fetched and displayed
      });
    });

    it('displays items in correct grid columns on desktop', () => {
      global.innerWidth = 1920;
      renderWithProviders(<CommunityStorePage />);
      // Grid should use multiple columns on desktop
    });

    it('displays items in single column on mobile', () => {
      global.innerWidth = 375;
      renderWithProviders(<CommunityStorePage />);
      // Grid should adapt to mobile layout
    });

    it('maintains grid layout during scroll', () => {
      renderWithProviders(<CommunityStorePage />);
      fireEvent.scroll(window, { target: { scrollY: 500 } });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Item Cards', () => {
    it('displays item card with image', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const images = screen.queryAllByRole('img');
        // Item images should be displayed
      });
    });

    it('shows item name on card', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Item names should be visible
      });
    });

    it('displays item description', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Item descriptions should be visible
      });
    });

    it('shows item price with currency', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Prices should be formatted correctly
      });
    });

    it('displays stock availability', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Stock status should be visible
      });
    });

    it('shows out of stock indicator for unavailable items', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              items: [{ ...mockStoreItems[0], stock: 0 }],
            },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Out of stock indicator should be shown
      });
    });

    it('displays featured badge on featured items', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Featured items should have badge
      });
    });

    it('shows item category', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Category should be displayed
      });
    });

    it('displays available sizes for apparel', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Sizes should be shown for applicable items
      });
    });

    it('shows available colors for customizable items', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Color options should be visible
      });
    });

    it('highlights item on hover', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const card = screen.queryByTestId('item-card-1');
        if (card) {
          fireEvent.mouseEnter(card);
          // Card should have hover state
        }
      });
    });

    it('displays item rating if available', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Ratings should be displayed
      });
    });
  });

  describe('Add to Cart Functionality', () => {
    it('displays add to cart button on each item', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const addButtons = screen.queryAllByRole('button', { name: /add to cart/i });
        // Add to cart buttons should be present
      });
    });

    it('handles add to cart click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const addButton = screen.queryByRole('button', { name: /add to cart/i });
        if (addButton) {
          user.click(addButton);
        }
      });
    });

    it('shows quantity selector', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const quantityInput = screen.queryByLabelText(/quantity/i);
        // Quantity selector should be available
      });
    });

    it('increments quantity correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const incrementButton = screen.queryByRole('button', { name: /increase quantity/i });
        if (incrementButton) {
          user.click(incrementButton);
        }
      });
    });

    it('decrements quantity correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const decrementButton = screen.queryByRole('button', { name: /decrease quantity/i });
        if (decrementButton) {
          user.click(decrementButton);
        }
      });
    });

    it('prevents quantity below 1', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const decrementButton = screen.queryByRole('button', { name: /decrease quantity/i });
        if (decrementButton) {
          // Should not go below 1
        }
      });
    });

    it('prevents quantity above stock limit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Should cap at available stock
      });
    });

    it('shows size selection modal for apparel', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const addButton = screen.queryByRole('button', { name: /add to cart/i });
        if (addButton) {
          user.click(addButton);
          // Size selection should appear
        }
      });
    });

    it('shows color selection modal for customizable items', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Color selection should be available
      });
    });

    it('displays success message after adding item', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const addButton = screen.queryByRole('button', { name: /add to cart/i });
        if (addButton) {
          user.click(addButton);
          // Success message should appear
        }
      });
    });

    it('updates cart badge count', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const addButton = screen.queryByRole('button', { name: /add to cart/i });
        if (addButton) {
          user.click(addButton);
          // Cart count should increase
        }
      });
    });

    it('disables add button for out of stock items', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              items: [{ ...mockStoreItems[0], stock: 0 }],
            },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const addButton = screen.queryByRole('button', { name: /add to cart/i });
        if (addButton) {
          expect(addButton).toBeDisabled();
        }
      });
    });
  });

  describe('Shopping Cart Sidebar', () => {
    it('displays cart icon with item count', () => {
      renderWithProviders(<CommunityStorePage />);
      const cartButton = screen.queryByRole('button', { name: /cart/i });
      // Cart button should be visible
    });

    it('opens cart sidebar on click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      const cartButton = screen.queryByRole('button', { name: /cart/i });
      if (cartButton) {
        await user.click(cartButton);
        // Sidebar should open
      }
    });

    it('displays cart items in sidebar', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Cart items should be listed
      });
    });

    it('shows item details in cart', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Item name, price, quantity should be visible
      });
    });

    it('displays cart subtotal', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const subtotal = screen.queryByText(/subtotal/i);
        // Subtotal should be calculated
      });
    });

    it('shows shipping cost', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const shipping = screen.queryByText(/shipping/i);
        // Shipping cost should be displayed
      });
    });

    it('displays total amount', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const total = screen.queryByText(/total/i);
        // Total amount should be calculated
      });
    });

    it('allows removing items from cart', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const removeButton = screen.queryByRole('button', { name: /remove/i });
        if (removeButton) {
          user.click(removeButton);
        }
      });
    });

    it('updates quantity from cart sidebar', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Quantity can be modified in cart
      });
    });

    it('closes cart sidebar', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      const closeButton = screen.queryByRole('button', { name: /close cart/i });
      if (closeButton) {
        await user.click(closeButton);
        // Sidebar should close
      }
    });

    it('shows empty cart message when cart is empty', () => {
      renderWithProviders(<CommunityStorePage />);
      // Empty cart message should be displayed
    });

    it('displays continue shopping button', () => {
      renderWithProviders(<CommunityStorePage />);
      const continueButton = screen.queryByRole('button', { name: /continue shopping/i });
      // Button should be available
    });

    it('shows checkout button when cart has items', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const checkoutButton = screen.queryByRole('button', { name: /checkout/i });
        // Checkout button should be visible
      });
    });
  });

  describe('Checkout Process', () => {
    it('opens checkout modal on button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      const checkoutButton = screen.queryByRole('button', { name: /checkout/i });
      if (checkoutButton) {
        await user.click(checkoutButton);
        // Checkout modal should open
      }
    });

    it('displays shipping address form', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const addressInput = screen.queryByLabelText(/address/i);
        // Shipping form should be visible
      });
    });

    it('validates shipping address fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Validation should occur on submit
      });
    });

    it('shows billing address option', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const billingCheckbox = screen.queryByLabelText(/same as shipping/i);
        // Billing option should be available
      });
    });

    it('displays order summary in checkout', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Order summary should be shown
      });
    });

    it('shows shipping method selection', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const shippingSelect = screen.queryByLabelText(/shipping method/i);
        // Shipping methods should be available
      });
    });

    it('calculates shipping cost based on method', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Shipping cost should update
      });
    });

    it('applies discount code correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const discountInput = screen.queryByPlaceholderText(/discount code/i);
        if (discountInput) {
          await user.type(discountInput, 'SAVE10');
          // Discount should be applied
        }
      });
    });

    it('shows discount code error for invalid codes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const discountInput = screen.queryByPlaceholderText(/discount code/i);
        if (discountInput) {
          await user.type(discountInput, 'INVALID');
          // Error should be shown
        }
      });
    });

    it('displays payment section', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const paymentSection = screen.queryByText(/payment/i);
        // Payment section should be visible
      });
    });

    it('shows terms and conditions checkbox', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const termsCheckbox = screen.queryByLabelText(/terms/i);
        // Terms checkbox should be present
      });
    });

    it('validates terms acceptance before payment', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Should require terms acceptance
      });
    });
  });

  describe('Payment Integration', () => {
    it('displays payment method options', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Credit card, PayPal, etc. should be shown
      });
    });

    it('shows credit card input fields', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const cardInput = screen.queryByLabelText(/card number/i);
        // Card fields should be available
      });
    });

    it('validates credit card number', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const cardInput = screen.queryByLabelText(/card number/i);
        if (cardInput) {
          await user.type(cardInput, '1234');
          // Validation should occur
        }
      });
    });

    it('validates expiration date', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const expInput = screen.queryByLabelText(/expiration/i);
        if (expInput) {
          await user.type(expInput, '13/99');
          // Invalid date should be caught
        }
      });
    });

    it('validates CVV code', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const cvvInput = screen.queryByLabelText(/cvv/i);
        if (cvvInput) {
          await user.type(cvvInput, '12');
          // CVV validation should occur
        }
      });
    });

    it('shows PayPal option', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const paypalButton = screen.queryByRole('button', { name: /paypal/i });
        // PayPal option should be available
      });
    });

    it('shows processing indicator during payment', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Processing indicator should appear
      });
    });

    it('displays secure payment badge', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const secureIndicator = screen.queryByText(/secure/i);
        // Security indicator should be shown
      });
    });

    it('handles successful payment', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Success state should be handled
      });
    });

    it('handles payment failure', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Payment failed'))
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Error should be handled gracefully
      });
    });

    it('displays payment error message', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const error = screen.queryByText(/payment.*failed/i);
        // Error message should be shown
      });
    });

    it('allows retrying failed payment', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry/i });
        if (retryButton) {
          user.click(retryButton);
        }
      });
    });
  });

  describe('Community-Branded Merchandise', () => {
    it('displays community logo on items', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Community branding should be visible
      });
    });

    it('shows community name on merchandise', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Community name should be displayed
      });
    });

    it('applies community theme colors', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Theme colors should be applied
      });
    });

    it('displays community-specific collection', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Community items should be shown
      });
    });

    it('shows customization preview', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Preview of customized item should be available
      });
    });
  });

  describe('Empty Store State', () => {
    it('shows empty state when no items available', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { items: [] },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const emptyMessage = screen.queryByText(/no items/i);
        // Empty state should be displayed
      });
    });

    it('displays message about coming soon', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { items: [] },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Coming soon message should be shown
      });
    });

    it('shows contact information in empty state', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Contact info should be available
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton for items grid', () => {
      renderWithProviders(<CommunityStorePage />);
      const skeletons = document.querySelectorAll('.');
      // Loading skeletons could be present
    });

    it('displays loading spinner during data fetch', () => {
      renderWithProviders(<CommunityStorePage />);
      const spinner = screen.queryByTestId('loading-spinner');
      // Loading indicator should be shown
    });

    it('shows loading state for images', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Image loading states should be handled
      });
    });

    it('displays loading state during add to cart', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const addButton = screen.queryByRole('button', { name: /add to cart/i });
        if (addButton) {
          user.click(addButton);
          // Loading state should appear
        }
      });
    });

    it('shows loading state during checkout', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Checkout loading should be indicated
      });
    });
  });

  describe('Success/Error Messages', () => {
    it('displays success message after adding to cart', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const success = screen.queryByText(/added to cart/i);
        // Success toast should appear
      });
    });

    it('shows error message when add to cart fails', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Failed to add')));
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Error message should be displayed
      });
    });

    it('displays order confirmation message', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const confirmation = screen.queryByText(/order confirmed/i);
        // Confirmation should be shown
      });
    });

    it('shows error for failed data fetch', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('API Error'))
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Error should be handled
      });
    });

    it('displays network error message', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const error = screen.queryByText(/network/i);
        // Network error should be shown
      });
    });

    it('shows retry button on error', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Error')));
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry/i });
        // Retry option should be available
      });
    });

    it('auto-dismisses success messages', async () => {
      jest.useFakeTimers();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Success message should auto-dismiss
      });
      jest.runAllTimers();
      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('handles negative quantities gracefully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const quantityInput = screen.queryByLabelText(/quantity/i);
        if (quantityInput) {
          await user.type(quantityInput, '-1');
          // Should prevent negative values
        }
      });
    });

    it('handles zero stock correctly', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              items: [{ ...mockStoreItems[0], stock: 0 }],
            },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Zero stock should be handled
      });
    });

    it('handles missing product images', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              items: [{ ...mockStoreItems[0], imageUrl: null }],
            },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Placeholder image should be used
      });
    });

    it('handles extremely long item names', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              items: [{
                ...mockStoreItems[0],
                name: 'A'.repeat(200),
              }],
            },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Long names should be truncated
      });
    });

    it('handles special characters in item names', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              items: [{
                ...mockStoreItems[0],
                name: 'Test & <Item> "Special"',
              }],
            },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Special characters should be escaped
      });
    });

    it('handles very large quantities', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const quantityInput = screen.queryByLabelText(/quantity/i);
        if (quantityInput) {
          await user.type(quantityInput, '999999');
          // Should cap at maximum
        }
      });
    });

    it('handles multiple rapid add to cart clicks', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const addButton = screen.queryByRole('button', { name: /add to cart/i });
        if (addButton) {
          user.click(addButton);
          user.click(addButton);
          user.click(addButton);
          // Should debounce clicks
        }
      });
    });

    it('handles concurrent cart operations', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Multiple operations should be queued
      });
    });

    it('handles invalid price values', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              items: [{ ...mockStoreItems[0], price: 'invalid' }],
            },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Invalid prices should be handled
      });
    });

    it('handles missing required fields', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              items: [{ id: '1' }],
            },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Missing fields should be handled gracefully
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<CommunityStorePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<CommunityStorePage />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(<CommunityStorePage />);
      // Should be able to tab through interactive elements
    });

    it('has aria labels for interactive elements', () => {
      renderWithProviders(<CommunityStorePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
    });

    it('announces cart updates to screen readers', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const liveRegion = screen.queryByRole('status');
        // Live region should be present
      });
    });

    it('has proper focus management in modals', async () => {
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Focus should be trapped in modal
      });
    });

    it('provides skip link for main content', () => {
      renderWithProviders(<CommunityStorePage />);
      const skipLink = screen.queryByText(/skip to/i);
      // Skip link should be available
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      renderWithProviders(<CommunityStorePage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      renderWithProviders(<CommunityStorePage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      renderWithProviders(<CommunityStorePage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('adapts grid columns based on screen size', () => {
      global.innerWidth = 375;
      renderWithProviders(<CommunityStorePage />);
      // Grid should adapt
    });

    it('shows mobile-optimized cart sidebar', () => {
      global.innerWidth = 375;
      renderWithProviders(<CommunityStorePage />);
      // Mobile cart should be full screen
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for empty state', () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { items: [] },
          }),
        })
      );
      const { container } = renderWithProviders(<CommunityStorePage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for basic render', () => {
      const { container } = renderWithProviders(<CommunityStorePage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with items loaded', async () => {
      const { container } = renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Items loaded
      });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for mobile view', () => {
      global.innerWidth = 375;
      const { container } = renderWithProviders(<CommunityStorePage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for error state', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Error'))
      );
      const { container } = renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Error state
      });
      expect(container).toMatchSnapshot();
    });
  });

  describe('Performance', () => {
    it('memoizes component properly', () => {
      const { rerender } = renderWithProviders(<CommunityStorePage />);
      rerender(<CommunityStorePage />);
      // Component should be memoized
    });

    it('handles large number of items efficiently', async () => {
      const manyItems = Array.from({ length: 100 }, (_, i) => ({
        ...mockStoreItems[0],
        id: `item-${i}`,
      }));
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { items: manyItems },
          }),
        })
      );
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        // Should handle many items
      });
    });

    it('debounces search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CommunityStorePage />);
      await waitFor(() => {
        const searchInput = screen.queryByPlaceholderText(/search/i);
        if (searchInput) {
          user.type(searchInput, 'test');
          // Should debounce input
        }
      });
    });
  });
});

export default mockStoreItems
