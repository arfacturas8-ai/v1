/**
 * CRYB Platform - Skeleton Form Component Tests
 * Comprehensive test suite for SkeletonForm component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkeletonForm } from './SkeletonForm';
import { cn } from '../../../lib/utils';

jest.mock('../../../lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('SkeletonForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      const { container } = render(<SkeletonForm />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render a container div', () => {
      const { container } = render(<SkeletonForm />);
      const wrapper = container.firstChild;
      expect(wrapper).toBeInstanceOf(HTMLDivElement);
    });

    it('should render with default spacing classes', () => {
      const { container } = render(<SkeletonForm />);
      expect(cn).toHaveBeenCalledWith('space-y-6', undefined);
    });

    it('should apply custom className', () => {
      const customClass = 'custom-skeleton-form';
      render(<SkeletonForm className={customClass} />);
      expect(cn).toHaveBeenCalledWith('space-y-6', customClass);
    });

    it('should render without errors', () => {
      expect(() => render(<SkeletonForm />)).not.toThrow();
    });
  });

  describe('Field Count', () => {
    it('should render default field count of 3', () => {
      const { container } = render(<SkeletonForm />);
      const fields = container.querySelectorAll('.space-y-2');
      expect(fields).toHaveLength(3);
    });

    it('should render custom field count of 1', () => {
      const { container } = render(<SkeletonForm fieldCount={1} />);
      const fields = container.querySelectorAll('.space-y-2');
      expect(fields).toHaveLength(1);
    });

    it('should render custom field count of 5', () => {
      const { container } = render(<SkeletonForm fieldCount={5} />);
      const fields = container.querySelectorAll('.space-y-2');
      expect(fields).toHaveLength(5);
    });

    it('should render custom field count of 10', () => {
      const { container } = render(<SkeletonForm fieldCount={10} />);
      const fields = container.querySelectorAll('.space-y-2');
      expect(fields).toHaveLength(10);
    });

    it('should render zero fields when fieldCount is 0', () => {
      const { container } = render(<SkeletonForm fieldCount={0} />);
      const fields = container.querySelectorAll('.space-y-2');
      expect(fields).toHaveLength(0);
    });

    it('should handle large field counts', () => {
      const { container } = render(<SkeletonForm fieldCount={20} />);
      const fields = container.querySelectorAll('.space-y-2');
      expect(fields).toHaveLength(20);
    });
  });

  describe('Field Structure', () => {
    it('should render each field with correct container classes', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const fields = container.querySelectorAll('.space-y-2');
      fields.forEach(field => {
        expect(field).toHaveClass('space-y-2');
      });
    });

    it('should render field label skeleton in each field', () => {
      const { container } = render(<SkeletonForm fieldCount={3} />);
      const labels = container.querySelectorAll('.space-y-2 > .h-4');
      expect(labels).toHaveLength(3);
    });

    it('should render field input skeleton in each field', () => {
      const { container } = render(<SkeletonForm fieldCount={3} />);
      const inputs = container.querySelectorAll('.space-y-2 > .h-10');
      expect(inputs).toHaveLength(3);
    });

    it('should render label skeleton with correct classes', () => {
      const { container } = render(<SkeletonForm fieldCount={1} />);
      const label = container.querySelector('.space-y-2 > .h-4');
      expect(label).toHaveClass('h-4', 'bg-bg-tertiary', 'rounded', 'animate-shimmer', 'w-24');
    });

    it('should render input skeleton with correct classes', () => {
      const { container } = render(<SkeletonForm fieldCount={1} />);
      const input = container.querySelector('.space-y-2 > .h-10');
      expect(input).toHaveClass('h-10', 'bg-bg-tertiary', 'rounded-lg', 'animate-shimmer', 'w-full');
    });
  });

  describe('Button Rendering', () => {
    it('should render button by default', () => {
      const { container } = render(<SkeletonForm />);
      const buttons = container.querySelectorAll('.w-32');
      expect(buttons).toHaveLength(1);
    });

    it('should render button when showButton is true', () => {
      const { container } = render(<SkeletonForm showButton={true} />);
      const buttons = container.querySelectorAll('.w-32');
      expect(buttons).toHaveLength(1);
    });

    it('should not render button when showButton is false', () => {
      const { container } = render(<SkeletonForm showButton={false} />);
      const buttons = container.querySelectorAll('.w-32');
      expect(buttons).toHaveLength(0);
    });

    it('should render button skeleton with correct classes', () => {
      const { container } = render(<SkeletonForm showButton={true} />);
      const button = container.querySelector('.w-32');
      expect(button).toHaveClass('h-10', 'bg-bg-tertiary', 'rounded-lg', 'animate-shimmer', 'w-32');
    });

    it('should render button as last element when present', () => {
      const { container } = render(<SkeletonForm fieldCount={3} showButton={true} />);
      const wrapper = container.firstChild;
      const lastChild = wrapper.lastChild;
      expect(lastChild).toHaveClass('w-32');
    });
  });

  describe('Animation Classes', () => {
    it('should apply animate-shimmer to label skeletons', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const labels = container.querySelectorAll('.space-y-2 > .h-4');
      labels.forEach(label => {
        expect(label).toHaveClass('animate-shimmer');
      });
    });

    it('should apply animate-shimmer to input skeletons', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const inputs = container.querySelectorAll('.space-y-2 > .h-10');
      inputs.forEach(input => {
        expect(input).toHaveClass('animate-shimmer');
      });
    });

    it('should apply animate-shimmer to button skeleton', () => {
      const { container } = render(<SkeletonForm showButton={true} />);
      const button = container.querySelector('.w-32');
      expect(button).toHaveClass('animate-shimmer');
    });
  });

  describe('Background Styling', () => {
    it('should apply bg-bg-tertiary to all label skeletons', () => {
      const { container } = render(<SkeletonForm fieldCount={3} />);
      const labels = container.querySelectorAll('.space-y-2 > .h-4');
      labels.forEach(label => {
        expect(label).toHaveClass('bg-bg-tertiary');
      });
    });

    it('should apply bg-bg-tertiary to all input skeletons', () => {
      const { container } = render(<SkeletonForm fieldCount={3} />);
      const inputs = container.querySelectorAll('.space-y-2 > .h-10');
      inputs.forEach(input => {
        expect(input).toHaveClass('bg-bg-tertiary');
      });
    });

    it('should apply bg-bg-tertiary to button skeleton', () => {
      const { container } = render(<SkeletonForm showButton={true} />);
      const button = container.querySelector('.w-32');
      expect(button).toHaveClass('bg-bg-tertiary');
    });
  });

  describe('Border Radius', () => {
    it('should apply rounded to label skeletons', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const labels = container.querySelectorAll('.space-y-2 > .h-4');
      labels.forEach(label => {
        expect(label).toHaveClass('rounded');
      });
    });

    it('should apply rounded-lg to input skeletons', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const inputs = container.querySelectorAll('.space-y-2 > .h-10');
      inputs.forEach(input => {
        expect(input).toHaveClass('rounded-lg');
      });
    });

    it('should apply rounded-lg to button skeleton', () => {
      const { container } = render(<SkeletonForm showButton={true} />);
      const button = container.querySelector('.w-32');
      expect(button).toHaveClass('rounded-lg');
    });
  });

  describe('Sizing', () => {
    it('should render label skeletons with h-4 height', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const labels = container.querySelectorAll('.space-y-2 > .h-4');
      labels.forEach(label => {
        expect(label).toHaveClass('h-4');
      });
    });

    it('should render label skeletons with w-24 width', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const labels = container.querySelectorAll('.space-y-2 > .h-4');
      labels.forEach(label => {
        expect(label).toHaveClass('w-24');
      });
    });

    it('should render input skeletons with h-10 height', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const inputs = container.querySelectorAll('.space-y-2 > .h-10');
      inputs.forEach(input => {
        expect(input).toHaveClass('h-10');
      });
    });

    it('should render input skeletons with w-full width', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const inputs = container.querySelectorAll('.space-y-2 > .h-10');
      inputs.forEach(input => {
        expect(input).toHaveClass('w-full');
      });
    });

    it('should render button skeleton with h-10 height', () => {
      const { container } = render(<SkeletonForm showButton={true} />);
      const button = container.querySelector('.w-32');
      expect(button).toHaveClass('h-10');
    });

    it('should render button skeleton with w-32 width', () => {
      const { container } = render(<SkeletonForm showButton={true} />);
      const button = container.querySelector('.w-32');
      expect(button).toHaveClass('w-32');
    });
  });

  describe('Accessibility', () => {
    it('should render divs for skeleton elements', () => {
      const { container } = render(<SkeletonForm fieldCount={2} />);
      const fields = container.querySelectorAll('.space-y-2');
      fields.forEach(field => {
        const children = field.querySelectorAll('div');
        expect(children.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should not contain interactive elements', () => {
      const { container } = render(<SkeletonForm fieldCount={3} showButton={true} />);
      const buttons = container.querySelectorAll('button');
      const inputs = container.querySelectorAll('input');
      const textareas = container.querySelectorAll('textarea');
      expect(buttons).toHaveLength(0);
      expect(inputs).toHaveLength(0);
      expect(textareas).toHaveLength(0);
    });

    it('should not contain form elements', () => {
      const { container } = render(<SkeletonForm />);
      const forms = container.querySelectorAll('form');
      expect(forms).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined className', () => {
      expect(() => render(<SkeletonForm className={undefined} />)).not.toThrow();
    });

    it('should handle null className', () => {
      expect(() => render(<SkeletonForm className={null} />)).not.toThrow();
    });

    it('should handle empty string className', () => {
      render(<SkeletonForm className="" />);
      expect(cn).toHaveBeenCalledWith('space-y-6', '');
    });

    it('should handle negative field count as zero fields', () => {
      const { container } = render(<SkeletonForm fieldCount={-1} />);
      const fields = container.querySelectorAll('.space-y-2');
      expect(fields).toHaveLength(0);
    });

    it('should handle multiple custom classes', () => {
      const customClass = 'class-1 class-2 class-3';
      render(<SkeletonForm className={customClass} />);
      expect(cn).toHaveBeenCalledWith('space-y-6', customClass);
    });

    it('should render button independently of field count', () => {
      const { container: container1 } = render(<SkeletonForm fieldCount={0} showButton={true} />);
      const button1 = container1.querySelector('.w-32');
      expect(button1).toBeInTheDocument();

      const { container: container2 } = render(<SkeletonForm fieldCount={10} showButton={true} />);
      const button2 = container2.querySelector('.w-32');
      expect(button2).toBeInTheDocument();
    });
  });
});

export default wrapper
