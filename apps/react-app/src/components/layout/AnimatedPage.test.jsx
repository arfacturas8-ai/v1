import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import {
  AnimatedPage,
  AnimatedSection,
  AnimatedList,
  AnimatedListItem,
  AnimatedCard,
  FadeIn,
  SlideIn,
  ScaleIn,
  StaggerChildren,
} from './AnimatedPage';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, className, initial, animate, exit, transition, variants, whileHover, whileTap, ...props }, ref) => (
        <div
          ref={ref}
          className={className}
          data-initial={initial ? JSON.stringify(initial) : undefined}
          data-animate={animate ? JSON.stringify(animate) : undefined}
          data-exit={exit ? JSON.stringify(exit) : undefined}
          data-transition={transition ? JSON.stringify(transition) : undefined}
          data-variants={variants ? JSON.stringify(variants) : undefined}
          data-while-hover={whileHover ? JSON.stringify(whileHover) : undefined}
          data-while-tap={whileTap ? JSON.stringify(whileTap) : undefined}
          {...props}
        >
          {children}
        </div>
      )),
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// Mock animation configurations
jest.mock('../../lib/animations', () => ({
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  pageSlideTransition: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
  pageFadeTransition: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
}));

// Mock useAnimations hook
const mockUsePrefersReducedMotion = jest.fn(() => false);
jest.mock('../../hooks/useAnimations', () => ({
  usePrefersReducedMotion: () => mockUsePrefersReducedMotion(),
}));

// Mock matchMedia for prefers-reduced-motion
const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('AnimatedPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
    mockMatchMedia(false);
  });

  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <AnimatedPage>
          <div>Test Content</div>
        </AnimatedPage>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <AnimatedPage>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </AnimatedPage>
      );
      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
      expect(screen.getByText('Third Child')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AnimatedPage className="custom-page-class">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.querySelector('.custom-page-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should spread additional props', () => {
      const { container } = render(
        <AnimatedPage data-testid="animated-page" aria-label="Page">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.querySelector('[data-testid="animated-page"]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveAttribute('aria-label', 'Page');
    });
  });

  describe('Fade Animation Variant', () => {
    it('should use fade transition by default', () => {
      const { container } = render(
        <AnimatedPage>
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0 });
    });

    it('should apply fade initial state', () => {
      const { container } = render(
        <AnimatedPage transition="fade">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial.opacity).toBe(0);
    });

    it('should apply fade animate state', () => {
      const { container } = render(
        <AnimatedPage transition="fade">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const animate = JSON.parse(wrapper.getAttribute('data-animate'));
      expect(animate.opacity).toBe(1);
    });

    it('should apply fade exit state', () => {
      const { container } = render(
        <AnimatedPage transition="fade">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const exit = JSON.parse(wrapper.getAttribute('data-exit'));
      expect(exit.opacity).toBe(0);
    });

    it('should use fade transition duration', () => {
      const { container } = render(
        <AnimatedPage transition="fade">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.2);
    });
  });

  describe('Slide Animation Variant', () => {
    it('should use slide transition when specified', () => {
      const { container } = render(
        <AnimatedPage transition="slide">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0, x: -20 });
    });

    it('should apply slide initial state with x offset', () => {
      const { container } = render(
        <AnimatedPage transition="slide">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial.x).toBe(-20);
      expect(initial.opacity).toBe(0);
    });

    it('should apply slide animate state', () => {
      const { container } = render(
        <AnimatedPage transition="slide">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const animate = JSON.parse(wrapper.getAttribute('data-animate'));
      expect(animate.x).toBe(0);
      expect(animate.opacity).toBe(1);
    });

    it('should apply slide exit state', () => {
      const { container } = render(
        <AnimatedPage transition="slide">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const exit = JSON.parse(wrapper.getAttribute('data-exit'));
      expect(exit.x).toBe(20);
      expect(exit.opacity).toBe(0);
    });

    it('should use slide transition timing', () => {
      const { container } = render(
        <AnimatedPage transition="slide">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.3);
      expect(transition.ease).toBe('easeInOut');
    });
  });

  describe('Default Animation Variant', () => {
    it('should use default transition for unknown transition type', () => {
      const { container } = render(
        <AnimatedPage transition="unknown">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0, y: 20 });
    });

    it('should apply default initial state with y offset', () => {
      const { container } = render(
        <AnimatedPage transition="default">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial.y).toBe(20);
      expect(initial.opacity).toBe(0);
    });

    it('should apply default animate state', () => {
      const { container } = render(
        <AnimatedPage transition="default">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const animate = JSON.parse(wrapper.getAttribute('data-animate'));
      expect(animate.y).toBe(0);
      expect(animate.opacity).toBe(1);
    });

    it('should apply default exit state', () => {
      const { container } = render(
        <AnimatedPage transition="default">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const exit = JSON.parse(wrapper.getAttribute('data-exit'));
      expect(exit.y).toBe(-20);
      expect(exit.opacity).toBe(0);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should use fade transition when user prefers reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedPage transition="slide">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0 });
    });

    it('should override slide transition with fade for reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedPage transition="slide">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial.x).toBeUndefined();
      expect(initial.opacity).toBe(0);
    });

    it('should override default transition with fade for reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedPage transition="default">
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial.y).toBeUndefined();
      expect(initial.opacity).toBe(0);
    });

    it('should respect reduced motion for accessibility', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedPage>
          <div>Content</div>
        </AnimatedPage>
      );
      const wrapper = container.firstChild;
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.2);
    });
  });
});

