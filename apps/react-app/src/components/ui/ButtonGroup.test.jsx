import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ButtonGroup from './ButtonGroup'

// Mock Button component for testing
const MockButton = ({ children, className = '', style = {}, focus = false, ...props }) => (
  <button className={className} style={style} {...props}>
    {children}
  </button>
)

describe('ButtonGroup', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ButtonGroup />)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('should render with children', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      expect(screen.getByText('Button 1')).toBeInTheDocument()
      expect(screen.getByText('Button 2')).toBeInTheDocument()
    })

    it('should render multiple buttons', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
          <MockButton>Button 3</MockButton>
          <MockButton>Button 4</MockButton>
        </ButtonGroup>
      )
      expect(screen.getByText('Button 1')).toBeInTheDocument()
      expect(screen.getByText('Button 2')).toBeInTheDocument()
      expect(screen.getByText('Button 3')).toBeInTheDocument()
      expect(screen.getByText('Button 4')).toBeInTheDocument()
    })

    it('should render a single button', () => {
      render(
        <ButtonGroup>
          <MockButton>Single Button</MockButton>
        </ButtonGroup>
      )
      expect(screen.getByText('Single Button')).toBeInTheDocument()
    })

    it('should handle non-element children', () => {
      render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
          {null}
          {false}
          {'Text'}
        </ButtonGroup>
      )
      expect(screen.getByText('Button')).toBeInTheDocument()
    })
  })

  describe('Base Classes', () => {
    it('should have base flex class', () => {
      render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('flex')
    })

    it('should apply custom className', () => {
      render(
        <ButtonGroup className="custom-class">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('custom-class')
    })

    it('should preserve default classes with custom className', () => {
      render(
        <ButtonGroup className="custom-class">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('flex', 'custom-class')
    })
  })

  describe('Variant: Horizontal', () => {
    it('should render horizontal variant by default', () => {
      render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('flex-row')
    })

    it('should render horizontal variant explicitly', () => {
      render(
        <ButtonGroup variant="horizontal">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('flex-row')
    })

    it('should apply horizontal attached styles to first button', () => {
      render(
        <ButtonGroup variant="horizontal">
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      const button1 = screen.getByText('Button 1')
      expect(button1).toHaveClass('rounded-r-none', 'border-r-0')
    })

    it('should apply horizontal attached styles to last button', () => {
      render(
        <ButtonGroup variant="horizontal">
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      const button2 = screen.getByText('Button 2')
      expect(button2).toHaveClass('rounded-l-none')
    })

    it('should apply horizontal attached styles to middle buttons', () => {
      render(
        <ButtonGroup variant="horizontal">
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
          <MockButton>Button 3</MockButton>
        </ButtonGroup>
      )
      const button2 = screen.getByText('Button 2')
      expect(button2).toHaveClass('rounded-none', 'border-r-0')
    })
  })

  describe('Variant: Vertical', () => {
    it('should render vertical variant', () => {
      render(
        <ButtonGroup variant="vertical">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('flex-col')
    })

    it('should apply vertical attached styles to first button', () => {
      render(
        <ButtonGroup variant="vertical">
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      const button1 = screen.getByText('Button 1')
      expect(button1).toHaveClass('rounded-b-none', 'border-b-0')
    })

    it('should apply vertical attached styles to last button', () => {
      render(
        <ButtonGroup variant="vertical">
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      const button2 = screen.getByText('Button 2')
      expect(button2).toHaveClass('rounded-t-none')
    })

    it('should apply vertical attached styles to middle buttons', () => {
      render(
        <ButtonGroup variant="vertical">
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
          <MockButton>Button 3</MockButton>
        </ButtonGroup>
      )
      const button2 = screen.getByText('Button 2')
      expect(button2).toHaveClass('rounded-none', 'border-b-0')
    })
  })

  describe('Variant: Wrap', () => {
    it('should render wrap variant', () => {
      render(
        <ButtonGroup variant="wrap">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('flex-row', 'flex-wrap')
    })
  })

  describe('Size Variants', () => {
    it('should apply default size (md)', () => {
      render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group.className).not.toContain('gap-')
    })

    it('should apply xs size spacing when not attached', () => {
      render(
        <ButtonGroup size="xs" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('gap-xs')
    })

    it('should apply sm size spacing when not attached', () => {
      render(
        <ButtonGroup size="sm" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('gap-sm')
    })

    it('should apply md size spacing when not attached', () => {
      render(
        <ButtonGroup size="md" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('gap-md')
    })

    it('should apply lg size spacing when not attached', () => {
      render(
        <ButtonGroup size="lg" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('gap-lg')
    })

    it('should apply xl size spacing when not attached', () => {
      render(
        <ButtonGroup size="xl" attached={false}>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('gap-xl')
    })
  })

  describe('Attached State', () => {
    it('should be attached by default', () => {
      render(
        <ButtonGroup>
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      const button1 = screen.getByText('Button 1')
      expect(button1).toHaveClass('rounded-r-none')
    })

    it('should not apply attached styles when attached is false', () => {
      render(
        <ButtonGroup attached={false}>
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      const button1 = screen.getByText('Button 1')
      expect(button1).not.toHaveClass('rounded-r-none')
    })

    it('should apply spacing when not attached', () => {
      render(
        <ButtonGroup attached={false} size="md">
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveClass('gap-md')
    })

    it('should not apply spacing when attached', () => {
      render(
        <ButtonGroup attached={true} size="md">
          <MockButton>Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group.className).not.toContain('gap-')
    })

    it('should not modify single button when attached', () => {
      render(
        <ButtonGroup attached={true}>
          <MockButton>Single Button</MockButton>
        </ButtonGroup>
      )
      const button = screen.getByText('Single Button')
      expect(button).not.toHaveClass('rounded-r-none')
      expect(button).not.toHaveClass('rounded-l-none')
    })
  })

  describe('Child Props Preservation', () => {
    it('should preserve child className', () => {
      render(
        <ButtonGroup>
          <MockButton className="custom-btn-class">Button</MockButton>
        </ButtonGroup>
      )
      const button = screen.getByText('Button')
      expect(button).toHaveClass('custom-btn-class')
    })

    it('should merge child className with attached classes', () => {
      render(
        <ButtonGroup>
          <MockButton className="custom-btn-class">Button 1</MockButton>
          <MockButton>Button 2</MockButton>
        </ButtonGroup>
      )
      const button = screen.getByText('Button 1')
      expect(button).toHaveClass('custom-btn-class', 'rounded-r-none')
    })

    it('should preserve child style prop', () => {
      render(
        <ButtonGroup>
          <MockButton style={{ color: 'red' }}>Button</MockButton>
        </ButtonGroup>
      )
      const button = screen.getByText('Button')
      expect(button).toHaveStyle({ color: 'red' })
    })

    it('should apply zIndex 1 when child has focus prop', () => {
      render(
        <ButtonGroup>
          <MockButton focus={true}>Button</MockButton>
        </ButtonGroup>
      )
      const button = screen.getByText('Button')
      expect(button).toHaveStyle({ zIndex: 1 })
    })

    it('should apply zIndex 0 when child does not have focus prop', () => {
      render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const button = screen.getByText('Button')
      expect(button).toHaveStyle({ zIndex: 0 })
    })

    it('should merge child style with zIndex', () => {
      render(
        <ButtonGroup>
          <MockButton style={{ color: 'red' }} focus={true}>Button</MockButton>
        </ButtonGroup>
      )
      const button = screen.getByText('Button')
      expect(button).toHaveStyle({ color: 'red', zIndex: 1 })
    })
  })

  describe('Accessibility', () => {
    it('should have role="group"', () => {
      render(
        <ButtonGroup>
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('should forward aria attributes', () => {
      render(
        <ButtonGroup aria-label="Button group">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-label', 'Button group')
    })

    it('should forward data attributes', () => {
      render(
        <ButtonGroup data-testid="custom-group">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      expect(screen.getByTestId('custom-group')).toBeInTheDocument()
    })

    it('should forward other props', () => {
      render(
        <ButtonGroup id="button-group">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('id', 'button-group')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<ButtonGroup />)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('should handle undefined children', () => {
      render(<ButtonGroup>{undefined}</ButtonGroup>)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('should handle children with empty className', () => {
      render(
        <ButtonGroup>
          <MockButton className="">Button</MockButton>
        </ButtonGroup>
      )
      const button = screen.getByText('Button')
      expect(button).toBeInTheDocument()
    })

    it('should handle invalid variant gracefully', () => {
      render(
        <ButtonGroup variant="invalid">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('should handle invalid size gracefully', () => {
      render(
        <ButtonGroup size="invalid">
          <MockButton>Button</MockButton>
        </ButtonGroup>
      )
      expect(screen.getByRole('group')).toBeInTheDocument()
    })
  })
})

export default MockButton
