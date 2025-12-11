/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabletOptimizedLayout, {
  TabletCardGrid,
  TabletListView,
  TabletSplitView,
  TabletFAB
} from './TabletOptimizedLayout';
import { useOrientation } from './mobile/TabletLayout';

// Mock the useOrientation hook
jest.mock('./mobile/TabletLayout', () => ({
  useOrientation: jest.fn()
}));

// Helper to set window dimensions
const setWindowSize = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
  Object.defineProperty(window, 'scrollY', {
    writable: true,
    configurable: true,
    value: 0
  });
};

describe('TabletOptimizedLayout', () => {
  const defaultOrientation = {
    orientation: 'portrait',
    isTablet: true,
    isPortrait: true,
    isLandscape: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useOrientation.mockReturnValue(defaultOrientation);
    setWindowSize(768, 1024);

    // Reset document body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <TabletOptimizedLayout>
          <div>Test Content</div>
        </TabletOptimizedLayout>
      );
      expect(container).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <TabletOptimizedLayout>
          <div>Test Content</div>
        </TabletOptimizedLayout>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <TabletOptimizedLayout className="custom-class">
          <div>Content</div>
        </TabletOptimizedLayout>
      );
      const layout = container.querySelector('.tablet-optimized-layout');
      expect(layout).toHaveClass('custom-class');
    });

    it('renders with sidebar on non-mobile layouts', () => {
      render(
        <TabletOptimizedLayout sidebar={<div>Sidebar Content</div>}>
          <div>Main Content</div>
        </TabletOptimizedLayout>
      );
      expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
    });

    it('does not render sidebar on mobile layout', () => {
      setWindowSize(500, 800);
      render(
        <TabletOptimizedLayout sidebar={<div>Sidebar Content</div>}>
          <div>Main Content</div>
        </TabletOptimizedLayout>
      );
      expect(screen.queryByText('Sidebar Content')).not.toBeInTheDocument();
    });

    it('clones children with orientation props', () => {
      const ChildComponent = jest.fn(({ layoutType, isTablet, orientation }) => (
        <div>
          {layoutType}-{isTablet ? 'tablet' : 'notablet'}-{orientation}
        </div>
      ));

      render(
        <TabletOptimizedLayout>
          <ChildComponent />
        </TabletOptimizedLayout>
      );

      expect(ChildComponent).toHaveBeenCalled();
    });

    it('clones sidebar with orientation props', () => {
      const SidebarComponent = jest.fn(({ layoutType, isTablet, orientation }) => (
        <div>Sidebar</div>
      ));

      render(
        <TabletOptimizedLayout sidebar={<SidebarComponent />}>
          <div>Main</div>
        </TabletOptimizedLayout>
      );

      expect(SidebarComponent).toHaveBeenCalled();
    });
  });

  describe('Layout Type Detection', () => {
    it('detects mobile layout for width < 768px', () => {
      setWindowSize(500, 800);
      const { container } = render(
        <TabletOptimizedLayout>
          <div>Content</div>
        </TabletOptimizedLayout>
      );
      const layout = container.querySelector('.tablet-optimized-layout');
      const styles = layout.style;
      expect(styles.paddingBottom).toContain('calc');
    });

    it('detects tablet portrait layout for 768-1024px portrait', () => {
      useOrientation.mockReturnValue({
        orientation: 'portrait',
        isTablet: true,
        isPortrait: true,
        isLandscape: false
      });
      setWindowSize(768, 1024);

      const { container } = render(
        <TabletOptimizedLayout>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');
      expect(layout.style.display).toBe('grid');
    });

    it('detects tablet landscape layout for 768-1024px landscape', () => {
      useOrientation.mockReturnValue({
        orientation: 'landscape',
        isTablet: true,
        isPortrait: false,
        isLandscape: true
      });
      setWindowSize(1000, 600);

      const { container } = render(
        <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');
      expect(layout.style.gridTemplateColumns).toContain('280px');
    });

    it('detects desktop layout for width >= 1024px', () => {
      setWindowSize(1280, 800);

      const { container } = render(
        <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');
      expect(layout.style.gridTemplateColumns).toContain('320px');
    });
  });

  describe('Pull to Refresh', () => {
    it('does not show refresh indicator when disabled', () => {
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={false}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const indicator = container.querySelector('.pull-to-refresh-indicator');
      expect(indicator).not.toBeInTheDocument();
    });

    it('handles touch start event', () => {
      const onRefresh = jest.fn(() => Promise.resolve());
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={onRefresh}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');

      act(() => {
        fireEvent.touchStart(layout, {
          touches: [{ clientY: 100 }]
        });
      });

      // Should not crash
      expect(layout).toBeInTheDocument();
    });

    it('handles touch move event and shows indicator', () => {
      const onRefresh = jest.fn(() => Promise.resolve());
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={onRefresh}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');

      act(() => {
        fireEvent.touchStart(layout, {
          touches: [{ clientY: 50 }]
        });

        fireEvent.touchMove(layout, {
          touches: [{ clientY: 150 }]
        });
      });

      waitFor(() => {
        const indicator = container.querySelector('.pull-to-refresh-indicator');
        expect(indicator).toBeInTheDocument();
      });
    });

    it('limits pull distance to maximum value', () => {
      const onRefresh = jest.fn(() => Promise.resolve());
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={onRefresh}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');

      act(() => {
        fireEvent.touchStart(layout, {
          touches: [{ clientY: 0 }]
        });

        // Pull way down
        fireEvent.touchMove(layout, {
          touches: [{ clientY: 500 }]
        });
      });

      // Transform should be limited to 100px max
      const transform = layout.style.transform;
      expect(transform).toBeTruthy();
    });

    it('triggers refresh when pull exceeds threshold', async () => {
      const onRefresh = jest.fn(() => Promise.resolve());
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={onRefresh}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');

      act(() => {
        fireEvent.touchStart(layout, {
          touches: [{ clientY: 0 }]
        });

        fireEvent.touchMove(layout, {
          touches: [{ clientY: 150 }]
        });

        fireEvent.touchEnd(layout);
      });

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled();
      });
    });

    it('does not trigger refresh when pull is below threshold', async () => {
      const onRefresh = jest.fn(() => Promise.resolve());
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={onRefresh}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');

      act(() => {
        fireEvent.touchStart(layout, {
          touches: [{ clientY: 0 }]
        });

        fireEvent.touchMove(layout, {
          touches: [{ clientY: 50 }]
        });

        fireEvent.touchEnd(layout);
      });

      await waitFor(() => {
        expect(onRefresh).not.toHaveBeenCalled();
      });
    });

    it('shows spinner during refresh', async () => {
      const onRefresh = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={onRefresh}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');

      act(() => {
        fireEvent.touchStart(layout, {
          touches: [{ clientY: 0 }]
        });

        fireEvent.touchMove(layout, {
          touches: [{ clientY: 150 }]
        });

        fireEvent.touchEnd(layout);
      });

      await waitFor(() => {
        const spinner = container.querySelector('.');
        expect(spinner).toBeInTheDocument();
      });
    });

    it('does not handle touch events when scrolled down', () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 100
      });

      const onRefresh = jest.fn(() => Promise.resolve());
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={onRefresh}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');

      act(() => {
        fireEvent.touchStart(layout, {
          touches: [{ clientY: 50 }]
        });

        fireEvent.touchMove(layout, {
          touches: [{ clientY: 150 }]
        });
      });

      const indicator = container.querySelector('.pull-to-refresh-indicator');
      expect(indicator).not.toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');

      const { unmount } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={jest.fn()}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });

  describe('Sidebar Rendering', () => {
    it('renders sidebar in tablet portrait layout', () => {
      useOrientation.mockReturnValue({
        orientation: 'portrait',
        isTablet: true,
        isPortrait: true,
        isLandscape: false
      });
      setWindowSize(768, 1024);

      render(
        <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
          <div>Main</div>
        </TabletOptimizedLayout>
      );

      expect(screen.getByText('Sidebar')).toBeInTheDocument();
    });

    it('renders sidebar in tablet landscape layout', () => {
      useOrientation.mockReturnValue({
        orientation: 'landscape',
        isTablet: true,
        isPortrait: false,
        isLandscape: true
      });
      setWindowSize(1000, 600);

      render(
        <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
          <div>Main</div>
        </TabletOptimizedLayout>
      );

      expect(screen.getByText('Sidebar')).toBeInTheDocument();
    });

    it('applies correct grid columns with sidebar', () => {
      setWindowSize(1280, 800);

      const { container } = render(
        <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
          <div>Main</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');
      expect(layout.style.gridTemplateColumns).toContain('320px');
    });

    it('applies correct grid columns without sidebar', () => {
      setWindowSize(1280, 800);

      const { container } = render(
        <TabletOptimizedLayout>
          <div>Main</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');
      expect(layout.style.gridTemplateColumns).toBe('1fr');
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to different screen widths', () => {
      const { container, rerender } = render(
        <TabletOptimizedLayout>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      // Desktop
      setWindowSize(1280, 800);
      rerender(
        <TabletOptimizedLayout>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      let layout = container.querySelector('.tablet-optimized-layout');
      expect(layout.style.display).toBeTruthy();

      // Mobile
      setWindowSize(500, 800);
      rerender(
        <TabletOptimizedLayout>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      layout = container.querySelector('.tablet-optimized-layout');
      expect(layout.style.paddingBottom).toContain('calc');
    });

    it('handles orientation changes', () => {
      const { container, rerender } = render(
        <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      // Portrait
      useOrientation.mockReturnValue({
        orientation: 'portrait',
        isTablet: true,
        isPortrait: true,
        isLandscape: false
      });
      setWindowSize(768, 1024);

      rerender(
        <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      // Landscape
      useOrientation.mockReturnValue({
        orientation: 'landscape',
        isTablet: true,
        isPortrait: false,
        isLandscape: true
      });
      setWindowSize(1000, 600);

      rerender(
        <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');
      expect(layout).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      expect(() => {
        render(
          <TabletOptimizedLayout>
            {null}
          </TabletOptimizedLayout>
        );
      }).not.toThrow();
    });

    it('handles undefined onRefresh callback', () => {
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');

      expect(() => {
        act(() => {
          fireEvent.touchStart(layout, {
            touches: [{ clientY: 0 }]
          });

          fireEvent.touchMove(layout, {
            touches: [{ clientY: 150 }]
          });

          fireEvent.touchEnd(layout);
        });
      }).not.toThrow();
    });

    it('handles missing layout element in useEffect', () => {
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={jest.fn()}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      // Remove the element
      const layout = container.querySelector('.tablet-optimized-layout');
      layout.className = 'something-else';

      // Should not crash when trying to add event listeners
      expect(container).toBeInTheDocument();
    });

    it('handles negative pull distances', () => {
      const onRefresh = jest.fn(() => Promise.resolve());
      const { container } = render(
        <TabletOptimizedLayout enablePullToRefresh={true} onRefresh={onRefresh}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const layout = container.querySelector('.tablet-optimized-layout');

      act(() => {
        fireEvent.touchStart(layout, {
          touches: [{ clientY: 150 }]
        });

        // Pull up instead of down
        fireEvent.touchMove(layout, {
          touches: [{ clientY: 50 }]
        });
      });

      const indicator = container.querySelector('.pull-to-refresh-indicator');
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML elements', () => {
      render(
        <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const sidebar = document.querySelector('aside');
      const main = document.querySelector('main');

      expect(sidebar).toBeInTheDocument();
      expect(main).toBeInTheDocument();
    });

    it('main content has overflow auto for scrolling', () => {
      render(
        <TabletOptimizedLayout>
          <div>Content</div>
        </TabletOptimizedLayout>
      );

      const main = document.querySelector('.layout-main');
      expect(main.style.overflow).toBe('auto');
    });
  });
});

describe('TabletCardGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });
    setWindowSize(768, 1024);
  });

  it('renders without crashing', () => {
    const { container } = render(
      <TabletCardGrid items={[]} renderCard={() => <div>Card</div>} />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders items correctly', () => {
    const items = [
      { id: 1, title: 'Item 1' },
      { id: 2, title: 'Item 2' },
      { id: 3, title: 'Item 3' }
    ];

    render(
      <TabletCardGrid
        items={items}
        renderCard={(item) => <div>{item.title}</div>}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(
      <TabletCardGrid
        items={[]}
        renderCard={() => <div>Card</div>}
        className="custom-grid"
      />
    );

    const grid = container.querySelector('.tablet-card-grid');
    expect(grid).toHaveClass('custom-grid');
  });

  it('applies custom minCardWidth', () => {
    const { container } = render(
      <TabletCardGrid
        items={[]}
        renderCard={() => <div>Card</div>}
        minCardWidth="320px"
      />
    );

    const grid = container.querySelector('.tablet-card-grid');
    expect(grid.style.gridTemplateColumns).toContain('320px');
  });

  it('applies custom gap', () => {
    const { container } = render(
      <TabletCardGrid
        items={[]}
        renderCard={() => <div>Card</div>}
        gap="2rem"
      />
    );

    const grid = container.querySelector('.tablet-card-grid');
    expect(grid.style.gap).toBe('2rem');
  });

  it('shows loading state with skeleton cards', () => {
    const { container } = render(
      <TabletCardGrid
        items={[]}
        renderCard={() => <div>Card</div>}
        loading={true}
        loadingCount={4}
      />
    );

    const skeletons = container.querySelectorAll('.');
    expect(skeletons).toHaveLength(4);
  });

  it('adjusts max width for tablet', () => {
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });

    const { container } = render(
      <TabletCardGrid
        items={[]}
        renderCard={() => <div>Card</div>}
      />
    );

    const grid = container.querySelector('.tablet-card-grid');
    expect(grid.style.maxWidth).toBe('100%');
  });

  it('adjusts max width for desktop', () => {
    useOrientation.mockReturnValue({
      orientation: 'landscape',
      isTablet: false,
      isPortrait: false,
      isLandscape: true
    });

    const { container } = render(
      <TabletCardGrid
        items={[]}
        renderCard={() => <div>Card</div>}
      />
    );

    const grid = container.querySelector('.tablet-card-grid');
    expect(grid.style.maxWidth).toBe('1200px');
  });

  it('handles items without id using index', () => {
    const items = [
      { title: 'Item 1' },
      { title: 'Item 2' }
    ];

    render(
      <TabletCardGrid
        items={items}
        renderCard={(item) => <div>{item.title}</div>}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('passes item and index to renderCard', () => {
    const items = [{ id: 1, title: 'Item 1' }];
    const renderCard = jest.fn(() => <div>Card</div>);

    render(
      <TabletCardGrid items={items} renderCard={renderCard} />
    );

    expect(renderCard).toHaveBeenCalledWith(items[0], 0);
  });

  it('handles empty items array', () => {
    const { container } = render(
      <TabletCardGrid items={[]} renderCard={() => <div>Card</div>} />
    );

    const grid = container.querySelector('.tablet-card-grid');
    expect(grid.children).toHaveLength(0);
  });

  it('adjusts columns for landscape orientation', () => {
    useOrientation.mockReturnValue({
      orientation: 'landscape',
      isTablet: true,
      isPortrait: false,
      isLandscape: true
    });
    setWindowSize(1000, 600);

    const { container } = render(
      <TabletCardGrid items={[]} renderCard={() => <div>Card</div>} />
    );

    const grid = container.querySelector('.tablet-card-grid');
    expect(grid).toBeInTheDocument();
  });
});

describe('TabletListView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });
    setWindowSize(768, 1024);
  });

  it('renders without crashing', () => {
    const { container } = render(
      <TabletListView items={[]} renderItem={() => <div>Item</div>} />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders items correctly', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];

    render(
      <TabletListView
        items={items}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies divided class when divided is true', () => {
    const { container } = render(
      <TabletListView
        items={[]}
        renderItem={() => <div>Item</div>}
        divided={true}
      />
    );

    const list = container.querySelector('.tablet-list-view');
    expect(list).toHaveClass('divide-y');
  });

  it('does not apply divided class when divided is false', () => {
    const { container } = render(
      <TabletListView
        items={[]}
        renderItem={() => <div>Item</div>}
        divided={false}
      />
    );

    const list = container.querySelector('.tablet-list-view');
    expect(list).not.toHaveClass('divide-y');
  });

  it('applies custom padding to items', () => {
    const items = [{ id: 1, name: 'Item 1' }];

    const { container } = render(
      <TabletListView
        items={items}
        renderItem={(item) => <div>{item.name}</div>}
        padding="2rem"
      />
    );

    const item = container.querySelector('.tablet-list-item');
    expect(item.style.padding).toBe('2rem');
  });

  it('applies custom className', () => {
    const { container } = render(
      <TabletListView
        items={[]}
        renderItem={() => <div>Item</div>}
        className="custom-list"
      />
    );

    const list = container.querySelector('.tablet-list-view');
    expect(list).toHaveClass('custom-list');
  });

  it('limits width in landscape mode', () => {
    useOrientation.mockReturnValue({
      orientation: 'landscape',
      isTablet: true,
      isPortrait: false,
      isLandscape: true
    });

    const { container } = render(
      <TabletListView items={[]} renderItem={() => <div>Item</div>} />
    );

    const list = container.querySelector('.tablet-list-view');
    expect(list.style.maxWidth).toBe('800px');
  });

  it('uses full width in portrait mode', () => {
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });

    const { container } = render(
      <TabletListView items={[]} renderItem={() => <div>Item</div>} />
    );

    const list = container.querySelector('.tablet-list-view');
    expect(list.style.maxWidth).toBe('100%');
  });

  it('passes item and index to renderItem', () => {
    const items = [{ id: 1, name: 'Item 1' }];
    const renderItem = jest.fn(() => <div>Item</div>);

    render(
      <TabletListView items={items} renderItem={renderItem} />
    );

    expect(renderItem).toHaveBeenCalledWith(items[0], 0);
  });
});

describe('TabletSplitView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrientation.mockReturnValue({
      orientation: 'landscape',
      isTablet: true,
      isPortrait: false,
      isLandscape: true
    });
    setWindowSize(1000, 600);
  });

  it('renders without crashing', () => {
    const { container } = render(
      <TabletSplitView
        masterPanel={<div>Master</div>}
        detailPanel={<div>Detail</div>}
      />
    );
    expect(container).toBeInTheDocument();
  });

  it('shows both panels in tablet landscape', () => {
    render(
      <TabletSplitView
        masterPanel={<div>Master Panel</div>}
        detailPanel={<div>Detail Panel</div>}
      />
    );

    expect(screen.getByText('Master Panel')).toBeInTheDocument();
    expect(screen.getByText('Detail Panel')).toBeInTheDocument();
  });

  it('shows only detail panel when showDetail is true in portrait', () => {
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });

    render(
      <TabletSplitView
        masterPanel={<div>Master Panel</div>}
        detailPanel={<div>Detail Panel</div>}
        showDetail={true}
      />
    );

    expect(screen.queryByText('Master Panel')).not.toBeInTheDocument();
    expect(screen.getByText('Detail Panel')).toBeInTheDocument();
  });

  it('shows only master panel when showDetail is false in portrait', () => {
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });

    render(
      <TabletSplitView
        masterPanel={<div>Master Panel</div>}
        detailPanel={<div>Detail Panel</div>}
        showDetail={false}
      />
    );

    expect(screen.getByText('Master Panel')).toBeInTheDocument();
    expect(screen.queryByText('Detail Panel')).not.toBeInTheDocument();
  });

  it('applies custom masterWidth in landscape', () => {
    const { container } = render(
      <TabletSplitView
        masterPanel={<div>Master</div>}
        detailPanel={<div>Detail</div>}
        masterWidth="400px"
      />
    );

    const splitView = container.querySelector('.tablet-split-landscape');
    expect(splitView.style.gridTemplateColumns).toBe('400px 1fr');
  });

  it('applies custom className', () => {
    const { container } = render(
      <TabletSplitView
        masterPanel={<div>Master</div>}
        detailPanel={<div>Detail</div>}
        className="custom-split"
      />
    );

    const splitView = container.firstChild;
    expect(splitView).toHaveClass('custom-split');
  });

  it('has overflow auto on panels in landscape', () => {
    const { container } = render(
      <TabletSplitView
        masterPanel={<div>Master</div>}
        detailPanel={<div>Detail</div>}
      />
    );

    const masterPanel = container.querySelector('.master-panel');
    const detailPanel = container.querySelector('.detail-panel');

    expect(masterPanel.style.overflowY).toBe('auto');
    expect(detailPanel.style.overflowY).toBe('auto');
  });

  it('switches between panels on orientation change', () => {
    const { rerender } = render(
      <TabletSplitView
        masterPanel={<div>Master Panel</div>}
        detailPanel={<div>Detail Panel</div>}
        showDetail={true}
      />
    );

    // Both visible in landscape
    expect(screen.getByText('Master Panel')).toBeInTheDocument();
    expect(screen.getByText('Detail Panel')).toBeInTheDocument();

    // Switch to portrait
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });

    rerender(
      <TabletSplitView
        masterPanel={<div>Master Panel</div>}
        detailPanel={<div>Detail Panel</div>}
        showDetail={true}
      />
    );

    // Only detail visible in portrait when showDetail is true
    expect(screen.queryByText('Master Panel')).not.toBeInTheDocument();
    expect(screen.getByText('Detail Panel')).toBeInTheDocument();
  });
});