describe('AnimatedSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <AnimatedSection>
          <div>Section Content</div>
        </AnimatedSection>
      );
      expect(screen.getByText('Section Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AnimatedSection className="custom-section">
          <div>Content</div>
        </AnimatedSection>
      );
      expect(container.querySelector('.custom-section')).toBeInTheDocument();
    });

    it('should spread additional props', () => {
      const { container } = render(
        <AnimatedSection data-testid="section">
          <div>Content</div>
        </AnimatedSection>
      );
      expect(container.querySelector('[data-testid="section"]')).toBeInTheDocument();
    });
  });

  describe('Animation Properties', () => {
    it('should apply initial animation state', () => {
      const { container } = render(
        <AnimatedSection>
          <div>Content</div>
        </AnimatedSection>
      );
      const wrapper = container.querySelector('[data-initial]');
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0, y: 20 });
    });

    it('should apply animate state', () => {
      const { container } = render(
        <AnimatedSection>
          <div>Content</div>
        </AnimatedSection>
      );
      const wrapper = container.querySelector('[data-animate]');
      const animate = JSON.parse(wrapper.getAttribute('data-animate'));
      expect(animate).toEqual({ opacity: 1, y: 0 });
    });

    it('should use default delay of 0', () => {
      const { container } = render(
        <AnimatedSection>
          <div>Content</div>
        </AnimatedSection>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.delay).toBe(0);
    });

    it('should apply custom delay', () => {
      const { container } = render(
        <AnimatedSection delay={0.5}>
          <div>Content</div>
        </AnimatedSection>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.delay).toBe(0.5);
    });

    it('should use correct animation duration', () => {
      const { container } = render(
        <AnimatedSection>
          <div>Content</div>
        </AnimatedSection>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.5);
    });

    it('should use custom easing function', () => {
      const { container } = render(
        <AnimatedSection>
          <div>Content</div>
        </AnimatedSection>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.ease).toEqual([0.25, 0.46, 0.45, 0.94]);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should render plain div when reduced motion is preferred', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedSection className="test-section">
          <div>Content</div>
        </AnimatedSection>
      );
      const wrapper = container.querySelector('.test-section');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.getAttribute('data-initial')).toBeNull();
    });

    it('should not apply motion animations for reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedSection>
          <div>Content</div>
        </AnimatedSection>
      );
      expect(container.querySelector('[data-animate]')).toBeNull();
    });

    it('should preserve children with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      render(
        <AnimatedSection>
          <div>Accessible Content</div>
        </AnimatedSection>
      );
      expect(screen.getByText('Accessible Content')).toBeInTheDocument();
    });
  });
});

