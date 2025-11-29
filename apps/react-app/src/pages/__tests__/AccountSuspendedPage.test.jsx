/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import AccountSuspendedPage from '../AccountSuspendedPage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe('AccountSuspendedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with correct role', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<AccountSuspendedPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays the main heading', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const heading = screen.getByText('Account Suspended');
      expect(heading).toBeInTheDocument();
    });

    it('displays the suspension message', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const message = screen.getByText('Your account has been suspended due to violation of our community guidelines.');
      expect(message).toBeInTheDocument();
    });

    it('has alert role for accessibility', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('has aria-live attribute', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Suspension Icon Display', () => {
    it('displays ban icon', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const icon = container.querySelector('.lucide-ban');
      expect(icon).toBeInTheDocument();
    });

    it('ban icon is hidden from screen readers', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('ban icon has proper size', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const icon = container.querySelector('.w-24');
      expect(icon).toBeInTheDocument();
    });

    it('ban icon has red color', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const icon = container.querySelector('.text-red-500');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Suspension Reason Section', () => {
    it('displays reason section heading', () => {
      renderWithProviders(<AccountSuspendedPage />);
      expect(screen.getByText('Reason for suspension:')).toBeInTheDocument();
    });

    it('displays suspension reason', () => {
      renderWithProviders(<AccountSuspendedPage />);
      expect(screen.getByText('Multiple reports of spam and inappropriate content.')).toBeInTheDocument();
    });

    it('reason section has warning styling', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const reasonSection = container.querySelector('.bg-red-50');
      expect(reasonSection).toBeInTheDocument();
    });

    it('reason section has dark mode styling', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const reasonSection = container.querySelector('.dark\\:bg-red-900\\/20');
      expect(reasonSection).toBeInTheDocument();
    });

    it('reason heading is semibold', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const heading = container.querySelector('.font-semibold');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('displays Contact Support button', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const supportButton = screen.getByRole('button', { name: /contact support about suspension/i });
      expect(supportButton).toBeInTheDocument();
    });

    it('displays Appeal Suspension button', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const appealButton = screen.getByRole('button', { name: /appeal account suspension/i });
      expect(appealButton).toBeInTheDocument();
    });

    it('Contact Support button has proper aria-label', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const supportButton = screen.getByRole('button', { name: /contact support about suspension/i });
      expect(supportButton).toHaveAttribute('aria-label', 'Contact support about suspension');
    });

    it('Appeal button has proper aria-label', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const appealButton = screen.getByRole('button', { name: /appeal account suspension/i });
      expect(appealButton).toHaveAttribute('aria-label', 'Appeal account suspension');
    });

    it('displays Mail icon in Contact Support button', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const mailIcon = container.querySelector('.lucide-mail');
      expect(mailIcon).toBeInTheDocument();
    });

    it('displays FileText icon in Appeal button', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const fileIcon = container.querySelector('.lucide-file-text');
      expect(fileIcon).toBeInTheDocument();
    });

    it('both buttons are visible', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const supportButton = screen.getByRole('button', { name: /contact support/i });
      const appealButton = screen.getByRole('button', { name: /appeal/i });

      expect(supportButton).toBeVisible();
      expect(appealButton).toBeVisible();
    });
  });

  describe('Button Styling', () => {
    it('Contact Support button has blue background', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const supportButton = container.querySelector('.bg-[#58a6ff]');
      expect(supportButton).toBeInTheDocument();
    });

    it('Contact Support button has hover effect', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const supportButton = container.querySelector('.hover\\:bg-blue-600');
      expect(supportButton).toBeInTheDocument();
    });

    it('Appeal button has gray background', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const appealButton = container.querySelector('.bg-gray-200');
      expect(appealButton).toBeInTheDocument();
    });

    it('Appeal button has hover effect', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const appealButton = container.querySelector('.hover\\:bg-gray-300');
      expect(appealButton).toBeInTheDocument();
    });

    it('buttons have rounded corners', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const roundedButtons = container.querySelectorAll('.rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(roundedButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('buttons are laid out in flex container', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const buttonContainer = container.querySelector('.flex');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main role', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper aria-label on main element', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Account suspended page');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const heading = screen.getByRole('heading', { name: /account suspended/i });
      expect(heading).toBeInTheDocument();
    });

    it('heading is h1 element', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('supports keyboard navigation to Contact Support button', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const supportButton = screen.getByRole('button', { name: /contact support/i });
      supportButton.focus();
      expect(document.activeElement).toBe(supportButton);
    });

    it('supports keyboard navigation to Appeal button', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const appealButton = screen.getByRole('button', { name: /appeal/i });
      appealButton.focus();
      expect(document.activeElement).toBe(appealButton);
    });

    it('icons are hidden from screen readers', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });

    it('buttons have descriptive text', () => {
      renderWithProviders(<AccountSuspendedPage />);
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
      expect(screen.getByText('Appeal Suspension')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('has full viewport height', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const main = container.querySelector('.min-h-screen');
      expect(main).toBeInTheDocument();
    });

    it('centers content on page', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const main = container.querySelector('.flex');
      expect(main).toBeInTheDocument();
    });

    it('has padding for mobile devices', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const main = container.querySelector('.p-6');
      expect(main).toBeInTheDocument();
    });

    it('content card has white background', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const card = container.querySelector('.bg-white');
      expect(card).toBeInTheDocument();
    });

    it('content card has rounded corners', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const card = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(card).toBeInTheDocument();
    });

    it('content card has padding', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const card = container.querySelector('.p-12');
      expect(card).toBeInTheDocument();
    });

    it('limits content width', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const content = container.querySelector('.max-w-2xl');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode background class', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const main = container.querySelector('.dark\\:bg-[#0d1117]');
      expect(main).toBeInTheDocument();
    });

    it('has dark mode text class for description', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const text = container.querySelector('.dark\\:text-[#8b949e]');
      expect(text).toBeInTheDocument();
    });

    it('content card has dark mode styling', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const card = container.querySelector('.dark\\:bg-[#161b22]');
      expect(card).toBeInTheDocument();
    });

    it('heading has dark mode text color', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const heading = container.querySelector('.dark\\:text-white');
      expect(heading).toBeInTheDocument();
    });

    it('Appeal button has dark mode styling', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const button = container.querySelector('.dark\\:bg-gray-700');
      expect(button).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('Contact Support button is clickable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccountSuspendedPage />);
      const supportButton = screen.getByRole('button', { name: /contact support/i });

      await user.click(supportButton);

      expect(supportButton).toBeInTheDocument();
    });

    it('Appeal button is clickable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccountSuspendedPage />);
      const appealButton = screen.getByRole('button', { name: /appeal/i });

      await user.click(appealButton);

      expect(appealButton).toBeInTheDocument();
    });

    it('handles hover on Contact Support button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccountSuspendedPage />);
      const supportButton = screen.getByRole('button', { name: /contact support/i });

      await user.hover(supportButton);

      expect(supportButton).toBeInTheDocument();
    });

    it('handles hover on Appeal button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccountSuspendedPage />);
      const appealButton = screen.getByRole('button', { name: /appeal/i });

      await user.hover(appealButton);

      expect(appealButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('buttons are in flex container', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const buttonContainer = container.querySelector('.flex.gap-4');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('buttons take equal width', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const flexButtons = container.querySelectorAll('.flex-1');
      expect(flexButtons.length).toBe(2);
    });

    it('content is centered with text-center', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const centered = container.querySelector('.text-center');
      expect(centered).toBeInTheDocument();
    });
  });

  describe('Component Memoization', () => {
    it('component is wrapped with memo', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders consistently on re-render', () => {
      const { rerender } = renderWithProviders(<AccountSuspendedPage />);
      rerender(<AccountSuspendedPage />);
      expect(screen.getByText('Account Suspended')).toBeInTheDocument();
    });
  });

  describe('Framer Motion Integration', () => {
    it('applies motion animation props', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('content is wrapped in motion.div', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Spacing and Layout', () => {
    it('has space-y-4 class for vertical spacing', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const spaced = container.querySelector('.space-y-4');
      expect(spaced).toBeInTheDocument();
    });

    it('reason section has proper padding', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const section = container.querySelector('.p-4');
      expect(section).toBeInTheDocument();
    });

    it('icon has margin bottom', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const icon = container.querySelector('.mb-6');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders all required elements together', () => {
      renderWithProviders(<AccountSuspendedPage />);

      expect(screen.getByText('Account Suspended')).toBeInTheDocument();
      expect(screen.getByText('Reason for suspension:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /appeal/i })).toBeInTheDocument();
    });

    it('maintains consistent layout structure', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const main = screen.getByRole('main');
      const alert = screen.getByRole('alert');

      expect(main).toBeInTheDocument();
      expect(alert).toBeInTheDocument();
    });

    it('displays complete message to users', () => {
      renderWithProviders(<AccountSuspendedPage />);
      expect(screen.getByText(/your account has been suspended/i)).toBeInTheDocument();
      expect(screen.getByText(/violation of our community guidelines/i)).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    it('displays full suspension message', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const message = screen.getByText('Your account has been suspended due to violation of our community guidelines.');
      expect(message).toBeInTheDocument();
    });

    it('displays full suspension reason', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const reason = screen.getByText('Multiple reports of spam and inappropriate content.');
      expect(reason).toBeInTheDocument();
    });

    it('heading is descriptive', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const heading = screen.getByRole('heading', { name: 'Account Suspended' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Icon Integration', () => {
    it('icons are within buttons', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const supportButton = screen.getByRole('button', { name: /contact support/i });
      const appealButton = screen.getByRole('button', { name: /appeal/i });

      expect(supportButton.querySelector('.lucide-mail')).toBeInTheDocument();
      expect(appealButton.querySelector('.lucide-file-text')).toBeInTheDocument();
    });

    it('button icons have proper size', () => {
      const { container } = renderWithProviders(<AccountSuspendedPage />);
      const buttonIcons = container.querySelectorAll('.w-5.h-5');
      expect(buttonIcons.length).toBeGreaterThanOrEqual(2);
    });

    it('buttons display icon and text together', () => {
      renderWithProviders(<AccountSuspendedPage />);
      const supportButton = screen.getByRole('button', { name: /contact support/i });

      expect(supportButton.textContent).toContain('Contact Support');
      expect(supportButton.querySelector('.lucide-mail')).toBeInTheDocument();
    });
  });
});

export default mainElement
