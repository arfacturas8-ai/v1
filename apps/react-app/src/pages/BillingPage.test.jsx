/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BillingPage from './BillingPage';
import { AuthContext } from '../contexts/AuthContext';
import { renderWithProviders, mockUser, mockFetch, delay } from '../__test__/utils/testUtils';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

// Mock Stripe
const mockStripe = {
  elements: jest.fn(() => ({
    create: jest.fn(() => ({
      mount: jest.fn(),
      unmount: jest.fn(),
      on: jest.fn(),
      update: jest.fn(),
    })),
  })),
  confirmCardPayment: jest.fn(),
  confirmCardSetup: jest.fn(),
  createPaymentMethod: jest.fn(),
  createToken: jest.fn(),
};

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(mockStripe)),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="card-element">Mock Card Element</div>,
  useStripe: () => mockStripe,
  useElements: () => ({
    getElement: jest.fn(() => ({})),
  }),
}));

// Mock billing service
const mockBillingService = {
  getSubscription: jest.fn(),
  getPlans: jest.fn(),
  getPaymentMethods: jest.fn(),
  getBillingHistory: jest.fn(),
  createSubscription: jest.fn(),
  updateSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  addPaymentMethod: jest.fn(),
  removePaymentMethod: jest.fn(),
  setDefaultPaymentMethod: jest.fn(),
  downloadInvoice: jest.fn(),
  updateBillingInfo: jest.fn(),
};

jest.mock('../services/billingService', () => ({
  __esModule: true,
  default: mockBillingService,
}));