describe('AnimatedList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <AnimatedList>
          <div>List Item</div>
        </AnimatedList>
      );
      expect(screen.getByText('List Item')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <AnimatedList>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </AnimatedList>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AnimatedList className="custom-list">
          <div>Content</div>
        </AnimatedList>
      );
      expect(container.querySelector('.custom-list')).toBeInTheDocument();
    });
  });

  describe('Stagger Animation', () => {
    it('should use default stagger of 0.1', () => {
      const { container } = render(
        <AnimatedList>
          <div>Item</div>
        </AnimatedList>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants.show.transition.staggerChildren).toBe(0.1);
    });

    it('should apply custom stagger value', () => {
      const { container } = render(
        <AnimatedList stagger={0.2}>
          <div>Item</div>
        </AnimatedList>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants.show.transition.staggerChildren).toBe(0.2);
    });

    it('should have hidden and show variants', () => {
      const { container } = render(
        <AnimatedList>
          <div>Item</div>
        </AnimatedList>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants).toHaveProperty('hidden');
      expect(variants).toHaveProperty('show');
    });

    it('should apply initial hidden state', () => {
      const { container } = render(
        <AnimatedList>
          <div>Item</div>
        </AnimatedList>
      );
      const wrapper = container.querySelector('[data-initial]');
      expect(wrapper.getAttribute('data-initial')).toBe('"hidden"');
    });

    it('should animate to show state', () => {
      const { container } = render(
        <AnimatedList>
          <div>Item</div>
        </AnimatedList>
      );
      const wrapper = container.querySelector('[data-animate]');
      expect(wrapper.getAttribute('data-animate')).toBe('"show"');
    });
  });

  describe('Reduced Motion Support', () => {
    it('should render plain div with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedList className="list">
          <div>Item</div>
        </AnimatedList>
      );
      const wrapper = container.querySelector('.list');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.getAttribute('data-variants')).toBeNull();
    });

    it('should not apply stagger with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedList stagger={0.3}>
          <div>Item</div>
        </AnimatedList>
      );
      expect(container.querySelector('[data-variants]')).toBeNull();
    });
  });
});

describe('AnimatedListItem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <AnimatedListItem>
          <div>List Item Content</div>
        </AnimatedListItem>
      );
      expect(screen.getByText('List Item Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AnimatedListItem className="custom-item">
          <div>Content</div>
        </AnimatedListItem>
      );
      expect(container.querySelector('.custom-item')).toBeInTheDocument();
    });
  });

  describe('Animation Variants', () => {
    it('should have hidden and show variants', () => {
      const { container } = render(
        <AnimatedListItem>
          <div>Item</div>
        </AnimatedListItem>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants).toHaveProperty('hidden');
      expect(variants).toHaveProperty('show');
    });

    it('should apply hidden variant with opacity and y offset', () => {
      const { container } = render(
        <AnimatedListItem>
          <div>Item</div>
        </AnimatedListItem>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants.hidden).toEqual({ opacity: 0, y: 20 });
    });

    it('should apply show variant', () => {
      const { container } = render(
        <AnimatedListItem>
          <div>Item</div>
        </AnimatedListItem>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants.show.opacity).toBe(1);
      expect(variants.show.y).toBe(0);
    });

    it('should use correct animation duration', () => {
      const { container } = render(
        <AnimatedListItem>
          <div>Item</div>
        </AnimatedListItem>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants.show.transition.duration).toBe(0.3);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should render plain div with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedListItem className="item">
          <div>Item</div>
        </AnimatedListItem>
      );
      const wrapper = container.querySelector('.item');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.getAttribute('data-variants')).toBeNull();
    });
  });
});

