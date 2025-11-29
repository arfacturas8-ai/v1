/**
 * Tests for LoadingSkeleton components
 */
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  PostCardSkeleton,
  UserCardSkeleton,
  MessageSkeleton,
  CommunityCardSkeleton,
  TableRowSkeleton,
  PageSkeleton,
  LoadingSpinner,
  FullPageLoader
} from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  describe('Skeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies default width', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveStyle({ width: '100%' });
    });

    it('applies custom width', () => {
      const { container } = render(<Skeleton width="200px" />);
      expect(container.firstChild).toHaveStyle({ width: '200px' });
    });

    it('applies default height', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveStyle({ height: '20px' });
    });

    it('applies custom height', () => {
      const { container } = render(<Skeleton height="50px" />);
      expect(container.firstChild).toHaveStyle({ height: '50px' });
    });

    it('applies default border radius', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveStyle({ borderRadius: '4px' });
    });

    it('applies custom border radius', () => {
      const { container } = render(<Skeleton radius="8px" />);
      expect(container.firstChild).toHaveStyle({ borderRadius: '8px' });
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      expect(container.firstChild).toHaveClass('skeleton', 'custom-class');
    });

    it('applies custom styles', () => {
      const { container } = render(<Skeleton style={{ opacity: 0.5 }} />);
      expect(container.firstChild).toHaveStyle({ opacity: 0.5 });
    });

    it('has shimmer animation', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveStyle({ animation: 'shimmer 1.5s infinite' });
    });

    it('has gradient background', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveStyle({
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)'
      });
    });
  });

  describe('PostCardSkeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<PostCardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders avatar skeleton', () => {
      const { container } = render(<PostCardSkeleton />);
      const avatars = container.querySelectorAll('.skeleton');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('renders multiple skeleton elements', () => {
      const { container } = render(<PostCardSkeleton />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(5);
    });

    it('has padding and background', () => {
      const { container } = render(<PostCardSkeleton />);
      expect(container.firstChild).toHaveStyle({ padding: '16px' });
    });
  });

  describe('UserCardSkeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<UserCardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders avatar skeleton', () => {
      const { container } = render(<UserCardSkeleton />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('has correct structure', () => {
      const { container } = render(<UserCardSkeleton />);
      expect(container.firstChild).toHaveStyle({ padding: '16px' });
    });
  });

  describe('MessageSkeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<MessageSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders avatar and message skeletons', () => {
      const { container } = render(<MessageSkeleton />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('CommunityCardSkeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<CommunityCardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders image skeleton', () => {
      const { container } = render(<CommunityCardSkeleton />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('TableRowSkeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<TableRowSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders default 4 columns', () => {
      const { container } = render(<TableRowSkeleton />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons).toHaveLength(4);
    });

    it('renders custom number of columns', () => {
      const { container } = render(<TableRowSkeleton columns={6} />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons).toHaveLength(6);
    });

    it('renders 1 column', () => {
      const { container } = render(<TableRowSkeleton columns={1} />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons).toHaveLength(1);
    });

    it('renders 10 columns', () => {
      const { container } = render(<TableRowSkeleton columns={10} />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons).toHaveLength(10);
    });
  });

  describe('PageSkeleton', () => {
    describe('Feed Type', () => {
      it('renders feed skeleton', () => {
        const { container } = render(<PageSkeleton type="feed" />);
        expect(container.firstChild).toBeInTheDocument();
      });

      it('renders multiple post cards', () => {
        const { container } = render(<PageSkeleton type="feed" />);
        const posts = container.querySelectorAll('div[style*="padding: 16px"]');
        expect(posts.length).toBeGreaterThan(0);
      });
    });

    describe('Profile Type', () => {
      it('renders profile skeleton', () => {
        const { container } = render(<PageSkeleton type="profile" />);
        expect(container.firstChild).toBeInTheDocument();
      });

      it('renders header and content sections', () => {
        const { container } = render(<PageSkeleton type="profile" />);
        const skeletons = container.querySelectorAll('.skeleton');
        expect(skeletons.length).toBeGreaterThan(10);
      });
    });

    describe('Chat Type', () => {
      it('renders chat skeleton', () => {
        const { container } = render(<PageSkeleton type="chat" />);
        expect(container.firstChild).toBeInTheDocument();
      });

      it('has full height', () => {
        const { container } = render(<PageSkeleton type="chat" />);
        expect(container.firstChild).toHaveStyle({ height: '100vh' });
      });

      it('renders multiple messages', () => {
        const { container } = render(<PageSkeleton type="chat" />);
        const skeletons = container.querySelectorAll('.skeleton');
        expect(skeletons.length).toBeGreaterThan(10);
      });
    });

    describe('Grid Type', () => {
      it('renders grid skeleton', () => {
        const { container } = render(<PageSkeleton type="grid" />);
        expect(container.firstChild).toBeInTheDocument();
      });

      it('renders grid layout', () => {
        const { container } = render(<PageSkeleton type="grid" />);
        const grid = container.querySelector('div[style*="grid"]');
        expect(grid).toBeInTheDocument();
      });
    });

    describe('Default Type', () => {
      it('renders default skeleton', () => {
        const { container } = render(<PageSkeleton />);
        expect(container.firstChild).toBeInTheDocument();
      });

      it('renders default skeleton with explicit type', () => {
        const { container } = render(<PageSkeleton type="default" />);
        expect(container.firstChild).toBeInTheDocument();
      });

      it('renders basic content skeletons', () => {
        const { container } = render(<PageSkeleton />);
        const skeletons = container.querySelectorAll('.skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('LoadingSpinner', () => {
    it('renders without crashing', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies default size', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toHaveStyle({ width: '40px', height: '40px' });
    });

    it('applies custom size', () => {
      const { container } = render(<LoadingSpinner size={60} />);
      expect(container.firstChild).toHaveStyle({ width: '60px', height: '60px' });
    });

    it('applies default color', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toHaveStyle({ borderTop: '4px solid #3b82f6' });
    });

    it('applies custom color', () => {
      const { container } = render(<LoadingSpinner color="#ff0000" />);
      expect(container.firstChild).toHaveStyle({ borderTop: '4px solid #ff0000' });
    });

    it('has spin animation', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toHaveStyle({ animation: 'spin 1s linear infinite' });
    });

    it('has circular border radius', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toHaveStyle({ borderRadius: '50%' });
    });
  });

  describe('FullPageLoader', () => {
    it('renders without crashing', () => {
      render(<FullPageLoader />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders custom message', () => {
      render(<FullPageLoader message="Please wait..." />);
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('does not render message when empty', () => {
      render(<FullPageLoader message="" />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('renders loading spinner', () => {
      const { container } = render(<FullPageLoader />);
      const spinner = container.querySelector('div[style*="spin"]');
      expect(spinner).toBeInTheDocument();
    });

    it('has fixed position', () => {
      const { container } = render(<FullPageLoader />);
      expect(container.firstChild).toHaveStyle({ position: 'fixed' });
    });

    it('covers full viewport', () => {
      const { container } = render(<FullPageLoader />);
      expect(container.firstChild).toHaveStyle({
        width: '100%',
        height: '100%',
        top: '0',
        left: '0'
      });
    });

    it('has high z-index', () => {
      const { container } = render(<FullPageLoader />);
      expect(container.firstChild).toHaveStyle({ zIndex: '9998' });
    });

    it('centers content', () => {
      const { container } = render(<FullPageLoader />);
      expect(container.firstChild).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
    });
  });

  describe('Multiple Components', () => {
    it('renders multiple skeletons independently', () => {
      const { container } = render(
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </>
      );

      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('renders multiple card types together', () => {
      const { container } = render(
        <>
          <PostCardSkeleton />
          <UserCardSkeleton />
          <MessageSkeleton />
        </>
      );

      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(10);
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for Skeleton', () => {
      const { container } = render(<Skeleton />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for PostCardSkeleton', () => {
      const { container } = render(<PostCardSkeleton />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for LoadingSpinner', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for FullPageLoader', () => {
      const { container } = render(<FullPageLoader />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for PageSkeleton feed', () => {
      const { container } = render(<PageSkeleton type="feed" />);
      expect(container).toMatchSnapshot();
    });
  });
});

export default avatars
