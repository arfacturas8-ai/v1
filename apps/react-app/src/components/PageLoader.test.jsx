/**
 * Tests for PageLoader component
 */
import { render, screen } from '@testing-library/react';
import PageLoader from './PageLoader';

describe('PageLoader', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<PageLoader />);
    });

    it('renders loading text', () => {
      render(<PageLoader />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders logo with "C"', () => {
      render(<PageLoader />);
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('renders spinner element', () => {
      const { container } = render(<PageLoader />);
      const spinners = container.querySelectorAll('div[style*="animation"]');
      expect(spinners.length).toBeGreaterThan(0);
    });
  });

  describe('Full Screen Mode', () => {
    it('applies full screen styles when fullScreen is true', () => {
      const { container } = render(<PageLoader fullScreen={true} />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({ position: 'fixed' });
    });

    it('does not apply full screen styles by default', () => {
      const { container } = render(<PageLoader />);
      const mainDiv = container.firstChild;

      expect(mainDiv).not.toHaveStyle({ position: 'fixed' });
    });

    it('applies padding when not full screen', () => {
      const { container } = render(<PageLoader fullScreen={false} />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({ padding: '80px 20px' });
    });
  });

  describe('Styles', () => {
    it('has centered flex layout', () => {
      const { container } = render(<PageLoader />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
    });

    it('renders CSS animations in style tag', () => {
      const { container } = render(<PageLoader />);
      const styleTag = container.querySelector('style');

      expect(styleTag).toBeInTheDocument();
      expect(styleTag.textContent).toContain('@keyframes spin');
      expect(styleTag.textContent).toContain('@keyframes pulse');
    });

    it('logo has gradient background', () => {
      const { container } = render(<PageLoader />);
      const logo = screen.getByText('C');

      expect(logo).toHaveStyle({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      });
    });
  });

  describe('Props', () => {
    it('accepts fullScreen prop as true', () => {
      const { container } = render(<PageLoader fullScreen={true} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('accepts fullScreen prop as false', () => {
      const { container } = render(<PageLoader fullScreen={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('defaults fullScreen to false', () => {
      const { container } = render(<PageLoader />);
      const mainDiv = container.firstChild;

      expect(mainDiv).not.toHaveStyle({ position: 'fixed' });
    });
  });

  describe('Visual Elements', () => {
    it('renders three main visual elements', () => {
      const { container } = render(<PageLoader />);

      // Logo, Spinner, and Text
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      const spinners = container.querySelectorAll('div[style*="animation"]');
      expect(spinners.length).toBeGreaterThanOrEqual(2);
    });

    it('elements are arranged vertically', () => {
      const { container } = render(<PageLoader />);
      const innerContainer = container.querySelector('div > div');

      expect(innerContainer).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      });
    });

    it('has gap between elements', () => {
      const { container } = render(<PageLoader />);
      const innerContainer = container.querySelector('div > div');

      expect(innerContainer).toHaveStyle({ gap: '20px' });
    });
  });

  describe('Accessibility', () => {
    it('loading text is visible and readable', () => {
      render(<PageLoader />);
      const loadingText = screen.getByText('Loading...');

      expect(loadingText).toBeVisible();
    });

    it('has appropriate z-index in full screen mode', () => {
      const { container } = render(<PageLoader fullScreen={true} />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({ zIndex: '9999' });
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot in normal mode', () => {
      const { container } = render(<PageLoader />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in full screen mode', () => {
      const { container } = render(<PageLoader fullScreen={true} />);
      expect(container).toMatchSnapshot();
    });
  });
});

export default spinners