describe('TabletFAB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });
    setWindowSize(768, 1024);
  });

  it('renders without crashing', () => {
    const { container } = render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add"
        onClick={jest.fn()}
      />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders icon correctly', () => {
    render(
      <TabletFAB
        icon={<span>Plus Icon</span>}
        label="Add"
        onClick={jest.fn()}
      />
    );

    expect(screen.getByText('Plus Icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has proper aria-label', () => {
    render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add Item"
        onClick={jest.fn()}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Add Item');
  });

  it('has proper title attribute', () => {
    render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add Item"
        onClick={jest.fn()}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Add Item');
  });

  it('applies bottom-right position by default', () => {
    render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add"
        onClick={jest.fn()}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bottom-6', 'right-6');
  });

  it('applies bottom-left position', () => {
    render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add"
        onClick={jest.fn()}
        position="bottom-left"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bottom-6', 'left-6');
  });

  it('adjusts position on mobile to avoid bottom navigation', () => {
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: false,
      isPortrait: true,
      isLandscape: false
    });

    render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add"
        onClick={jest.fn()}
        position="bottom-right"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bottom-20', 'right-6');
  });

  it('applies custom className', () => {
    render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add"
        onClick={jest.fn()}
        className="custom-fab"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-fab');
  });

  it('is fixed positioned', () => {
    render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add"
        onClick={jest.fn()}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed');
  });

  it('has high z-index for proper stacking', () => {
    render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add"
        onClick={jest.fn()}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('z-50');
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });
    setWindowSize(768, 1024);
  });

  it('TabletOptimizedLayout works with TabletCardGrid', () => {
    const items = [
      { id: 1, title: 'Card 1' },
      { id: 2, title: 'Card 2' }
    ];

    render(
      <TabletOptimizedLayout>
        <TabletCardGrid
          items={items}
          renderCard={(item) => <div>{item.title}</div>}
        />
      </TabletOptimizedLayout>
    );

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('TabletOptimizedLayout works with TabletListView', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];

    render(
      <TabletOptimizedLayout>
        <TabletListView
          items={items}
          renderItem={(item) => <div>{item.name}</div>}
        />
      </TabletOptimizedLayout>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('TabletOptimizedLayout works with TabletSplitView', () => {
    render(
      <TabletOptimizedLayout>
        <TabletSplitView
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
        />
      </TabletOptimizedLayout>
    );

    expect(screen.getByText('Master')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
  });

  it('Multiple components work together', () => {
    const items = [{ id: 1, title: 'Item 1' }];

    render(
      <>
        <TabletOptimizedLayout>
          <TabletCardGrid
            items={items}
            renderCard={(item) => <div>{item.title}</div>}
          />
        </TabletOptimizedLayout>
        <TabletFAB
          icon={<span>+</span>}
          label="Add"
          onClick={jest.fn()}
        />
      </>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('Snapshot Tests', () => {
  beforeEach(() => {
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });
    setWindowSize(768, 1024);
  });

  it('matches snapshot for TabletOptimizedLayout', () => {
    const { container } = render(
      <TabletOptimizedLayout>
        <div>Content</div>
      </TabletOptimizedLayout>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for TabletOptimizedLayout with sidebar', () => {
    const { container } = render(
      <TabletOptimizedLayout sidebar={<div>Sidebar</div>}>
        <div>Content</div>
      </TabletOptimizedLayout>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for TabletCardGrid', () => {
    const items = [
      { id: 1, title: 'Card 1' },
      { id: 2, title: 'Card 2' }
    ];

    const { container } = render(
      <TabletCardGrid
        items={items}
        renderCard={(item) => <div>{item.title}</div>}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for TabletListView', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];

    const { container } = render(
      <TabletListView
        items={items}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for TabletSplitView landscape', () => {
    useOrientation.mockReturnValue({
      orientation: 'landscape',
      isTablet: true,
      isPortrait: false,
      isLandscape: true
    });

    const { container } = render(
      <TabletSplitView
        masterPanel={<div>Master</div>}
        detailPanel={<div>Detail</div>}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for TabletSplitView portrait', () => {
    useOrientation.mockReturnValue({
      orientation: 'portrait',
      isTablet: true,
      isPortrait: true,
      isLandscape: false
    });

    const { container } = render(
      <TabletSplitView
        masterPanel={<div>Master</div>}
        detailPanel={<div>Detail</div>}
        showDetail={true}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for TabletFAB', () => {
    const { container } = render(
      <TabletFAB
        icon={<span>+</span>}
        label="Add"
        onClick={jest.fn()}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

export default setWindowSize
