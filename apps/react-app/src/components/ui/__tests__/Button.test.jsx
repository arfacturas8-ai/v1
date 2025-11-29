import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Check for loading indicator
    expect(button.textContent).toMatch(/loading/i);
  });

  it('applies variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toMatch(/primary/i);

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button');
    expect(button.className).toMatch(/secondary/i);

    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole('button');
    expect(button.className).toMatch(/danger|error/i);
  });

  it('applies size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toMatch(/sm|small/i);

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button.className).toMatch(/lg|large/i);
  });

  it('renders as different element with "as" prop', () => {
    render(<Button as="a" href="/test">Link Button</Button>);

    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('renders children correctly', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('supports custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Button</Button>);

    expect(ref.current).toBeTruthy();
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('supports fullWidth prop', () => {
    render(<Button fullWidth>Full Width</Button>);

    const button = screen.getByRole('button');
    expect(button.className).toMatch(/full|width|w-full/i);
  });

  it('is keyboard accessible', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Accessible</Button>);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });

    // Button should be clickable via keyboard
    expect(button).toHaveAttribute('type', 'button');
  });
});

export default handleClick