describe('AnimatedCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <AnimatedCard>
          <div>Card Content</div>
        </AnimatedCard>
      );
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AnimatedCard className="custom-card">
          <div>Content</div>
        </AnimatedCard>
      );
      expect(container.querySelector('.custom-card')).toBeInTheDocument();
    });
  });

  describe('Hover Animations', () => {
    it('should apply hover animations by default', () => {
      const { container } = render(
        <AnimatedCard>
          <div>Card</div>
        </AnimatedCard>
      );
      const wrapper = container.querySelector('[data-while-hover]');
      const hoverProps = JSON.parse(wrapper.getAttribute('data-while-hover'));
      expect(hoverProps.scale).toBe(1.02);
      expect(hoverProps.y).toBe(-4);
    });

    it('should have hover transition timing', () => {
      const { container } = render(
        <AnimatedCard>
          <div>Card</div>
        </AnimatedCard>
      );
      const wrapper = container.querySelector('[data-while-hover]');
      const hoverProps = JSON.parse(wrapper.getAttribute('data-while-hover'));
      expect(hoverProps.transition.duration).toBe(0.2);
    });

    it('should apply tap animation', () => {
      const { container } = render(
        <AnimatedCard>
          <div>Card</div>
        </AnimatedCard>
      );
      const wrapper = container.querySelector('[data-while-tap]');
      const tapProps = JSON.parse(wrapper.getAttribute('data-while-tap'));
      expect(tapProps.scale).toBe(0.98);
    });

    it('should disable hover animations when hover is false', () => {
      const { container } = render(
        <AnimatedCard hover={false}>
          <div>Card</div>
        </AnimatedCard>
      );
      const wrapper = container.firstChild;
      expect(wrapper.getAttribute('data-while-hover')).toBeNull();
      expect(wrapper.getAttribute('data-while-tap')).toBeNull();
    });
  });

  describe('Initial Animation', () => {
    it('should apply initial animation state', () => {
      const { container } = render(
        <AnimatedCard>
          <div>Card</div>
        </AnimatedCard>
      );
      const wrapper = container.querySelector('[data-initial]');
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0, y: 20 });
    });

    it('should animate to visible state', () => {
      const { container } = render(
        <AnimatedCard>
          <div>Card</div>
        </AnimatedCard>
      );
      const wrapper = container.querySelector('[data-animate]');
      const animate = JSON.parse(wrapper.getAttribute('data-animate'));
      expect(animate).toEqual({ opacity: 1, y: 0 });
    });
  });

  describe('Reduced Motion Support', () => {
    it('should disable hover with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedCard>
          <div>Card</div>
        </AnimatedCard>
      );
      const wrapper = container.firstChild;
      expect(wrapper.getAttribute('data-while-hover')).toBeNull();
    });

    it('should still show initial animation with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <AnimatedCard>
          <div>Card</div>
        </AnimatedCard>
      );
      const wrapper = container.querySelector('[data-initial]');
      expect(wrapper).toBeInTheDocument();
    });
  });
});

describe('FadeIn Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <FadeIn>
          <div>Fading Content</div>
        </FadeIn>
      );
      expect(screen.getByText('Fading Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <FadeIn className="custom-fade">
          <div>Content</div>
        </FadeIn>
      );
      expect(container.querySelector('.custom-fade')).toBeInTheDocument();
    });
  });

  describe('Animation Properties', () => {
    it('should apply fade initial state', () => {
      const { container } = render(
        <FadeIn>
          <div>Content</div>
        </FadeIn>
      );
      const wrapper = container.querySelector('[data-initial]');
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0 });
    });

    it('should animate to full opacity', () => {
      const { container } = render(
        <FadeIn>
          <div>Content</div>
        </FadeIn>
      );
      const wrapper = container.querySelector('[data-animate]');
      const animate = JSON.parse(wrapper.getAttribute('data-animate'));
      expect(animate).toEqual({ opacity: 1 });
    });

    it('should use default delay of 0', () => {
      const { container } = render(
        <FadeIn>
          <div>Content</div>
        </FadeIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.delay).toBe(0);
    });

    it('should apply custom delay', () => {
      const { container } = render(
        <FadeIn delay={0.3}>
          <div>Content</div>
        </FadeIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.delay).toBe(0.3);
    });

    it('should use default duration of 0.5', () => {
      const { container } = render(
        <FadeIn>
          <div>Content</div>
        </FadeIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.5);
    });

    it('should apply custom duration', () => {
      const { container } = render(
        <FadeIn duration={1.0}>
          <div>Content</div>
        </FadeIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.duration).toBe(1.0);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should render plain div with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <FadeIn className="fade">
          <div>Content</div>
        </FadeIn>
      );
      const wrapper = container.querySelector('.fade');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.getAttribute('data-initial')).toBeNull();
    });
  });
});

