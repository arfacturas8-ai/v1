/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  Switch,
  SwitchGroup,
  SwitchCard,
  ControlledSwitchGroup,
} from './switch';
import { Bell, Moon } from 'lucide-react';

describe('Switch Component', () => {
  describe('Basic Rendering', () => {
    test('renders switch component', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    test('renders with default unchecked state', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    test('renders with label', () => {
      render(<Switch label="Enable notifications" id="notifications" />);
      expect(screen.getByText('Enable notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable notifications')).toBeInTheDocument();
    });

    test('renders with description', () => {
      render(
        <Switch
          label="Dark mode"
          description="Toggle dark mode theme"
          id="dark-mode"
        />
      );
      expect(screen.getByText('Dark mode')).toBeInTheDocument();
      expect(screen.getByText('Toggle dark mode theme')).toBeInTheDocument();
    });

    test('renders without label and description', () => {
      render(<Switch data-testid="standalone-switch" />);
      expect(screen.getByTestId('standalone-switch')).toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    test('toggles on click - uncontrolled', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
      expect(switchElement).toHaveAttribute('data-state', 'checked');

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    test('calls onCheckedChange callback when toggled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Switch onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);

      await user.click(switchElement);
      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    test('works as controlled component', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <Switch checked={false} onCheckedChange={handleChange} />
      );
      const switchElement = screen.getByRole('switch');

      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      await user.click(switchElement);
      expect(handleChange).toHaveBeenCalledWith(true);

      // Simulate parent component updating the state
      rerender(<Switch checked={true} onCheckedChange={handleChange} />);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    test('uncontrolled component maintains own state', async () => {
      const user = userEvent.setup();
      render(<Switch defaultChecked={false} />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    test('starts with checked state when defaultChecked is true', () => {
      render(<Switch defaultChecked={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Disabled State', () => {
    test('renders disabled switch', () => {
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });

    test('does not toggle when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Switch disabled onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      expect(handleChange).not.toHaveBeenCalled();
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    test('applies disabled styles to label', () => {
      render(<Switch disabled label="Disabled switch" id="disabled-switch" />);
      const label = screen.getByText('Disabled switch');
      expect(label).toHaveClass('cursor-not-allowed', 'opacity-70');
    });

    test('is disabled when loading', () => {
      render(<Switch loading />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });

    test('shows loading indicator when loading', () => {
      const { container } = render(<Switch loading />);
      const loadingIndicator = container.querySelector('.h-2.w-2.rounded-full');
      expect(loadingIndicator).toBeInTheDocument();
    });
  });

  describe('Keyboard Interaction', () => {
    test('toggles on Space key', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      expect(switchElement).toHaveFocus();

      await user.keyboard(' ');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');

      await user.keyboard(' ');
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    test('toggles on Enter key', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      await user.keyboard('{Enter}');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    test('can be focused', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      expect(switchElement).toHaveFocus();
    });

    test('does not toggle when disabled and Space is pressed', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Switch disabled onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      switchElement.focus();
      await user.keyboard(' ');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has role="switch"', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    test('has correct aria-checked attribute', () => {
      render(<Switch checked={true} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    test('updates aria-checked when toggled', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    test('label is associated with switch via htmlFor', () => {
      render(<Switch label="Test label" id="test-switch" />);
      const label = screen.getByText('Test label');
      expect(label).toHaveAttribute('for', 'test-switch');
    });

    test('has proper focus-visible styles', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector(
        '.focus-visible\\:outline-none.focus-visible\\:ring-2'
      );
      expect(switchElement).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    test('renders small size', () => {
      const { container } = render(<Switch size="sm" />);
      const switchElement = container.querySelector('.h-5.w-9');
      expect(switchElement).toBeInTheDocument();
    });

    test('renders default size', () => {
      const { container } = render(<Switch size="default" />);
      const switchElement = container.querySelector('.h-6.w-11');
      expect(switchElement).toBeInTheDocument();
    });

    test('renders large size', () => {
      const { container } = render(<Switch size="lg" />);
      const switchElement = container.querySelector('.h-7.w-14');
      expect(switchElement).toBeInTheDocument();
    });

    test('applies default size when not specified', () => {
      const { container } = render(<Switch />);
      const switchElement = container.querySelector('.h-6.w-11');
      expect(switchElement).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    test('renders default variant', () => {
      render(<Switch variant="default" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    test('renders success variant', () => {
      render(<Switch variant="success" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    test('renders destructive variant', () => {
      render(<Switch variant="destructive" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    test('renders gradient variant', () => {
      render(<Switch variant="gradient" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    test('renders neon variant', () => {
      render(<Switch variant="neon" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    test('renders glass variant', () => {
      render(<Switch variant="glass" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    test('does not show icons by default', () => {
      const { container } = render(<Switch checked={true} />);
      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    test('shows default icons when showIcons is true', () => {
      const { container } = render(<Switch showIcons checked={false} />);
      // Check for X icon (lucide-react X component)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    test('shows check icon when checked and showIcons is true', () => {
      const { container } = render(<Switch showIcons checked={true} />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    test('shows custom checked icon', () => {
      render(
        <Switch
          showIcons
          checked={true}
          checkedIcon={<Bell data-testid="custom-checked-icon" />}
        />
      );
      expect(screen.getByTestId('custom-checked-icon')).toBeInTheDocument();
    });

    test('shows custom unchecked icon', () => {
      render(
        <Switch
          showIcons
          checked={false}
          uncheckedIcon={<Moon data-testid="custom-unchecked-icon" />}
        />
      );
      expect(screen.getByTestId('custom-unchecked-icon')).toBeInTheDocument();
    });

    test('hides icons when loading', () => {
      const { container } = render(<Switch showIcons loading checked={true} />);
      // Should show loading indicator instead of icons
      const loadingIndicator = container.querySelector('.h-2.w-2.rounded-full');
      expect(loadingIndicator).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    test('forwards ref to switch element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Switch ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveAttribute('role', 'switch');
    });

    test('ref can be used to programmatically focus', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Switch ref={ref} />);
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    test('accepts custom className', () => {
      render(<Switch className="custom-class" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('custom-class');
    });

    test('accepts id prop', () => {
      render(<Switch id="custom-id" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('id', 'custom-id');
    });

    test('accepts name prop', () => {
      render(<Switch name="custom-name" />);
      const switchElement = screen.getByRole('switch');
      // Radix Switch passes name prop through
      expect(switchElement).toBeInTheDocument();
    });

    test('accepts data-testid', () => {
      render(<Switch data-testid="my-switch" />);
      expect(screen.getByTestId('my-switch')).toBeInTheDocument();
    });
  });
});

describe('SwitchGroup Component', () => {
  test('renders switch group', () => {
    render(
      <SwitchGroup>
        <Switch label="Option 1" id="opt1" />
        <Switch label="Option 2" id="opt2" />
      </SwitchGroup>
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  test('renders with group label', () => {
    render(
      <SwitchGroup label="Settings">
        <Switch label="Option 1" id="opt1" />
      </SwitchGroup>
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('renders with group description', () => {
    render(
      <SwitchGroup label="Settings" description="Configure your preferences">
        <Switch label="Option 1" id="opt1" />
      </SwitchGroup>
    );
    expect(screen.getByText('Configure your preferences')).toBeInTheDocument();
  });

  test('renders vertical orientation by default', () => {
    const { container } = render(
      <SwitchGroup>
        <Switch label="Option 1" id="opt1" />
      </SwitchGroup>
    );
    const verticalContainer = container.querySelector('.space-y-3');
    expect(verticalContainer).toBeInTheDocument();
  });

  test('renders horizontal orientation', () => {
    const { container } = render(
      <SwitchGroup orientation="horizontal">
        <Switch label="Option 1" id="opt1" />
      </SwitchGroup>
    );
    const horizontalContainer = container.querySelector('.flex.flex-wrap');
    expect(horizontalContainer).toBeInTheDocument();
  });

  test('forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SwitchGroup ref={ref}>
        <Switch label="Option 1" id="opt1" />
      </SwitchGroup>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  test('accepts custom className', () => {
    const { container } = render(
      <SwitchGroup className="custom-group-class">
        <Switch label="Option 1" id="opt1" />
      </SwitchGroup>
    );
    const groupElement = container.querySelector('.custom-group-class');
    expect(groupElement).toBeInTheDocument();
  });
});

describe('SwitchCard Component', () => {
  test('renders switch card with title', () => {
    render(<SwitchCard title="Enable feature" />);
    expect(screen.getByText('Enable feature')).toBeInTheDocument();
  });

  test('renders with card description', () => {
    render(
      <SwitchCard
        title="Dark mode"
        cardDescription="Switch to dark theme"
      />
    );
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
    expect(screen.getByText('Switch to dark theme')).toBeInTheDocument();
  });

  test('renders with icon', () => {
    render(
      <SwitchCard
        title="Notifications"
        icon={<Bell data-testid="card-icon" />}
      />
    );
    expect(screen.getByTestId('card-icon')).toBeInTheDocument();
  });

  test('renders default card variant', () => {
    const { container } = render(
      <SwitchCard title="Feature" cardVariant="default" />
    );
    const card = container.querySelector('.bg-card.border.border-border');
    expect(card).toBeInTheDocument();
  });

  test('renders glass card variant', () => {
    const { container } = render(
      <SwitchCard title="Feature" cardVariant="glass" />
    );
    const card = container.querySelector('.bg-background\\/80.backdrop-blur-sm');
    expect(card).toBeInTheDocument();
  });

  test('renders gradient card variant', () => {
    const { container } = render(
      <SwitchCard title="Feature" cardVariant="gradient" />
    );
    const card = container.querySelector('.bg-gradient-to-br');
    expect(card).toBeInTheDocument();
  });

  test('switch inside card is functional', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<SwitchCard title="Feature" onCheckedChange={handleChange} />);

    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  test('forwards ref to switch', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<SwitchCard title="Feature" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  test('accepts switch variant and size', () => {
    render(<SwitchCard title="Feature" variant="success" size="lg" />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
  });
});

describe('ControlledSwitchGroup Component', () => {
  const mockOptions = [
    { id: 'opt1', label: 'Option 1', description: 'First option' },
    { id: 'opt2', label: 'Option 2', description: 'Second option' },
    { id: 'opt3', label: 'Option 3' },
  ];

  test('renders all options', () => {
    const handleChange = jest.fn();
    render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={[]}
        onValueChange={handleChange}
      />
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  test('renders option descriptions', () => {
    const handleChange = jest.fn();
    render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={[]}
        onValueChange={handleChange}
      />
    );
    expect(screen.getByText('First option')).toBeInTheDocument();
    expect(screen.getByText('Second option')).toBeInTheDocument();
  });

  test('shows checked state for selected values', () => {
    const handleChange = jest.fn();
    render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={['opt1', 'opt3']}
        onValueChange={handleChange}
      />
    );
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
    expect(switches[2]).toHaveAttribute('aria-checked', 'true');
  });

  test('calls onValueChange when toggled on', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={[]}
        onValueChange={handleChange}
      />
    );

    const switches = screen.getAllByRole('switch');
    await user.click(switches[0]);
    expect(handleChange).toHaveBeenCalledWith(['opt1']);
  });

  test('calls onValueChange when toggled off', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={['opt1', 'opt2']}
        onValueChange={handleChange}
      />
    );

    const switches = screen.getAllByRole('switch');
    await user.click(switches[0]);
    expect(handleChange).toHaveBeenCalledWith(['opt2']);
  });

  test('handles multiple selections', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={['opt1']}
        onValueChange={handleChange}
      />
    );

    const switches = screen.getAllByRole('switch');
    await user.click(switches[1]);
    expect(handleChange).toHaveBeenCalledWith(['opt1', 'opt2']);
  });

  test('renders vertical orientation by default', () => {
    const handleChange = jest.fn();
    const { container } = render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={[]}
        onValueChange={handleChange}
      />
    );
    const verticalContainer = container.querySelector('.space-y-3');
    expect(verticalContainer).toBeInTheDocument();
  });

  test('renders horizontal orientation', () => {
    const handleChange = jest.fn();
    const { container } = render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={[]}
        onValueChange={handleChange}
        orientation="horizontal"
      />
    );
    const horizontalContainer = container.querySelector('.flex.flex-wrap');
    expect(horizontalContainer).toBeInTheDocument();
  });

  test('accepts variant and size props', () => {
    const handleChange = jest.fn();
    render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={[]}
        onValueChange={handleChange}
        variant="success"
        size="lg"
      />
    );
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(3);
  });

  test('accepts custom className', () => {
    const handleChange = jest.fn();
    const { container } = render(
      <ControlledSwitchGroup
        options={mockOptions}
        value={[]}
        onValueChange={handleChange}
        className="custom-controlled-class"
      />
    );
    const groupElement = container.querySelector('.custom-controlled-class');
    expect(groupElement).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  test('multiple switches work independently', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Switch data-testid="switch1" />
        <Switch data-testid="switch2" />
      </div>
    );

    const switch1 = screen.getByTestId('switch1');
    const switch2 = screen.getByTestId('switch2');

    await user.click(switch1);
    expect(switch1).toHaveAttribute('aria-checked', 'true');
    expect(switch2).toHaveAttribute('aria-checked', 'false');

    await user.click(switch2);
    expect(switch1).toHaveAttribute('aria-checked', 'true');
    expect(switch2).toHaveAttribute('aria-checked', 'true');
  });

  test('form integration with id attribute', () => {
    render(
      <form data-testid="test-form">
        <Switch name="notifications" id="notifications" />
      </form>
    );
    const form = screen.getByTestId('test-form');
    const switchElement = within(form).getByRole('switch');
    expect(switchElement).toHaveAttribute('id', 'notifications');
  });

  test('complex controlled state management', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [checked, setChecked] = React.useState(false);
      return (
        <div>
          <Switch checked={checked} onCheckedChange={setChecked} />
          <span data-testid="state-display">{checked ? 'ON' : 'OFF'}</span>
        </div>
      );
    };

    render(<TestComponent />);
    expect(screen.getByTestId('state-display')).toHaveTextContent('OFF');

    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);
    expect(screen.getByTestId('state-display')).toHaveTextContent('ON');
  });

  test('handles rapid toggling', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<Switch onCheckedChange={handleChange} />);
    const switchElement = screen.getByRole('switch');

    await user.click(switchElement);
    await user.click(switchElement);
    await user.click(switchElement);
    await user.click(switchElement);

    expect(handleChange).toHaveBeenCalledTimes(4);
  });
});