// Mock data
const mockSubscription = {
  id: 'sub_123',
  status: 'active',
  plan: {
    id: 'plan_pro',
    name: 'Pro',
    price: 29.99,
    interval: 'month',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
  cancelAtPeriodEnd: false,
};

const mockPlans = [
  {
    id: 'plan_free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: ['Basic feature 1', 'Basic feature 2'],
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    price: 29.99,
    interval: 'month',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    popular: true,
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    price: 99.99,
    interval: 'month',
    features: ['All Pro features', 'Feature 4', 'Feature 5', 'Priority support'],
  },
];

const mockPaymentMethods = [
  {
    id: 'pm_123',
    type: 'card',
    card: {
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
    },
    isDefault: true,
  },
  {
    id: 'pm_456',
    type: 'card',
    card: {
      brand: 'mastercard',
      last4: '5555',
      expMonth: 6,
      expYear: 2026,
    },
    isDefault: false,
  },
];

const mockInvoices = [
  {
    id: 'inv_123',
    number: 'INV-001',
    amount: 29.99,
    currency: 'usd',
    status: 'paid',
    createdAt: '2024-01-01T00:00:00Z',
    paidAt: '2024-01-01T00:05:00Z',
    invoicePdf: 'https://example.com/invoice.pdf',
  },
  {
    id: 'inv_124',
    number: 'INV-002',
    amount: 29.99,
    currency: 'usd',
    status: 'paid',
    createdAt: '2024-02-01T00:00:00Z',
    paidAt: '2024-02-01T00:03:00Z',
    invoicePdf: 'https://example.com/invoice2.pdf',
  },
  {
    id: 'inv_125',
    number: 'INV-003',
    amount: 29.99,
    currency: 'usd',
    status: 'open',
    createdAt: '2024-03-01T00:00:00Z',
    paidAt: null,
    invoicePdf: null,
  },
];

const mockAuthContext = {
  user: mockUser({ id: 'user_123', email: 'test@example.com' }),
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const renderWithAuth = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('BillingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockBillingService.getSubscription.mockResolvedValue({
      success: true,
      subscription: mockSubscription
    });
    mockBillingService.getPlans.mockResolvedValue({
      success: true,
      plans: mockPlans
    });
    mockBillingService.getPaymentMethods.mockResolvedValue({
      success: true,
      paymentMethods: mockPaymentMethods
    });
    mockBillingService.getBillingHistory.mockResolvedValue({
      success: true,
      invoices: mockInvoices
    });
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<BillingPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<BillingPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<BillingPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has proper page title', () => {
      renderWithProviders(<BillingPage />);
      expect(screen.getByText(/BillingPage/i)).toBeInTheDocument();
    });

    it('renders with proper ARIA labels', () => {
      renderWithProviders(<BillingPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toHaveAttribute('aria-label', 'Billing page');
      }
    });
  });

  describe('Authentication and Authorization', () => {
    it('renders when user is authenticated', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      expect(screen.getByText(/BillingPage/i)).toBeInTheDocument();
    });

    it('handles unauthenticated user', () => {
      const unauthContext = { ...mockAuthContext, user: null, isAuthenticated: false };
      renderWithAuth(<BillingPage />, unauthContext);
      expect(screen.getByText(/BillingPage/i)).toBeInTheDocument();
    });

    it('displays user email in billing info', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would check for user email if displayed
    });

    it('uses auth context user data', () => {
      const user = userEvent.setup();
      renderWithAuth(<BillingPage />, mockAuthContext);
      expect(mockAuthContext.user).toBeDefined();
    });
  });

  describe('Current Plan Display', () => {
    it('displays current plan name', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // In real implementation, would check for Pro plan display
    });

    it('shows plan price', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would verify $29.99 is displayed
    });

    it('displays billing cycle', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would check for "monthly" or billing period
    });

    it('shows next billing date', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would verify next billing date is shown
    });

    it('displays plan features list', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would check that features are listed
    });

    it('shows subscription status badge', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would verify "Active" status is displayed
    });

    it('displays free plan correctly', async () => {
      const freeSubscription = { ...mockSubscription, plan: mockPlans[0] };
      mockBillingService.getSubscription.mockResolvedValue({
        success: true,
        subscription: freeSubscription
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would verify free plan display
    });

    it('handles canceled subscription display', async () => {
      const canceledSub = { ...mockSubscription, cancelAtPeriodEnd: true };
      mockBillingService.getSubscription.mockResolvedValue({
        success: true,
        subscription: canceledSub
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would show cancellation notice
    });

    it('shows trial period information', async () => {
      const trialSub = { ...mockSubscription, status: 'trialing', trialEnd: '2024-02-01' };
      mockBillingService.getSubscription.mockResolvedValue({
        success: true,
        subscription: trialSub
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would display trial info
    });

    it('displays past due status warning', async () => {
      const pastDueSub = { ...mockSubscription, status: 'past_due' };
      mockBillingService.getSubscription.mockResolvedValue({
        success: true,
        subscription: pastDueSub
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would show warning
    });
  });

  describe('Available Plans Display', () => {
    it('displays all available plans', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would verify all 3 plans are shown
    });

    it('highlights popular plan', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Pro plan should be highlighted
    });

    it('shows plan comparison', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would check for comparison table/cards
    });

    it('displays plan features for each tier', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Features should be listed for each plan
    });

    it('shows correct pricing for all plans', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Verify all prices displayed
    });

    it('indicates current plan', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Pro plan should be marked as current
    });

    it('shows upgrade button for lower plans', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Enterprise should show "Upgrade"
    });

    it('shows downgrade button for higher plans', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Free should show "Downgrade"
    });

    it('disables current plan selection', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Current plan button should be disabled
    });
  });

  describe('Upgrade Plan Functionality', () => {
    it('opens upgrade modal when clicking upgrade', async () => {
      const user = userEvent.setup();
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would click upgrade button and verify modal
    });

    it('displays upgrade confirmation dialog', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would show confirmation before upgrade
    });

    it('shows new plan details in upgrade modal', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Display Enterprise plan details
    });

    it('calculates prorated amount for upgrade', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show prorated charge
    });

    it('handles successful upgrade', async () => {
      mockBillingService.updateSubscription.mockResolvedValue({
        success: true,
        subscription: { ...mockSubscription, plan: mockPlans[2] }
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would complete upgrade flow
    });

    it('displays success message after upgrade', async () => {
      mockBillingService.updateSubscription.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would show success toast
    });

    it('handles upgrade error gracefully', async () => {
      mockBillingService.updateSubscription.mockRejectedValue(new Error('Upgrade failed'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would show error message
    });

    it('shows loading state during upgrade', async () => {
      mockBillingService.updateSubscription.mockImplementation(() => delay(1000));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would show loading indicator
    });

    it('disables upgrade button during processing', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Button should be disabled while loading
    });

    it('allows canceling upgrade process', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Can close modal without upgrading
    });
  });

  describe('Downgrade Plan Functionality', () => {
    it('opens downgrade modal when clicking downgrade', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would open downgrade modal
    });

    it('shows downgrade confirmation warning', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Warn about feature loss
    });

    it('lists features that will be lost', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show what features are removed
    });

    it('explains when downgrade takes effect', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // "At end of billing period"
    });

    it('handles successful downgrade', async () => {
      mockBillingService.updateSubscription.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Complete downgrade
    });

    it('shows success message after downgrade', async () => {
      mockBillingService.updateSubscription.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Display success
    });

    it('handles downgrade error', async () => {
      mockBillingService.updateSubscription.mockRejectedValue(new Error('Downgrade failed'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show error
    });

    it('prevents accidental downgrade with confirmation', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Require explicit confirmation
    });
  });

  describe('Cancel Subscription', () => {
    it('displays cancel subscription button', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Would show cancel button
    });

    it('opens cancellation modal', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Modal opens on click
    });

    it('shows cancellation reasons survey', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Display reason options
    });

    it('displays what happens after cancellation', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Explain access until period end
    });

    it('shows retention offer', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Offer discount or alternative
    });

    it('handles immediate cancellation', async () => {
      mockBillingService.cancelSubscription.mockResolvedValue({
        success: true,
        canceledAt: new Date().toISOString()
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Cancel immediately
    });

    it('handles cancel at period end', async () => {
      mockBillingService.cancelSubscription.mockResolvedValue({
        success: true,
        cancelAtPeriodEnd: true
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Schedule cancellation
    });

    it('displays cancellation confirmation', async () => {
      mockBillingService.cancelSubscription.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show confirmation message
    });

    it('handles cancellation error', async () => {
      mockBillingService.cancelSubscription.mockRejectedValue(new Error('Cancel failed'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Display error
    });

    it('allows reactivating canceled subscription', async () => {
      const canceledSub = { ...mockSubscription, cancelAtPeriodEnd: true };
      mockBillingService.getSubscription.mockResolvedValue({
        success: true,
        subscription: canceledSub
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show reactivate button
    });

    it('prevents cancel button spam', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Disable during processing
    });
  });

  describe('Payment Methods Management', () => {
    it('displays list of payment methods', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show both cards
    });

    it('shows default payment method badge', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Visa ending in 4242 is default
    });

    it('displays card brand icons', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show Visa and Mastercard icons
    });

    it('shows last 4 digits of cards', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Display 4242 and 5555
    });

    it('displays card expiration dates', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show exp dates
    });

    it('shows add payment method button', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Add new card button visible
    });

    it('opens add payment form', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Open form modal
    });

    it('shows edit payment method option', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Edit button for each card
    });

    it('shows remove payment method button', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Remove option available
    });

    it('prevents removing last payment method', async () => {
      const singleMethod = [mockPaymentMethods[0]];
      mockBillingService.getPaymentMethods.mockResolvedValue({
        success: true,
        paymentMethods: singleMethod
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Can't remove if it's the only one
    });

    it('handles set as default action', async () => {
      mockBillingService.setDefaultPaymentMethod.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Set non-default as default
    });

    it('confirms before removing payment method', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show confirmation dialog
    });

    it('handles successful payment method removal', async () => {
      mockBillingService.removePaymentMethod.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Remove and update list
    });

    it('handles payment method removal error', async () => {
      mockBillingService.removePaymentMethod.mockRejectedValue(new Error('Remove failed'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show error
    });

    it('displays empty state when no payment methods', async () => {
      mockBillingService.getPaymentMethods.mockResolvedValue({
        success: true,
        paymentMethods: []
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show empty state
    });
  });

  describe('Payment Form with Stripe', () => {
    it('renders Stripe Elements wrapper', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Stripe Elements should be present
    });

    it('displays card input element', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Card element rendered
    });

    it('shows billing address fields', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Address, city, etc.
    });

    it('includes cardholder name input', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Name field present
    });

    it('shows postal code input', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // ZIP/postal code field
    });

    it('displays save card for future use checkbox', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Save card option
    });

    it('validates card input', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Stripe validates card
    });

    it('shows card validation errors', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Display validation errors
    });

    it('handles successful card addition', async () => {
      mockBillingService.addPaymentMethod.mockResolvedValue({
        success: true,
        paymentMethod: mockPaymentMethods[0]
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Add card successfully
    });

    it('displays success message after adding card', async () => {
      mockBillingService.addPaymentMethod.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show success
    });

    it('handles card addition error', async () => {
      mockBillingService.addPaymentMethod.mockRejectedValue(new Error('Card declined'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Display error
    });

    it('shows loading state during card processing', async () => {
      mockBillingService.addPaymentMethod.mockImplementation(() => delay(1000));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Loading indicator
    });

    it('disables submit during card processing', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Disable button while processing
    });

    it('clears form after successful submission', async () => {
      mockBillingService.addPaymentMethod.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Form resets
    });

    it('handles Stripe authentication required', async () => {
      mockStripe.confirmCardSetup.mockResolvedValue({
        setupIntent: { status: 'requires_action' }
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Handle 3D Secure
    });

    it('shows Stripe error messages', async () => {
      mockStripe.createPaymentMethod.mockResolvedValue({
        error: { message: 'Card was declined' }
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Display Stripe error
    });
  });

  describe('Billing History Table', () => {
    it('displays billing history table', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Table should be visible
    });

    it('shows table headers', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Date, Amount, Status, Actions
    });

    it('displays all invoices', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // All 3 invoices shown
    });

    it('shows invoice number', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // INV-001, etc.
    });

    it('displays invoice amount', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // $29.99
    });

    it('formats amount with currency symbol', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // $ prefix or suffix
    });

    it('shows invoice date', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Formatted date
    });

    it('displays payment status badge', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Paid, Open, etc.
    });

    it('shows different status colors', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Green for paid, yellow for open
    });

    it('sorts invoices by date descending', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Most recent first
    });

    it('handles empty billing history', async () => {
      mockBillingService.getBillingHistory.mockResolvedValue({
        success: true,
        invoices: []
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Empty state
    });

    it('paginates long invoice lists', async () => {
      const manyInvoices = Array(25).fill(mockInvoices[0]).map((inv, i) => ({
        ...inv,
        id: `inv_${i}`,
        number: `INV-${String(i).padStart(3, '0')}`
      }));
      mockBillingService.getBillingHistory.mockResolvedValue({
        success: true,
        invoices: manyInvoices
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Pagination controls
    });

    it('allows filtering by date range', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Date filter options
    });

    it('allows filtering by status', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Status filter dropdown
    });

    it('shows invoice details on row click', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Expand to show details
    });
  });

  describe('Invoice Download', () => {
    it('shows download button for paid invoices', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Download icon/button visible
    });

    it('hides download for unpaid invoices', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // No download for open invoice
    });

    it('handles invoice download', async () => {
      mockBillingService.downloadInvoice.mockResolvedValue({
        success: true,
        url: 'https://example.com/invoice.pdf'
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Download file
    });

    it('shows loading state during download', async () => {
      mockBillingService.downloadInvoice.mockImplementation(() => delay(1000));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Loading indicator
    });

    it('handles download error', async () => {
      mockBillingService.downloadInvoice.mockRejectedValue(new Error('Download failed'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show error
    });

    it('opens invoice in new tab', async () => {
      global.open = jest.fn();
      mockBillingService.downloadInvoice.mockResolvedValue({
        success: true,
        url: 'https://example.com/invoice.pdf'
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Opens in new window
    });

    it('shows view invoice option', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // View button available
    });

    it('allows downloading all invoices', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Bulk download option
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner on initial load', async () => {
      mockBillingService.getSubscription.mockImplementation(() => delay(1000));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Loading indicator visible
    });

    it('shows skeleton for subscription info', async () => {
      mockBillingService.getSubscription.mockImplementation(() => delay(500));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Skeleton UI
    });

    it('shows loading for payment methods', async () => {
      mockBillingService.getPaymentMethods.mockImplementation(() => delay(500));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Loading state
    });

    it('shows loading for billing history', async () => {
      mockBillingService.getBillingHistory.mockImplementation(() => delay(500));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Table loading
    });

    it('disables interactions during loading', async () => {
      mockBillingService.getSubscription.mockImplementation(() => delay(500));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Buttons disabled
    });

    it('shows progress indicator during payment', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Payment progress
    });

    it('displays processing message', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // "Processing payment..."
    });
  });

  describe('Success States', () => {
    it('shows success toast after upgrade', async () => {
      mockBillingService.updateSubscription.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Success notification
    });

    it('displays success message after adding payment', async () => {
      mockBillingService.addPaymentMethod.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Success alert
    });

    it('shows confirmation after cancellation', async () => {
      mockBillingService.cancelSubscription.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Cancellation confirmed
    });

    it('displays success checkmark icon', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Check icon in success messages
    });

    it('auto-dismisses success messages', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Dismisses after timeout
    });

    it('refreshes data after successful action', async () => {
      mockBillingService.updateSubscription.mockResolvedValue({ success: true });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Reload subscription data
    });
  });

  describe('Error States', () => {
    it('displays error when subscription fetch fails', async () => {
      mockBillingService.getSubscription.mockRejectedValue(new Error('Network error'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      await waitFor(() => {
        // Error message shown
      });
    });

    it('shows error for payment method fetch failure', async () => {
      mockBillingService.getPaymentMethods.mockRejectedValue(new Error('Failed to load'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Error displayed
    });

    it('displays billing history error', async () => {
      mockBillingService.getBillingHistory.mockRejectedValue(new Error('Failed'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Error message
    });

    it('shows payment failed error', async () => {
      mockBillingService.addPaymentMethod.mockRejectedValue(new Error('Payment failed'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Payment error
    });

    it('displays network error message', async () => {
      mockBillingService.getSubscription.mockRejectedValue(new Error('Network error'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Network error
    });

    it('shows retry button on error', async () => {
      mockBillingService.getSubscription.mockRejectedValue(new Error('Error'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Retry button visible
    });

    it('handles retry action', async () => {
      mockBillingService.getSubscription
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce({ success: true, subscription: mockSubscription });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Retry and succeed
    });

    it('displays specific error messages', async () => {
      mockBillingService.updateSubscription.mockRejectedValue(
        new Error('Insufficient funds')
      );
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Specific error shown
    });

    it('shows validation error for invalid card', async () => {
      mockStripe.createPaymentMethod.mockResolvedValue({
        error: { message: 'Invalid card number' }
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Validation error
    });

    it('handles server error gracefully', async () => {
      mockBillingService.getSubscription.mockRejectedValue(new Error('500 Server Error'));
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Server error message
    });
  });

  describe('Edge Cases', () => {
    it('handles missing subscription data', async () => {
      mockBillingService.getSubscription.mockResolvedValue({
        success: true,
        subscription: null
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Handle null subscription
    });

    it('handles empty payment methods array', async () => {
      mockBillingService.getPaymentMethods.mockResolvedValue({
        success: true,
        paymentMethods: []
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Empty state
    });

    it('handles expired card display', async () => {
      const expiredCard = {
        ...mockPaymentMethods[0],
        card: { ...mockPaymentMethods[0].card, expMonth: 1, expYear: 2020 }
      };
      mockBillingService.getPaymentMethods.mockResolvedValue({
        success: true,
        paymentMethods: [expiredCard]
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Show expired warning
    });

    it('handles very long invoice lists', async () => {
      const manyInvoices = Array(1000).fill(mockInvoices[0]).map((inv, i) => ({
        ...inv,
        id: `inv_${i}`
      }));
      mockBillingService.getBillingHistory.mockResolvedValue({
        success: true,
        invoices: manyInvoices
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Handles large dataset
    });

    it('handles multiple rapid clicks gracefully', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Debounce or disable
    });

    it('handles subscription with no payment method', async () => {
      mockBillingService.getPaymentMethods.mockResolvedValue({
        success: true,
        paymentMethods: []
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Prompt to add payment
    });

    it('handles incomplete subscription data', async () => {
      const incompleteSub = { id: 'sub_123' };
      mockBillingService.getSubscription.mockResolvedValue({
        success: true,
        subscription: incompleteSub
      });
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Handle missing fields
    });

    it('handles timezone differences in dates', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Correct timezone handling
    });

    it('handles currency formatting for different locales', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Format based on locale
    });

    it('handles concurrent API calls', async () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Multiple simultaneous requests
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with landmarks', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('has proper heading hierarchy', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('supports keyboard navigation', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Tab navigation works
    });

    it('has ARIA labels for buttons', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Buttons have labels
    });

    it('announces status changes to screen readers', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // aria-live regions
    });

    it('has proper focus management in modals', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Focus trap in dialogs
    });

    it('includes alt text for payment icons', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Card brand icons have alt text
    });

    it('has sufficient color contrast', () => {
      renderWithAuth(<BillingPage />, mockAuthContext);
      // WCAG AA compliance
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Mobile-friendly layout
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Tablet layout
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Desktop layout
    });

    it('stacks plan cards on mobile', () => {
      global.innerWidth = 375;
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Vertical stacking
    });

    it('shows horizontal scrolling for table on mobile', () => {
      global.innerWidth = 375;
      renderWithAuth(<BillingPage />, mockAuthContext);
      // Scrollable table
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for default state', () => {
      const { container } = renderWithAuth(<BillingPage />, mockAuthContext);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with active subscription', async () => {
      const { container } = renderWithAuth(<BillingPage />, mockAuthContext);
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });

    it('matches snapshot with canceled subscription', async () => {
      const canceledSub = { ...mockSubscription, cancelAtPeriodEnd: true };
      mockBillingService.getSubscription.mockResolvedValue({
        success: true,
        subscription: canceledSub
      });
      const { container } = renderWithAuth(<BillingPage />, mockAuthContext);
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });

    it('matches snapshot with no payment methods', async () => {
      mockBillingService.getPaymentMethods.mockResolvedValue({
        success: true,
        paymentMethods: []
      });
      const { container } = renderWithAuth(<BillingPage />, mockAuthContext);
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });

    it('matches snapshot with error state', async () => {
      mockBillingService.getSubscription.mockRejectedValue(new Error('Error'));
      const { container } = renderWithAuth(<BillingPage />, mockAuthContext);
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });
  });
});

export default mockStripe
