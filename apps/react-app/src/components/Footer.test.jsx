/**
 * Tests for Footer component
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Footer', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<Footer />);
    });

    it('renders CRYB brand logo', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText('CRYB')).toBeInTheDocument();
    });

    it('renders platform description', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText(/next-generation community platform/i)).toBeInTheDocument();
    });

    it('renders copyright notice', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText(/© 2025 CRYB Platform/i)).toBeInTheDocument();
    });

    it('renders made with love text', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText(/Made with ❤️ by/i)).toBeInTheDocument();
      expect(screen.getByText('Cryb.ai')).toBeInTheDocument();
    });
  });

  describe('Section Headers', () => {
    it('renders Platform section header', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText('Platform')).toBeInTheDocument();
    });

    it('renders Support section header', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText('Support')).toBeInTheDocument();
    });

    it('renders Legal section header', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });
  });

  describe('Platform Links', () => {
    it('renders Communities link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Communities').closest('a');
      expect(link).toHaveAttribute('href', '/communities');
    });

    it('renders Live Chat link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Live Chat').closest('a');
      expect(link).toHaveAttribute('href', '/chat');
    });

    it('renders Users link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Users').closest('a');
      expect(link).toHaveAttribute('href', '/users');
    });

    it('renders Web3 & Crypto link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Web3 & Crypto').closest('a');
      expect(link).toHaveAttribute('href', '/crypto');
    });

    it('renders Token Economics link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Token Economics').closest('a');
      expect(link).toHaveAttribute('href', '/tokenomics');
    });
  });

  describe('Support Links', () => {
    it('renders Help Center link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Help Center').closest('a');
      expect(link).toHaveAttribute('href', '/help');
    });

    it('renders Contact Us link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Contact Us').closest('a');
      expect(link).toHaveAttribute('href', '/contact');
    });

    it('renders Bug Reports link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Bug Reports').closest('a');
      expect(link).toHaveAttribute('href', '/reports');
    });
  });

  describe('Legal Links', () => {
    it('renders Privacy Policy link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Privacy Policy').closest('a');
      expect(link).toHaveAttribute('href', '/privacy');
    });

    it('renders Terms of Service link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Terms of Service').closest('a');
      expect(link).toHaveAttribute('href', '/terms');
    });

    it('renders Community Guidelines link', () => {
      renderWithRouter(<Footer />);
      const link = screen.getByText('Community Guidelines').closest('a');
      expect(link).toHaveAttribute('href', '/guidelines');
    });
  });

  describe('Structure', () => {
    it('has 4 column grid', () => {
      const { container } = renderWithRouter(<Footer />);
      const grid = container.querySelector('.grid-cols-1.md\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('renders footer element', () => {
      const { container } = renderWithRouter(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('has border-t class', () => {
      const { container } = renderWithRouter(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('border-t');
    });

    it('has max-w-7xl container', () => {
      const { container } = renderWithRouter(<Footer />);
      const maxWidthContainer = container.querySelector('.max-w-7xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('has centered content', () => {
      const { container } = renderWithRouter(<Footer />);
      const centeredContainer = container.querySelector('.mx-auto');
      expect(centeredContainer).toBeInTheDocument();
    });
  });

  describe('Link Count', () => {
    it('renders all platform links (5)', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText('Communities')).toBeInTheDocument();
      expect(screen.getByText('Live Chat')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Web3 & Crypto')).toBeInTheDocument();
      expect(screen.getByText('Token Economics')).toBeInTheDocument();
    });

    it('renders all support links (3)', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText('Help Center')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
      expect(screen.getByText('Bug Reports')).toBeInTheDocument();
    });

    it('renders all legal links (3)', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Community Guidelines')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has correct padding classes', () => {
      const { container } = renderWithRouter(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('px-4', 'py-8');
    });

    it('has hover-text class on links', () => {
      const { container } = renderWithRouter(<Footer />);
      const links = container.querySelectorAll('.hover-text');
      expect(links.length).toBeGreaterThan(0);
    });

    it('brand has text-brand class', () => {
      const { container } = renderWithRouter(<Footer />);
      const brand = container.querySelector('.text-brand');
      expect(brand).toBeInTheDocument();
      expect(brand).toHaveClass('font-bold', 'text-xl');
    });

    it('section headers have font-semibold class', () => {
      const { container } = renderWithRouter(<Footer />);
      const headers = screen.getByText('Platform');
      expect(headers).toHaveClass('font-semibold');
    });
  });

  describe('Layout', () => {
    it('renders grid with gap', () => {
      const { container } = renderWithRouter(<Footer />);
      const grid = container.querySelector('.gap-8');
      expect(grid).toBeInTheDocument();
    });

    it('renders brand section with flex-col', () => {
      const { container } = renderWithRouter(<Footer />);
      const brandSection = screen.getByText('CRYB').closest('.flex.flex-col');
      expect(brandSection).toBeInTheDocument();
    });

    it('has bottom border on copyright section', () => {
      const { container } = renderWithRouter(<Footer />);
      const copyrightSection = screen.getByText(/© 2025 CRYB Platform/i).closest('.border-t');
      expect(copyrightSection).toBeInTheDocument();
    });
  });

  describe('Text Content', () => {
    it('description is correct length', () => {
      renderWithRouter(<Footer />);
      const description = screen.getByText(/next-generation community platform/i);
      expect(description.textContent.length).toBeGreaterThan(20);
    });

    it('renders all rights reserved', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });

    it('includes heart emoji', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText(/❤️/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('all links are accessible', () => {
      const { container } = renderWithRouter(<Footer />);
      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(10);
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('footer has semantic element', () => {
      const { container } = renderWithRouter(<Footer />);
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('sections use proper heading levels', () => {
      renderWithRouter(<Footer />);
      const headers = screen.getAllByRole('heading', { level: 3 });
      expect(headers.length).toBe(3);
    });
  });

  describe('Responsive Design', () => {
    it('has responsive grid classes', () => {
      const { container } = renderWithRouter(<Footer />);
      const grid = container.querySelector('.grid-cols-1');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('md:grid-cols-4');
    });

    it('maintains structure on mobile', () => {
      const { container } = renderWithRouter(<Footer />);
      const grid = container.querySelector('.grid-cols-1');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('all platform links navigate correctly', () => {
      renderWithRouter(<Footer />);

      expect(screen.getByText('Communities').closest('a')).toHaveAttribute('href', '/communities');
      expect(screen.getByText('Live Chat').closest('a')).toHaveAttribute('href', '/chat');
      expect(screen.getByText('Users').closest('a')).toHaveAttribute('href', '/users');
    });

    it('all support links navigate correctly', () => {
      renderWithRouter(<Footer />);

      expect(screen.getByText('Help Center').closest('a')).toHaveAttribute('href', '/help');
      expect(screen.getByText('Contact Us').closest('a')).toHaveAttribute('href', '/contact');
      expect(screen.getByText('Bug Reports').closest('a')).toHaveAttribute('href', '/reports');
    });

    it('all legal links navigate correctly', () => {
      renderWithRouter(<Footer />);

      expect(screen.getByText('Privacy Policy').closest('a')).toHaveAttribute('href', '/privacy');
      expect(screen.getByText('Terms of Service').closest('a')).toHaveAttribute('href', '/terms');
      expect(screen.getByText('Community Guidelines').closest('a')).toHaveAttribute('href', '/guidelines');
    });
  });

  describe('Brand Section', () => {
    it('renders brand name prominently', () => {
      renderWithRouter(<Footer />);
      const brand = screen.getByText('CRYB');
      expect(brand).toHaveClass('text-brand', 'font-bold', 'text-xl');
    });

    it('renders tagline under brand', () => {
      const { container } = renderWithRouter(<Footer />);
      const brandSection = screen.getByText('CRYB').closest('.flex.flex-col');
      expect(brandSection).toContainHTML('next-generation community platform');
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithRouter(<Footer />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for brand section', () => {
      const { container } = renderWithRouter(<Footer />);
      const brandSection = screen.getByText('CRYB').closest('.flex.flex-col');
      expect(brandSection).toMatchSnapshot();
    });

    it('matches snapshot for copyright section', () => {
      const { container } = renderWithRouter(<Footer />);
      const copyrightSection = screen.getByText(/© 2025 CRYB Platform/i).closest('.border-t');
      expect(copyrightSection).toMatchSnapshot();
    });
  });
});

export default renderWithRouter