describe('SlideIn Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <SlideIn>
          <div>Sliding Content</div>
        </SlideIn>
      );
      expect(screen.getByText('Sliding Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SlideIn className="custom-slide">
          <div>Content</div>
        </SlideIn>
      );
      expect(container.querySelector('.custom-slide')).toBeInTheDocument();
    });
  });

  describe('Direction Variants', () => {
    it('should slide from up by default', () => {
      const { container } = render(
        <SlideIn>
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('[data-initial]');
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0, y: 20 });
    });

    it('should slide from down direction', () => {
      const { container } = render(
        <SlideIn direction="down">
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('[data-initial]');
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0, y: -20 });
    });

    it('should slide from left direction', () => {
      const { container } = render(
        <SlideIn direction="left">
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('[data-initial]');
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0, x: 20 });
    });

    it('should slide from right direction', () => {
      const { container } = render(
        <SlideIn direction="right">
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('[data-initial]');
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0, x: -20 });
    });

    it('should animate to final position', () => {
      const { container } = render(
        <SlideIn direction="left">
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('[data-animate]');
      const animate = JSON.parse(wrapper.getAttribute('data-animate'));
      expect(animate).toEqual({ opacity: 1, y: 0, x: 0 });
    });
  });

  describe('Delay and Timing', () => {
    it('should use default delay of 0', () => {
      const { container } = render(
        <SlideIn>
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.delay).toBe(0);
    });

    it('should apply custom delay', () => {
      const { container } = render(
        <SlideIn delay={0.4}>
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.delay).toBe(0.4);
    });

    it('should use correct duration', () => {
      const { container } = render(
        <SlideIn>
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.5);
    });

    it('should use custom easing', () => {
      const { container } = render(
        <SlideIn>
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.ease).toEqual([0.25, 0.46, 0.45, 0.94]);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should render plain div with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <SlideIn className="slide">
          <div>Content</div>
        </SlideIn>
      );
      const wrapper = container.querySelector('.slide');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.getAttribute('data-initial')).toBeNull();
    });
  });
});

describe('ScaleIn Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <ScaleIn>
          <div>Scaling Content</div>
        </ScaleIn>
      );
      expect(screen.getByText('Scaling Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ScaleIn className="custom-scale">
          <div>Content</div>
        </ScaleIn>
      );
      expect(container.querySelector('.custom-scale')).toBeInTheDocument();
    });
  });

  describe('Animation Properties', () => {
    it('should apply scale initial state', () => {
      const { container } = render(
        <ScaleIn>
          <div>Content</div>
        </ScaleIn>
      );
      const wrapper = container.querySelector('[data-initial]');
      const initial = JSON.parse(wrapper.getAttribute('data-initial'));
      expect(initial).toEqual({ opacity: 0, scale: 0.8 });
    });

    it('should animate to full scale', () => {
      const { container } = render(
        <ScaleIn>
          <div>Content</div>
        </ScaleIn>
      );
      const wrapper = container.querySelector('[data-animate]');
      const animate = JSON.parse(wrapper.getAttribute('data-animate'));
      expect(animate).toEqual({ opacity: 1, scale: 1 });
    });

    it('should use default delay of 0', () => {
      const { container } = render(
        <ScaleIn>
          <div>Content</div>
        </ScaleIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.delay).toBe(0);
    });

    it('should apply custom delay', () => {
      const { container } = render(
        <ScaleIn delay={0.6}>
          <div>Content</div>
        </ScaleIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.delay).toBe(0.6);
    });

    it('should use correct duration and easing', () => {
      const { container } = render(
        <ScaleIn>
          <div>Content</div>
        </ScaleIn>
      );
      const wrapper = container.querySelector('[data-transition]');
      const transition = JSON.parse(wrapper.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.5);
      expect(transition.ease).toEqual([0.25, 0.46, 0.45, 0.94]);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should render plain div with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <ScaleIn className="scale">
          <div>Content</div>
        </ScaleIn>
      );
      const wrapper = container.querySelector('.scale');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.getAttribute('data-initial')).toBeNull();
    });
  });
});

describe('StaggerChildren Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(
        <StaggerChildren>
          <div>Child 1</div>
          <div>Child 2</div>
        </StaggerChildren>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StaggerChildren className="custom-stagger">
          <div>Content</div>
        </StaggerChildren>
      );
      expect(container.querySelector('.custom-stagger')).toBeInTheDocument();
    });
  });

  describe('Stagger Animation', () => {
    it('should apply stagger variants', () => {
      const { container } = render(
        <StaggerChildren>
          <div>Content</div>
        </StaggerChildren>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants).toHaveProperty('visible');
      expect(variants.visible.transition).toHaveProperty('staggerChildren');
    });

    it('should use default stagger of 0.1', () => {
      const { container } = render(
        <StaggerChildren>
          <div>Content</div>
        </StaggerChildren>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants.visible.transition.staggerChildren).toBe(0.1);
    });

    it('should apply custom stagger value', () => {
      const { container } = render(
        <StaggerChildren stagger={0.25}>
          <div>Content</div>
        </StaggerChildren>
      );
      const wrapper = container.querySelector('[data-variants]');
      const variants = JSON.parse(wrapper.getAttribute('data-variants'));
      expect(variants.visible.transition.staggerChildren).toBe(0.25);
    });

    it('should apply initial hidden state', () => {
      const { container } = render(
        <StaggerChildren>
          <div>Content</div>
        </StaggerChildren>
      );
      const wrapper = container.querySelector('[data-initial]');
      expect(wrapper.getAttribute('data-initial')).toBe('"hidden"');
    });

    it('should animate to visible state', () => {
      const { container } = render(
        <StaggerChildren>
          <div>Content</div>
        </StaggerChildren>
      );
      const wrapper = container.querySelector('[data-animate]');
      expect(wrapper.getAttribute('data-animate')).toBe('"visible"');
    });
  });

  describe('Reduced Motion Support', () => {
    it('should render plain div with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <StaggerChildren className="stagger">
          <div>Content</div>
        </StaggerChildren>
      );
      const wrapper = container.querySelector('.stagger');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.getAttribute('data-variants')).toBeNull();
    });

    it('should preserve all children with reduced motion', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      render(
        <StaggerChildren>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </StaggerChildren>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });
});

describe('Layout and Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePrefersReducedMotion.mockReturnValue(false);
  });

  describe('Layout Shift Prevention', () => {
    it('should maintain layout during animation', () => {
      const { container } = render(
        <AnimatedPage>
          <div style={{ height: '100px' }}>Content</div>
        </AnimatedPage>
      );
      const content = screen.getByText('Content');
      expect(content.parentElement).toHaveStyle({ height: '100px' });
    });

    it('should preserve dimensions with multiple children', () => {
      render(
        <AnimatedSection>
          <div>First</div>
          <div>Second</div>
        </AnimatedSection>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should respect reduced motion for all components', () => {
      mockUsePrefersReducedMotion.mockReturnValue(true);
      const { container } = render(
        <div>
          <AnimatedPage><div>Page</div></AnimatedPage>
          <AnimatedSection><div>Section</div></AnimatedSection>
          <FadeIn><div>Fade</div></FadeIn>
          <SlideIn><div>Slide</div></SlideIn>
          <ScaleIn><div>Scale</div></ScaleIn>
        </div>
      );
      const animatedElements = container.querySelectorAll('[data-animate]');
      // AnimatedPage still has animation but with fade only
      expect(animatedElements.length).toBeLessThanOrEqual(1);
    });

    it('should allow focus on interactive animated elements', () => {
      const { container } = render(
        <AnimatedCard>
          <button>Click me</button>
        </AnimatedCard>
      );
      const button = screen.getByText('Click me');
      expect(button).toBeInTheDocument();
    });

    it('should maintain semantic HTML structure', () => {
      render(
        <AnimatedPage>
          <header>Header</header>
          <main>Main</main>
          <footer>Footer</footer>
        </AnimatedPage>
      );
      expect(screen.getByText('Header').tagName).toBe('HEADER');
      expect(screen.getByText('Main').tagName).toBe('MAIN');
      expect(screen.getByText('Footer').tagName).toBe('FOOTER');
    });
  });
});

export default React
